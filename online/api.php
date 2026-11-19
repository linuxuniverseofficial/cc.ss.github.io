<?php
/* Coastal Chaos: Sunset Shores — servidor do modo ONLINE (Apache + PHP + SQLite).
   Sem conexão persistente: cada jogador faz um POST ~6×/s com o próprio estado e recebe o dos outros na resposta.
   Ações (?a=):
     join  {name, look, car:{type,color,plate}}  -> {id, token, seed, size, day, tod, last}
     tick  {token, s, look?, kv, since, ev:[...]} -> {now, tod, players:[...], ev:[...], last}
     leave {token}
     info                                         -> {players, max, day, seed}
   r14: tick também leva ws (versão do mundo que o cliente já tem) e recebe w (carros do servidor, coletáveis pegos, drops).
   Eventos novos: car {id, drv|dead, t,col,pl,x,z,a}, pk {id}, drop {x,z,w,am,m}, loot {id} (o primeiro leva), jack {to}, ride {to}.
   r16: join leva pass (mín. 6) e devolve acct (dados salvos) + new; tick aceita save {..} (vai para a conta); evento pay {to,m}.
   r17: join devolve house (0..23, -1 = sem casa).
   r15: wx {d} = estado do clima do jogador de menor id (os outros copiam).
   A cidade inteira sai da seed (igual para todos); o servidor só guarda jogadores e eventos (chat, dano, mortes). */
declare(strict_types=1);
const MAX_PLAYERS = 24;      // jogadores por sessão
const CITY_SIZE   = 14;      // 14×14 (o celular aguenta depois das otimizações da v2)
const TIMEOUT     = 45.0;    // s sem tick = saiu (aba em 2º plano no celular segura o timer; o cliente reentra sozinho)
const PK_RESPAWN  = 300.0;   // s para um coletável pego voltar para todos
const DROP_TTL    = 180.0;   // s que o drop de quem morreu fica no chão
const WORLD_GONE  = 900.0;
const START_MONEY = 500;     // dinheiro de quem cria a conta
const ACCOUNT_TTL = 30 * 86400.0; // conta sem entrar há 30 dias é apagada (o nome fica livre)
const PASS_MIN    = 6;
const HOUSES      = 24;      // casas seguras do online: uma por conta (a 25ª conta fica sem)   // s que uma remoção fica guardada para quem está sincronizando
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
  /* r14: estado do mundo compartilhado (carros do servidor, coletáveis pegos, drops). v = versão global; o cliente pede só o que mudou */
  $pdo->exec('CREATE TABLE IF NOT EXISTS world(k TEXT PRIMARY KEY, kind TEXT, data TEXT, owner INTEGER DEFAULT 0, v INTEGER, t REAL, gone INTEGER DEFAULT 0, day TEXT)');
  $pdo->exec('CREATE INDEX IF NOT EXISTS world_v ON world(v)');
  $pdo->exec('CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v INTEGER)');
  /* r16: contas (nome + senha). data = o que o cliente salva (dinheiro, armas, carro pessoal...) */
  $pdo->exec('CREATE TABLE IF NOT EXISTS accounts(name_lc TEXT PRIMARY KEY, name TEXT, pass TEXT, data TEXT, created REAL, seen REAL)');
  /* r17: casa segura de cada conta (índice 0..HOUSES-1, -1 = sem casa) */
  $cols = array_column($pdo->query('PRAGMA table_info(accounts)')->fetchAll(), 'name'); if (!in_array('house', $cols, true)) $pdo->exec('ALTER TABLE accounts ADD COLUMN house INTEGER DEFAULT -1');
  return $pdo;
}
function nextV(PDO $db): int {
  $u = $db->prepare("UPDATE meta SET v=v+1 WHERE k='wv'"); $u->execute();
  if ($u->rowCount() === 0) $db->exec("INSERT INTO meta(k,v) VALUES('wv',1)");
  return (int)$db->query("SELECT v FROM meta WHERE k='wv'")->fetch()['v'];
}
function wget(PDO $db, string $k): ?array { $q = $db->prepare('SELECT * FROM world WHERE k=?'); $q->execute([$k]); $r = $q->fetch(); return $r ?: null; }
function wput(PDO $db, string $k, string $kind, ?array $data, int $owner, int $gone): void {
  $v = nextV($db); [$day] = daySeed();
  $db->prepare('INSERT INTO world(k,kind,data,owner,v,t,gone,day) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(k) DO UPDATE SET kind=excluded.kind, data=excluded.data, owner=excluded.owner, v=excluded.v, t=excluded.t, gone=excluded.gone, day=excluded.day')
     ->execute([$k, $kind, $data === null ? null : json_encode($data, JSON_UNESCAPED_UNICODE), $owner, $v, now(), $gone, $day]);
}
function wkey($v): ?string { $v = (string)$v; return preg_match('/^[\w:.,\-]{1,64}$/', $v) ? $v : null; }
function num($v, float $lo, float $hi): float { $f = is_numeric($v) ? (float)$v : 0.0; return max($lo, min($hi, $f)); }
/* dados de carro: só campos conhecidos */
function carData(array $e, ?array $old): array {
  $d = $old ?: [];
  if (isset($e['t'])) $d['t'] = mb_substr(preg_replace('/[^a-z0-9_]/', '', (string)$e['t']), 0, 16);
  if (isset($e['col'])) $d['col'] = preg_match('/^#[0-9a-fA-F]{6}$/', (string)$e['col']) ? (string)$e['col'] : null;
  if (isset($e['pl'])) $d['pl'] = mb_substr(preg_replace('/[^A-Z0-9 \-]/', '', strtoupper((string)$e['pl'])), 0, 8);
  foreach (['x', 'z'] as $c) if (isset($e[$c])) $d[$c] = round(num($e[$c], -2000, 4000), 2);
  if (isset($e['a'])) $d['a'] = round(num($e['a'], -7, 7), 3);
  return $d;
}
/* seed do dia: igual para todo mundo, muda à meia-noite (horário de Brasília) */
function daySeed(): array { $day = date('Y-m-d'); return [$day, crc32('ccss-online|' . $day) & 0x7fffffff]; }
/* relógio do jogo: 1 minuto de jogo por segundo real (o mesmo ritmo do jogo); o dia de jogo dura 24 min reais */
function gameTod(): float { $t = now(); return fmod($t, 1440.0); }
function cleanup(PDO $db): void {
  $cut = now() - TIMEOUT; $t = now();
  $gone = $db->prepare('SELECT id, name, state FROM players WHERE seen < ?'); $gone->execute([$cut]);
  foreach ($gone->fetchAll() as $g) { addEv($db, 0, 0, 'sys', ['m' => $g['name'] . ' saiu', 'en' => $g['name'] . ' left', 'left' => (int)$g['id']]); releaseCars($db, (int)$g['id'], $g['state']); }
  $db->prepare('DELETE FROM players WHERE seen < ?')->execute([$cut]);
  $db->prepare('DELETE FROM events WHERE t < ?')->execute([$t - EV_KEEP]);
  /* mundo: coletáveis voltam, drops somem, remoções antigas e o mundo de ontem são apagados */
  [$day] = daySeed();
  $db->prepare('DELETE FROM world WHERE day <> ?')->execute([$day]);
  $q = $db->prepare("SELECT k, kind, data FROM world WHERE gone=0 AND ((kind='pk' AND t<?) OR (kind='drop' AND t<?))"); $q->execute([$t - PK_RESPAWN, $t - DROP_TTL]);
  foreach ($q->fetchAll() as $r) wput($db, $r['k'], $r['kind'], null, 0, 1);
  $db->prepare('DELETE FROM world WHERE gone=1 AND t<?')->execute([$t - WORLD_GONE]);
  $db->prepare('DELETE FROM accounts WHERE seen<?')->execute([$t - ACCOUNT_TTL]);
}
/* jogador saiu dirigindo: o carro fica onde ele estava para todos */
function releaseCars(PDO $db, int $id, ?string $state): void {
  $s = $state ? json_decode($state, true) : null; $c = is_array($s) && isset($s['c']) && is_array($s['c']) ? $s['c'] : null;
  $q = $db->prepare("SELECT k, data FROM world WHERE kind='car' AND owner=? AND gone=0"); $q->execute([$id]);
  foreach ($q->fetchAll() as $r) { $d = json_decode((string)$r['data'], true) ?: [];
    if ($c && isset($c['sid']) && 'car:' . $c['sid'] === $r['k']) $d = carData($c, $d);
    wput($db, $r['k'], 'car', $d, 0, 0); }
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
    $pass = (string)($b['pass'] ?? ''); if (mb_strlen($pass) < PASS_MIN || mb_strlen($pass) > 64) fail('SENHA · MÍNIMO 6 CARACTERES');
    $lc = mb_strtolower($name);
    $db->beginTransaction();
    cleanup($db);
    /* conta: existe → confere a senha; não existe → cria com o dinheiro inicial */
    $q = $db->prepare('SELECT * FROM accounts WHERE name_lc = ?'); $q->execute([$lc]); $acc = $q->fetch();
    if ($acc) { if (!password_verify($pass, (string)$acc['pass'])) { $db->rollBack(); fail('SENHA ERRADA · ESSE NOME JÁ TEM DONO', 403); } $isNew = false; }
    else { $acc = ['data' => json_encode(['m' => START_MONEY])]; $db->prepare('INSERT INTO accounts(name_lc,name,pass,data,created,seen) VALUES(?,?,?,?,?,?)')->execute([$lc, $name, password_hash($pass, PASSWORD_DEFAULT), $acc['data'], now(), now()]); $isNew = true; }
    $db->prepare('UPDATE accounts SET seen=?, name=? WHERE name_lc=?')->execute([now(), $name, $lc]);
    /* casa segura: a conta mantém a dela; sem casa → a primeira livre */
    $q = $db->prepare('SELECT house FROM accounts WHERE name_lc=?'); $q->execute([$lc]); $house = (int)($q->fetch()['house'] ?? -1);
    if ($house < 0) { $used = array_map('intval', array_column($db->query('SELECT house FROM accounts WHERE house>=0')->fetchAll(), 'house'));
      for ($h = 0; $h < HOUSES; $h++) if (!in_array($h, $used, true)) { $house = $h; break; }
      if ($house >= 0) $db->prepare('UPDATE accounts SET house=? WHERE name_lc=?')->execute([$house, $lc]); }
    /* senha certa e o nome ainda está "online" (sessão fantasma, outra aba): derruba a sessão velha */
    $q = $db->prepare('SELECT id, name, state FROM players WHERE name_lc = ?'); $q->execute([$lc]);
    if ($old = $q->fetch()) { releaseCars($db, (int)$old['id'], $old['state']); $db->prepare('DELETE FROM players WHERE id=?')->execute([$old['id']]); addEv($db, 0, 0, 'sys', ['m' => $old['name'] . ' saiu', 'en' => $old['name'] . ' left', 'left' => (int)$old['id']]); }
    $n = (int)$db->query('SELECT COUNT(*) n FROM players')->fetch()['n'];
    if ($n >= MAX_PLAYERS) { $db->rollBack(); fail('SERVIDOR CHEIO · ' . MAX_PLAYERS . ' JOGADORES', 503); }
    $token = bin2hex(random_bytes(16)); $t = now();
    $db->prepare('INSERT INTO players(name,name_lc,token,look,lookv,state,seen,joined) VALUES(?,?,?,?,1,NULL,?,?)')->execute([$name, mb_strtolower($name), $token, $look, $t, $t]);
    $id = (int)$db->lastInsertId();
    $last = lastEv($db);
    addEv($db, 0, 0, 'sys', ['m' => $name . ' entrou', 'en' => $name . ' joined']);
    $db->commit();
    [$day, $seed] = daySeed();
    out(['ok' => true, 'id' => $id, 'name' => $name, 'token' => $token, 'seed' => $seed, 'size' => CITY_SIZE, 'day' => $day, 'tod' => gameTod(), 'last' => $last, 'max' => MAX_PLAYERS, 'acct' => json_decode((string)$acc['data'], true) ?: [], 'new' => $isNew, 'house' => $house]);
  }
  if ($a === 'tick') {
    $b = body(); $p = me($db, $b['token'] ?? null); $id = (int)$p['id']; $t = now();
    $state = cleanJson($b['s'] ?? null, 2000);
    $db->beginTransaction();
    if (array_key_exists('look', $b) && ($lk = cleanJson($b['look'], 4000)) !== null) {
      $db->prepare('UPDATE players SET look=?, lookv=lookv+1 WHERE id=?')->execute([$lk, $id]);
    }
    $db->prepare('UPDATE players SET state=?, seen=? WHERE id=?')->execute([$state, $t, $id]);
    if (isset($b['save']) && ($sv = cleanJson($b['save'], 8000)) !== null) $db->prepare('UPDATE accounts SET data=?, seen=? WHERE name_lc=?')->execute([$sv, $t, $p['name_lc'] ?? mb_strtolower($p['name'])]);
    /* eventos do jogador: chat, dano em outro jogador, morte (quem matou), explosão */
    $evs = is_array($b['ev'] ?? null) ? array_slice($b['ev'], 0, 24) : [];
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
      } elseif ($k === 'car') {
        /* carro do servidor: drv=1 pegou, drv=0 estacionou (posição nova), dead=1 explodiu (some para todos) */
        $wk = wkey($e['id'] ?? ''); if (!$wk) continue; $wk = 'car:' . $wk; $r = wget($db, $wk);
        $old = $r && $r['data'] ? (json_decode((string)$r['data'], true) ?: []) : [];
        if (!empty($old['dead'])) continue;
        if (!empty($e['dead'])) { $old['dead'] = 1; wput($db, $wk, 'car', $old, 0, 0); continue; }
        $own = $r ? (int)$r['owner'] : 0;
        if (!empty($e['drv'])) {
          if ($own && $own !== $id) { $q = $db->prepare('SELECT 1 FROM players WHERE id=?'); $q->execute([$own]); if ($q->fetch()) continue; }
          wput($db, $wk, 'car', carData($e, $old), $id, 0);
        } else { if ($own && $own !== $id && empty($e['jk'])) continue; wput($db, $wk, 'car', carData($e, $old), 0, 0); }
      } elseif ($k === 'pk') {
        $wk = wkey($e['id'] ?? ''); if (!$wk) continue; $wk = 'pk:' . $wk; $r = wget($db, $wk);
        if (!$r || (int)$r['gone'] === 1) wput($db, $wk, 'pk', ['by' => $id], $id, 0);
      } elseif ($k === 'drop') {
        /* jogador morreu: arma da mão + parte do dinheiro ficam no chão para qualquer um pegar */
        $w = preg_replace('/[^a-z]/', '', (string)($e['w'] ?? '')); $am = (int)num($e['am'] ?? 0, 0, 9999); $m = (int)num($e['m'] ?? 0, 0, 100000);
        if (($w === '' || $am <= 0) && $m <= 0) continue;
        wput($db, 'drop:' . $id . ':' . mt_rand(1000, 999999), 'drop', ['x' => round(num($e['x'] ?? 0, -2000, 4000), 2), 'z' => round(num($e['z'] ?? 0, -2000, 4000), 2), 'w' => $w, 'am' => $am, 'm' => $m, 'n' => $p['name']], $id, 0);
      } elseif ($k === 'loot') {
        /* pegar um drop: o primeiro a pedir leva (transação) */
        $wk = wkey($e['id'] ?? ''); if (!$wk || strpos($wk, 'drop:') !== 0) continue; $r = wget($db, $wk);
        if ($r && (int)$r['gone'] === 0) { wput($db, $wk, 'drop', null, 0, 1); addEv($db, (int)$r['owner'], $id, 'loot', json_decode((string)$r['data'], true) ?: []); }
      } elseif ($k === 'wx') {
        /* clima: o "dono do clima" (cliente) manda o estado; guarda só o último */
        $d = $e['d'] ?? null; if (!is_array($d)) continue; $j = json_encode($d); if ($j === false || strlen($j) > 6000) continue;
        wput($db, 'wx:now', 'wx', $d, $id, 0);
      } elseif ($k === 'pay') {
        /* carona de táxi: o passageiro desconta do próprio dinheiro e o motorista recebe */
        $to = (int)($e['to'] ?? 0); $m = (int)num($e['m'] ?? 0, 0, 2000); if ($to > 0 && $to !== $id && $m > 0) addEv($db, $id, $to, 'pay', ['n' => $p['name'], 'm' => $m]);
      } elseif ($k === 'jack' || $k === 'ride') {
        $to = (int)($e['to'] ?? 0); if ($to > 0 && $to !== $id) addEv($db, $id, $to, $k, ['n' => $p['name']]);
      }
    }
    $db->commit();
    if (mt_rand(0, 19) === 0) { $db->beginTransaction(); cleanup($db); $db->commit(); }
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
    /* mundo: na primeira vez tudo o que existe; depois só o que mudou (v > ws) */
    $ws = max(0, (int)($b['ws'] ?? 0)); $w = []; $wv = $ws;
    if ($ws === 0) { $wv = (int)($db->query("SELECT IFNULL(v,0) v FROM meta WHERE k='wv'")->fetch()['v'] ?? 0); $q = $db->query('SELECT k,kind,data,owner,gone FROM world WHERE gone=0'); }
    else { $q = $db->prepare('SELECT k,kind,data,owner,gone,v FROM world WHERE v>? ORDER BY v LIMIT 300'); $q->execute([$ws]); }
    foreach ($q->fetchAll() as $r) { if ($ws) $wv = max($wv, (int)$r['v']); $w[] = ['k' => $r['k'], 'o' => (int)$r['owner'], 'g' => (int)$r['gone'], 'd' => $r['data'] ? json_decode((string)$r['data'], true) : null]; }
    out(['ok' => true, 'now' => $t, 'tod' => gameTod(), 'players' => $players, 'ev' => $ev, 'last' => $last, 'w' => $w, 'wv' => $wv, 'me' => ['k' => (int)$p['kills'], 'd' => (int)$p['deaths']]]);
  }
  if ($a === 'leave') {
    $b = body(); $token = $b['token'] ?? ($_GET['token'] ?? null);
    if (is_string($token) && preg_match('/^[a-f0-9]{32}$/', $token)) {
      $q = $db->prepare('SELECT id,name,name_lc FROM players WHERE token=?'); $q->execute([$token]);
      if ($p = $q->fetch()) { if (isset($b['save']) && ($sv = cleanJson($b['save'], 8000)) !== null) $db->prepare('UPDATE accounts SET data=?, seen=? WHERE name_lc=?')->execute([$sv, now(), $p['name_lc']]); $q2 = $db->prepare('SELECT state FROM players WHERE id=?'); $q2->execute([$p['id']]); releaseCars($db, (int)$p['id'], $q2->fetch()['state'] ?? null); $db->prepare('DELETE FROM players WHERE id=?')->execute([$p['id']]); addEv($db, 0, 0, 'sys', ['m' => $p['name'] . ' saiu', 'en' => $p['name'] . ' left', 'left' => (int)$p['id']]); }
    }
    out(['ok' => true]);
  }
  fail('ação desconhecida', 404);
} catch (Throwable $e) {
  if (isset($db) && $db->inTransaction()) $db->rollBack();
  error_log('[ccss online] ' . $e->getMessage());
  fail('erro no servidor', 500);
}
