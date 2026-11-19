<?php
/* Coastal Chaos: Sunset Shores — servidor do modo ONLINE (Apache + PHP + SQLite).
   Sem conexão persistente: cada jogador faz um POST ~6×/s com o próprio estado e recebe o dos outros na resposta.
   Ações (?a=):
     join  {name, look, car:{type,color,plate}}  -> {id, token, seed, size, day, tod, last}
     tick  {token, s, look?, kv, since, ev:[...]} -> {now, tod, players:[...], ev:[...], last}
     leave {token}
     info                                         -> {players, max, day, seed}
   A cidade inteira sai da seed (igual para todos); o servidor só guarda jogadores e eventos (chat, dano, mortes). */
declare(strict_types=1);
const MAX_PLAYERS = 24;      // jogadores por sessão
const CITY_SIZE   = 7;       // 7 = 7×7 (14 = 14×14, mais pesado no celular)
const TIMEOUT     = 15.0;    // s sem tick = saiu
const EV_KEEP     = 90.0;    // s que um evento fica guardado
const TZ          = 'America/Sao_Paulo';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
/* o jogo pode estar em outro endereço (campo SERVIDOR do menu): libera CORS; não usa cookies, só o token no corpo */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
date_default_timezone_set(TZ);

function out(array $o, int $code = 200): void { http_response_code($code); echo json_encode($o, JSON_UNESCAPED_UNICODE); exit; }
function fail(string $msg, int $code = 400): void { out(['ok' => false, 'err' => $msg], $code); }
function now(): float { return microtime(true); }

function db(): PDO {
  $dir = getenv('CCSS_DATA') ?: (__DIR__ . '/data');   /* CCSS_DATA = pasta do banco fora do site (Docker) */
  if (!is_dir($dir)) { @mkdir($dir, 0775, true); @file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n"); }
  if (!is_writable($dir)) fail('servidor sem permissão de escrita em ' . $dir . ' (dono deve ser o usuário do Apache, www-data/uid 33)', 500);
  $pdo = new PDO('sqlite:' . $dir . '/online.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
  $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=3000;');
  $pdo->exec('CREATE TABLE IF NOT EXISTS players(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, name_lc TEXT NOT NULL UNIQUE, token TEXT NOT NULL UNIQUE,
              look TEXT, lookv INTEGER DEFAULT 1, state TEXT, seen REAL, joined REAL, kills INTEGER DEFAULT 0, deaths INTEGER DEFAULT 0, chatT REAL DEFAULT 0)');
  $pdo->exec('CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT, t REAL, src INTEGER, dst INTEGER, kind TEXT, data TEXT)');
  return $pdo;
}
/* seed do dia: igual para todo mundo, muda à meia-noite (horário de Brasília) */
function daySeed(): array { $day = date('Y-m-d'); return [$day, crc32('ccss-online|' . $day) & 0x7fffffff]; }
/* relógio do jogo: 1 minuto de jogo por segundo real (o mesmo ritmo do jogo); o dia de jogo dura 24 min reais */
function gameTod(): float { $t = now(); return fmod($t, 1440.0); }
function cleanup(PDO $db): void {
  $cut = now() - TIMEOUT;
  $gone = $db->prepare('SELECT id, name FROM players WHERE seen < ?'); $gone->execute([$cut]);
  foreach ($gone->fetchAll() as $g) { addEv($db, 0, 0, 'sys', ['m' => $g['name'] . ' saiu', 'en' => $g['name'] . ' left', 'left' => (int)$g['id']]); }
  $db->prepare('DELETE FROM players WHERE seen < ?')->execute([$cut]);
  $db->prepare('DELETE FROM events WHERE t < ?')->execute([now() - EV_KEEP]);
}
function addEv(PDO $db, int $src, int $dst, string $kind, array $data): void {
  $db->prepare('INSERT INTO events(t,src,dst,kind,data) VALUES(?,?,?,?,?)')->execute([now(), $src, $dst, $kind, json_encode($data, JSON_UNESCAPED_UNICODE)]);
}
function lastEv(PDO $db): int { return (int)$db->query('SELECT IFNULL(MAX(id),0) m FROM events')->fetch()['m']; }
function body(): array { $raw = file_get_contents('php://input') ?: ''; if (strlen($raw) > 24000) fail('pacote grande demais', 413); $j = json_decode($raw, true); return is_array($j) ? $j : []; }
function me(PDO $db, $token): array {
  if (!is_string($token) || !preg_match('/^[a-f0-9]{32}$/', $token)) fail('sessão inválida', 401);
  $q = $db->prepare('SELECT * FROM players WHERE token = ?'); $q->execute([$token]); $p = $q->fetch();
  if (!$p) fail('sessão expirada', 401);
  return $p;
}
/* aparência e estado: só JSON pequeno e plano (nada de HTML); o cliente desenha com textContent */
function cleanJson($v, int $max): ?string { if ($v === null) return null; $s = json_encode($v, JSON_UNESCAPED_UNICODE); return ($s !== false && strlen($s) <= $max) ? $s : null; }

$a = $_GET['a'] ?? '';
try {
  $db = db();
  if ($a === 'info') {
    cleanup($db); [$day, $seed] = daySeed();
    $n = (int)$db->query('SELECT COUNT(*) n FROM players')->fetch()['n'];
    out(['ok' => true, 'players' => $n, 'max' => MAX_PLAYERS, 'day' => $day, 'seed' => $seed, 'size' => CITY_SIZE]);
  }
  if ($a === 'join') {
    $b = body();
    $name = trim(preg_replace('/\s+/u', ' ', (string)($b['name'] ?? '')));
    if (mb_strlen($name) < 3 || mb_strlen($name) > 16 || !preg_match('/^[\p{L}\p{N} _.\-]+$/u', $name)) fail('NOME INVÁLIDO · 3 A 16 LETRAS/NÚMEROS');
    $look = cleanJson($b['look'] ?? null, 4000); if ($look === null) fail('aparência inválida');
    $db->beginTransaction();
    cleanup($db);
    $q = $db->prepare('SELECT id FROM players WHERE name_lc = ?'); $q->execute([mb_strtolower($name)]);
    if ($q->fetch()) { $db->rollBack(); fail('NOME EM USO · ESCOLHA OUTRO', 409); }
    $n = (int)$db->query('SELECT COUNT(*) n FROM players')->fetch()['n'];
    if ($n >= MAX_PLAYERS) { $db->rollBack(); fail('SERVIDOR CHEIO · ' . MAX_PLAYERS . ' JOGADORES', 503); }
    $token = bin2hex(random_bytes(16)); $t = now();
    $db->prepare('INSERT INTO players(name,name_lc,token,look,lookv,state,seen,joined) VALUES(?,?,?,?,1,NULL,?,?)')->execute([$name, mb_strtolower($name), $token, $look, $t, $t]);
    $id = (int)$db->lastInsertId();
    $last = lastEv($db);
    addEv($db, 0, 0, 'sys', ['m' => $name . ' entrou', 'en' => $name . ' joined']);
    $db->commit();
    [$day, $seed] = daySeed();
    out(['ok' => true, 'id' => $id, 'name' => $name, 'token' => $token, 'seed' => $seed, 'size' => CITY_SIZE, 'day' => $day, 'tod' => gameTod(), 'last' => $last, 'max' => MAX_PLAYERS]);
  }
  if ($a === 'tick') {
    $b = body(); $p = me($db, $b['token'] ?? null); $id = (int)$p['id']; $t = now();
    $state = cleanJson($b['s'] ?? null, 2000);
    $db->beginTransaction();
    if (array_key_exists('look', $b) && ($lk = cleanJson($b['look'], 4000)) !== null) {
      $db->prepare('UPDATE players SET look=?, lookv=lookv+1 WHERE id=?')->execute([$lk, $id]);
    }
    $db->prepare('UPDATE players SET state=?, seen=? WHERE id=?')->execute([$state, $t, $id]);
    /* eventos do jogador: chat, dano em outro jogador, morte (quem matou), explosão */
    $evs = is_array($b['ev'] ?? null) ? array_slice($b['ev'], 0, 12) : [];
    foreach ($evs as $e) {
      if (!is_array($e)) continue; $k = (string)($e['k'] ?? '');
      if ($k === 'chat') {
        $m = trim(mb_substr(preg_replace('/[\x00-\x1F\x7F]/u', '', (string)($e['m'] ?? '')), 0, 120));
        if ($m === '' || $t - (float)$p['chatT'] < 0.6) continue;
        $db->prepare('UPDATE players SET chatT=? WHERE id=?')->execute([$t, $id]); $p['chatT'] = $t;
        addEv($db, $id, 0, 'chat', ['n' => $p['name'], 'm' => $m]);
      } elseif ($k === 'hit') {
        $to = (int)($e['to'] ?? 0); $d = max(0.0, min(250.0, (float)($e['d'] ?? 0)));
        if ($to > 0 && $to !== $id && $d > 0) addEv($db, $id, $to, 'hit', ['d' => $d, 'car' => !empty($e['car']), 'w' => mb_substr((string)($e['w'] ?? ''), 0, 12)]);
      } elseif ($k === 'dead') {
        $by = (int)($e['by'] ?? 0);
        $db->prepare('UPDATE players SET deaths=deaths+1 WHERE id=?')->execute([$id]);
        $killer = null;
        if ($by > 0 && $by !== $id) { $db->prepare('UPDATE players SET kills=kills+1 WHERE id=?')->execute([$by]);
          $q = $db->prepare('SELECT name FROM players WHERE id=?'); $q->execute([$by]); $killer = $q->fetch()['name'] ?? null; }
        addEv($db, $id, 0, 'dead', ['n' => $p['name'], 'by' => $killer, 'byId' => $by]);
      } elseif ($k === 'boom') {
        addEv($db, $id, 0, 'boom', ['x' => (float)($e['x'] ?? 0), 'z' => (float)($e['z'] ?? 0)]);
      }
    }
    $db->commit();
    if (mt_rand(0, 19) === 0) cleanup($db);
    /* jogadores: aparência só para quem ainda não tem a versão atual (kv = "id:versão,...") */
    $known = [];
    foreach (explode(',', (string)($b['kv'] ?? '')) as $pair) { $kv = explode(':', $pair); if (count($kv) === 2) $known[(int)$kv[0]] = (int)$kv[1]; }
    $rows = $db->prepare('SELECT id,name,look,lookv,state,seen,kills,deaths FROM players WHERE id<>? AND seen>=?'); $rows->execute([$id, $t - TIMEOUT]);
    $players = [];
    foreach ($rows->fetchAll() as $r) {
      $o = ['id' => (int)$r['id'], 'n' => $r['name'], 'lv' => (int)$r['lookv'], 's' => $r['state'] ? json_decode($r['state'], true) : null, 'age' => round($t - (float)$r['seen'], 3), 'k' => (int)$r['kills'], 'd' => (int)$r['deaths']];
      if (($known[(int)$r['id']] ?? -1) !== (int)$r['lookv']) $o['look'] = json_decode((string)$r['look'], true);
      $players[] = $o;
    }
    $since = max(0, (int)($b['since'] ?? 0));
    $q = $db->prepare('SELECT id,t,src,dst,kind,data FROM events WHERE id>? AND (dst=0 OR dst=?) ORDER BY id LIMIT 60'); $q->execute([$since, $id]);
    $ev = []; $last = $since;
    foreach ($q->fetchAll() as $e) { $last = (int)$e['id']; if ((int)$e['src'] === $id && $e['kind'] !== 'dead' && $e['kind'] !== 'chat') continue;
      $ev[] = ['id' => (int)$e['id'], 'k' => $e['kind'], 'src' => (int)$e['src'], 'd' => json_decode((string)$e['data'], true)]; }
    out(['ok' => true, 'now' => $t, 'tod' => gameTod(), 'players' => $players, 'ev' => $ev, 'last' => $last, 'me' => ['k' => (int)$p['kills'], 'd' => (int)$p['deaths']]]);
  }
  if ($a === 'leave') {
    $b = body(); $token = $b['token'] ?? ($_GET['token'] ?? null);
    if (is_string($token) && preg_match('/^[a-f0-9]{32}$/', $token)) {
      $q = $db->prepare('SELECT id,name FROM players WHERE token=?'); $q->execute([$token]);
      if ($p = $q->fetch()) { $db->prepare('DELETE FROM players WHERE id=?')->execute([$p['id']]); addEv($db, 0, 0, 'sys', ['m' => $p['name'] . ' saiu', 'en' => $p['name'] . ' left', 'left' => (int)$p['id']]); }
    }
    out(['ok' => true]);
  }
  fail('ação desconhecida', 404);
} catch (Throwable $e) {
  if (isset($db) && $db->inTransaction()) $db->rollBack();
  error_log('[ccss online] ' . $e->getMessage());
  fail('erro no servidor', 500);
}
