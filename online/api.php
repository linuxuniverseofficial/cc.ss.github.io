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
   r25: acct_delete {token} (apaga a própria conta); admin {token, cmd: list|del {name}|wipe}. Conta 'admin' com senha do servidor (CCSS_ADMIN_PASS ou data/admin-pass.txt).
   r23: call/callok/callno {to} (agenda: pedido de encontro).
   r18: login {name,pass} → {acct,new} (passo 1 da tela); join aceita preset {look,car} e grava na conta.
   r17: join devolve house (0..23, -1 = sem casa).
   r15: wx {d} = estado do clima do jogador de menor id (os outros copiam).
   A cidade inteira sai da seed (igual para todos); o servidor só guarda jogadores e eventos (chat, dano, mortes). */
declare(strict_types=1);
/* r44: algumas imagens php:apache vêm SEM a extensão mbstring ("Call to undefined function mb_strlen" = "erro no servidor" no login).
   Substitutos em UTF-8 puro (preg /u), usados só se a extensão faltar. */
if (!function_exists('mb_strlen')) {
  function mb_strlen(string $s, ?string $enc = null): int { $n = preg_match_all('/./us', $s); return $n === false ? strlen($s) : $n; }
}
if (!function_exists('mb_substr')) {
  function mb_substr(string $s, int $start, ?int $len = null, ?string $enc = null): string {
    $a = preg_split('//u', $s, -1, PREG_SPLIT_NO_EMPTY); if ($a === false) return substr($s, $start, $len ?? PHP_INT_MAX);
    return implode('', array_slice($a, $start, $len));
  }
}
if (!function_exists('mb_strtolower')) {
  function mb_strtolower(string $s, ?string $enc = null): string {
    static $map = null;
    if ($map === null) { $up = 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ'; $lo = 'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ'; $map = array_combine(preg_split('//u', $up, -1, PREG_SPLIT_NO_EMPTY), preg_split('//u', $lo, -1, PREG_SPLIT_NO_EMPTY)); }
    return strtr(strtolower($s), $map);
  }
}
const MAX_PLAYERS = 24;      // jogadores por sessão
const CITY_SIZE   = 14;      // 14×14 (o celular aguenta depois das otimizações da v2)
const TIMEOUT     = 45.0;    // s sem tick = saiu (aba em 2º plano no celular segura o timer; o cliente reentra sozinho)
const PK_RESPAWN  = 300.0;   // s para um coletável pego voltar para todos
const DROP_TTL    = 180.0;   // s que o drop de quem morreu fica no chão
const WORLD_GONE  = 900.0;
const START_MONEY = 500;     // dinheiro de quem cria a conta
const ACCOUNT_TTL = 30 * 86400.0; // conta sem entrar há 30 dias é apagada (o nome fica livre)
const PASS_MIN    = 6;
const ADMIN_NAME  = 'admin';   // r25: conta de administração (nome reservado). Senha: variável CCSS_ADMIN_PASS ou o arquivo data/admin-pass.txt (criado sozinho na 1ª vez)
const HOUSES      = 24;      // casas seguras do online: uma por conta (a 25ª conta fica sem)   // s que uma remoção fica guardada para quem está sincronizando
const EV_KEEP     = 90.0;
/* v3 r9: HACK DE PIX entre jogadores (ctOS › PERFIL apontado para outro jogador). O servidor decide tudo: alvo, distância,
   tempo mínimo da transferência, valor (do saldo salvo da vítima), recargas e o BLOQUEADOR DE SINAL (comprado na AMOnições). */
const SIG_PRICE   = 5000;    // Bloqueador de Sinal: protege o PIX de hackers para sempre (fica na conta)
const HACK_MIN_T  = 6.0;     // s mínimos entre começar e terminar (o cliente usa 7 s)
const HACK_MAX_T  = 40.0;    // s máximos (depois disso a transferência expira)
const HACK_RANGE  = 34.0;    // m entre os dois (o cliente corta em 24 m; folga para o atraso do estado)
const HACK_PCT    = 0.20;    // parte do saldo da vítima
const HACK_CAP    = 5000;    // máximo por hack
const HACK_MIN_BAL= 100;     // vítima com menos que isso não vale a pena
const HACK_CD     = 90.0;    // s de recarga de quem hackeia
const HACK_SHIELD = 300.0;   // s em que a vítima não pode ser hackeada de novo    // s que um evento fica guardado
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
  /* r25: kick = sessão removida pelo admin (o próximo tick recebe 410 e o jogo não reentra sozinho) */
  $cols = array_column($pdo->query('PRAGMA table_info(players)')->fetchAll(), 'name'); if (!in_array('kick', $cols, true)) $pdo->exec('ALTER TABLE players ADD COLUMN kick INTEGER DEFAULT 0');
  /* v3 r9: hack de PIX (alvo e início da transferência em andamento, recarga de quem hackeia, proteção de quem foi hackeado) */
  foreach (['hack_to INTEGER DEFAULT 0', 'hack_t REAL DEFAULT 0', 'hack_cd REAL DEFAULT 0', 'hacked_t REAL DEFAULT 0'] as $c) { $n = strtok($c, ' '); if (!in_array($n, $cols, true)) $pdo->exec('ALTER TABLE players ADD COLUMN ' . $c); }
  $cols = array_column($pdo->query('PRAGMA table_info(accounts)')->fetchAll(), 'name'); if (!in_array('sigblock', $cols, true)) $pdo->exec('ALTER TABLE accounts ADD COLUMN sigblock INTEGER DEFAULT 0');
  return $pdo;
}
/* conta: nome + senha. Existe → confere; não existe → cria com o dinheiro inicial. Chamar dentro de transação. */
function acctAuth(PDO $db, array $b): array {
  $name = trim(preg_replace('/\s+/u', ' ', (string)($b['name'] ?? '')));
  if (mb_strlen($name) < 3 || mb_strlen($name) > 16 || !preg_match('/^[\p{L}\p{N} _.\-]+$/u', $name)) { txRollback($db); fail('NOME INVÁLIDO · 3 A 16 LETRAS/NÚMEROS'); }
  $pass = (string)($b['pass'] ?? ''); if (mb_strlen($pass) < PASS_MIN || mb_strlen($pass) > 64) { txRollback($db); fail('SENHA · MÍNIMO 6 CARACTERES'); }
  $lc = mb_strtolower($name);
  if ($lc === ADMIN_NAME) { if (!hash_equals(adminPass(), $pass)) { txRollback($db); fail('SENHA ERRADA · ESSE NOME JÁ TEM DONO', 403); }
    $q = $db->prepare('SELECT * FROM accounts WHERE name_lc = ?'); $q->execute([$lc]); $acc = $q->fetch();
    if ($acc) $db->prepare('UPDATE accounts SET pass=? WHERE name_lc=?')->execute([password_hash($pass, PASSWORD_DEFAULT), $lc]); }
  $q = $db->prepare('SELECT * FROM accounts WHERE name_lc = ?'); $q->execute([$lc]); $acc = $q->fetch();
  if ($acc) { if (!password_verify($pass, (string)$acc['pass'])) { txRollback($db); fail('SENHA ERRADA · ESSE NOME JÁ TEM DONO', 403); } $isNew = false; $name = (string)$acc['name']; /* nome como foi criado (maiúsculas) */ }
  else { $acc = ['data' => json_encode(['m' => START_MONEY])]; $db->prepare('INSERT INTO accounts(name_lc,name,pass,data,created,seen,house) VALUES(?,?,?,?,?,?,-1)')->execute([$lc, $name, password_hash($pass, PASSWORD_DEFAULT), $acc['data'], now(), now()]); $isNew = true; }
  $db->prepare('UPDATE accounts SET seen=?, name=? WHERE name_lc=?')->execute([now(), $name, $lc]);
  return [$name, $lc, $acc, $isNew];
}
/* r21: transação de escrita já reservada (BEGIN IMMEDIATE). Com BEGIN comum (deferred) o SQLite em WAL devolve
   "database is locked" na hora de passar de leitura para escrita se outro jogador gravou nesse meio-tempo — o busy_timeout
   não ajuda nesse caso. Era o "erro no servidor" ao criar conta (Edge) com outro jogador (Chrome) já jogando. */
function txBegin(PDO $db): void { $db->exec('BEGIN IMMEDIATE'); }
function txCommit(PDO $db): void { $db->exec('COMMIT'); }
function txRollback(PDO $db): void { try { $db->exec('ROLLBACK'); } catch (Throwable $e) { } }
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
  if (isset($e['ne'])) $d['ne'] = preg_match('/^#[0-9a-fA-F]{6}$/', (string)$e['ne']) ? (string)$e['ne'] : '';
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
  if (!empty($p['kick'])) { $db->prepare('DELETE FROM players WHERE id=?')->execute([$p['id']]); fail((int)$p['kick'] === 2 ? 'CONTA APAGADA' : 'VOCÊ FOI REMOVIDO DO SERVIDOR', 410); }
  return $p;
}
/* r25: senha do admin — CCSS_ADMIN_PASS ou data/admin-pass.txt (gerada na 1ª vez, só o dono do servidor lê) */
function adminPass(): string {
  $e = getenv('CCSS_ADMIN_PASS'); if (is_string($e) && strlen($e) >= PASS_MIN) return $e;
  $dir = getenv('CCSS_DATA') ?: (__DIR__ . '/data'); $f = $dir . '/admin-pass.txt';
  if (is_file($f)) { $v = trim((string)@file_get_contents($f)); if (strlen($v) >= PASS_MIN) return $v; }
  $v = substr(strtr(base64_encode(random_bytes(12)), '+/=', 'xyz'), 0, 12); @file_put_contents($f, $v . "\n"); @chmod($f, 0600); return $v;
}
function isAdmin(array $p): bool { return mb_strtolower((string)$p['name']) === ADMIN_NAME; }
/* apaga a conta e tudo que é dela; a sessão (se houver) recebe kick */
function acctWipe(PDO $db, string $lc, int $kick): void {
  $db->prepare('DELETE FROM accounts WHERE name_lc=?')->execute([$lc]);
  $q = $db->prepare('SELECT id, state FROM players WHERE name_lc=?'); $q->execute([$lc]);
  foreach ($q->fetchAll() as $r) { releaseCars($db, (int)$r['id'], $r['state']); $db->prepare('UPDATE players SET kick=? WHERE id=?')->execute([$kick, $r['id']]); }
}
/* aparência e estado: só JSON pequeno e plano (nada de HTML); o cliente desenha com textContent */
/* v3 r9: dinheiro salvo na conta (o cliente manda o saldo a cada 10 s; o hack e o bloqueador mexem aqui também) */
function acctMoney(PDO $db, string $lc): int { $q = $db->prepare('SELECT data FROM accounts WHERE name_lc=?'); $q->execute([$lc]); $r = $q->fetch(); $d = $r ? (json_decode((string)$r['data'], true) ?: []) : []; return (int)($d['m'] ?? 0); }
function acctMoneyAdd(PDO $db, string $lc, int $delta): void { $q = $db->prepare('SELECT data FROM accounts WHERE name_lc=?'); $q->execute([$lc]); $r = $q->fetch(); if (!$r) return;
  $d = json_decode((string)$r['data'], true) ?: []; $d['m'] = (int)($d['m'] ?? 0) + $delta; $db->prepare('UPDATE accounts SET data=? WHERE name_lc=?')->execute([json_encode($d, JSON_UNESCAPED_UNICODE), $lc]); }
function acctSig(PDO $db, string $lc): bool { $q = $db->prepare('SELECT sigblock FROM accounts WHERE name_lc=?'); $q->execute([$lc]); return (int)($q->fetch()['sigblock'] ?? 0) === 1; }
/* os dois na mesma cidade, vivos, fora de interior e perto (posição do último estado de cada um) */
function hackNear(?string $sa, ?string $sb): bool { $a = $sa ? json_decode($sa, true) : null; $b = $sb ? json_decode($sb, true) : null; if (!is_array($a) || !is_array($b)) return false;
  foreach ([$a, $b] as $s) if (($s['st'] ?? '') === 'dead' || !empty($s['w']) || !empty($s['tj']) || !is_numeric($s['x'] ?? null) || !is_numeric($s['z'] ?? null)) return false;
  if (($a['wk'] ?? '') !== ($b['wk'] ?? '')) return false; return hypot((float)$a['x'] - (float)$b['x'], (float)$a['z'] - (float)$b['z']) <= HACK_RANGE; }
function cleanJson($v, int $max): ?string { if ($v === null) return null; $s = json_encode($v, JSON_UNESCAPED_UNICODE); return ($s !== false && strlen($s) <= $max) ? $s : null; }

$a = $_GET['a'] ?? '';
try {
  $db = db();
  if ($a === 'acct_delete') {
    /* r25: o próprio jogador apaga a conta (e sai do servidor) */
    $b = body(); txBegin($db); $p = me($db, $b['token'] ?? null);
    if (isAdmin($p)) { txRollback($db); fail('A CONTA ADMIN NÃO PODE SER APAGADA', 403); }
    acctWipe($db, (string)$p['name_lc'], 2); $db->prepare('DELETE FROM players WHERE id=?')->execute([$p['id']]);
    addEv($db, 0, 0, 'sys', ['m' => $p['name'] . ' saiu', 'en' => $p['name'] . ' left', 'left' => (int)$p['id']]);
    txCommit($db); out(['ok' => true]);
  }
  if ($a === 'admin') {
    /* r25: comandos do admin — list (contas), del {name} (apaga uma conta), wipe (apaga tudo menos o admin) */
    $b = body(); txBegin($db); $p = me($db, $b['token'] ?? null);
    if (!isAdmin($p)) { txRollback($db); fail('SÓ O ADMIN', 403); }
    $cmd = (string)($b['cmd'] ?? '');
    if ($cmd === 'list') { $r = []; foreach ($db->query('SELECT name, seen, data, house FROM accounts ORDER BY name_lc')->fetchAll() as $a2) { $d = json_decode((string)$a2['data'], true) ?: []; $r[] = ['n' => $a2['name'], 'seen' => (float)$a2['seen'], 'm' => (int)($d['m'] ?? 0), 'h' => (int)$a2['house']]; } txCommit($db); out(['ok' => true, 'accounts' => $r]); }
    if ($cmd === 'del') { $lc = mb_strtolower(trim((string)($b['name'] ?? '')));
      if ($lc === '' || $lc === ADMIN_NAME) { txRollback($db); fail('NOME INVÁLIDO'); }
      $q = $db->prepare('SELECT 1 FROM accounts WHERE name_lc=?'); $q->execute([$lc]); $had = (bool)$q->fetch();
      acctWipe($db, $lc, 1); txCommit($db); out(['ok' => true, 'deleted' => $had]); }
    if ($cmd === 'wipe') {
      $n = (int)$db->query("SELECT COUNT(*) n FROM accounts WHERE name_lc<>'" . ADMIN_NAME . "'")->fetch()['n'];
      $db->prepare('UPDATE players SET kick=1 WHERE name_lc<>?')->execute([ADMIN_NAME]);
      $db->prepare('DELETE FROM accounts WHERE name_lc<>?')->execute([ADMIN_NAME]);
      $db->exec('DELETE FROM world'); $db->exec('DELETE FROM events');
      addEv($db, 0, 0, 'sys', ['m' => 'O servidor foi zerado pelo admin', 'en' => 'The server was reset by the admin']);
      txCommit($db); out(['ok' => true, 'accounts' => $n]); }
    txRollback($db); fail('comando desconhecido');
  }
  if ($a === 'info') {
    cleanup($db); [$day, $seed] = daySeed();
    $n = (int)$db->query('SELECT COUNT(*) n FROM players')->fetch()['n'];
    out(['ok' => true, 'players' => $n, 'max' => MAX_PLAYERS, 'day' => $day, 'seed' => $seed, 'size' => CITY_SIZE]);
  }
  if ($a === 'login') {
    /* r18: passo 1 da tela ONLINE — cria a conta (nome novo) ou confere a senha; devolve o que está salvo (roupa, carro, dinheiro…) */
    $b = body(); txBegin($db);
    [$name, $lc, $acc, $isNew] = acctAuth($db, $b);
    txCommit($db);
    out(['ok' => true, 'name' => $name, 'acct' => json_decode((string)$acc['data'], true) ?: [], 'new' => $isNew, 'admin' => $lc === ADMIN_NAME, 'bl' => acctSig($db, $lc) ? 1 : 0]);
  }
  if ($a === 'join') {
    $b = body();
    $look = cleanJson($b['look'] ?? null, 4000); if ($look === null) fail('aparência inválida');
    txBegin($db);
    cleanup($db);
    [$name, $lc, $acc, $isNew] = acctAuth($db, $b);
    /* a roupa/carro escolhidos na tela ficam salvos na conta (preset da próxima vez) */
    if (isset($b['preset']) && is_array($b['preset'])) { $d = json_decode((string)$acc['data'], true) ?: []; foreach (['look', 'car'] as $k) if (isset($b['preset'][$k]) && is_array($b['preset'][$k])) $d[$k] = $b['preset'][$k];
      $j = json_encode($d, JSON_UNESCAPED_UNICODE); if ($j !== false && strlen($j) <= 8000) { $acc['data'] = $j; $db->prepare('UPDATE accounts SET data=? WHERE name_lc=?')->execute([$j, $lc]); } }
    /* casa segura: a conta mantém a dela; sem casa → a primeira livre */
    $q = $db->prepare('SELECT house FROM accounts WHERE name_lc=?'); $q->execute([$lc]); $house = (int)($q->fetch()['house'] ?? -1);
    if ($house < 0) { $used = array_map('intval', array_column($db->query('SELECT house FROM accounts WHERE house>=0')->fetchAll(), 'house'));
      for ($h = 0; $h < HOUSES; $h++) if (!in_array($h, $used, true)) { $house = $h; break; }
      if ($house >= 0) $db->prepare('UPDATE accounts SET house=? WHERE name_lc=?')->execute([$house, $lc]); }
    /* senha certa e o nome ainda está "online" (sessão fantasma, outra aba): derruba a sessão velha */
    $q = $db->prepare('SELECT id, name, state FROM players WHERE name_lc = ?'); $q->execute([$lc]);
    if ($old = $q->fetch()) { releaseCars($db, (int)$old['id'], $old['state']); $db->prepare('DELETE FROM players WHERE id=?')->execute([$old['id']]); addEv($db, 0, 0, 'sys', ['m' => $old['name'] . ' saiu', 'en' => $old['name'] . ' left', 'left' => (int)$old['id']]); }
    $n = (int)$db->query('SELECT COUNT(*) n FROM players')->fetch()['n'];
    if ($n >= MAX_PLAYERS) { txRollback($db); fail('SERVIDOR CHEIO · ' . MAX_PLAYERS . ' JOGADORES', 503); }
    $token = bin2hex(random_bytes(16)); $t = now();
    $db->prepare('INSERT INTO players(name,name_lc,token,look,lookv,state,seen,joined) VALUES(?,?,?,?,1,NULL,?,?)')->execute([$name, mb_strtolower($name), $token, $look, $t, $t]);
    $id = (int)$db->lastInsertId();
    $last = lastEv($db);
    addEv($db, 0, 0, 'sys', ['m' => $name . ' entrou', 'en' => $name . ' joined']);
    txCommit($db);
    [$day, $seed] = daySeed();
    out(['ok' => true, 'id' => $id, 'name' => $name, 'token' => $token, 'seed' => $seed, 'size' => CITY_SIZE, 'day' => $day, 'tod' => gameTod(), 'last' => $last, 'max' => MAX_PLAYERS, 'acct' => json_decode((string)$acc['data'], true) ?: [], 'new' => $isNew, 'house' => $house, 'admin' => $lc === ADMIN_NAME, 'bl' => acctSig($db, $lc) ? 1 : 0]);
  }
  if ($a === 'tick') {
    $b = body(); $p = me($db, $b['token'] ?? null); $id = (int)$p['id']; $t = now();
    $state = cleanJson($b['s'] ?? null, 2000);
    txBegin($db);
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
      } elseif ($k === 'sigbuy') {
        /* v3 r9: Bloqueador de Sinal. Cobra do saldo salvo (o cliente manda o save junto, então está em dia) */
        $mlc = (string)$p['name_lc'];
        if (acctSig($db, $mlc)) { addEv($db, 0, $id, 'sig', ['ok' => 1, 'paid' => 0]); continue; }
        if (acctMoney($db, $mlc) < SIG_PRICE) { addEv($db, 0, $id, 'sig', ['ok' => 0, 'r' => 'money']); continue; }
        acctMoneyAdd($db, $mlc, -SIG_PRICE); $db->prepare('UPDATE accounts SET sigblock=1 WHERE name_lc=?')->execute([$mlc]);
        addEv($db, 0, $id, 'sig', ['ok' => 1, 'paid' => SIG_PRICE]);
      } elseif ($k === 'hk0' || $k === 'hk1' || $k === 'hkx') {
        /* v3 r9: hack de PIX. hk0 = começou (avisa a vítima), hk1 = barra cheia (o servidor confere e transfere), hkx = desistiu/sinal caiu */
        $to = (int)($e['to'] ?? 0);
        $q = $db->prepare('SELECT id,name,name_lc,state,seen,hacked_t FROM players WHERE id=?'); $q->execute([$to]); $v = ($to > 0 && $to !== $id) ? $q->fetch() : null;
        if ($k === 'hkx') { if ((int)$p['hack_to'] === $to) { $db->prepare('UPDATE players SET hack_to=0, hack_t=0 WHERE id=?')->execute([$id]); $p['hack_to'] = 0; if ($v) addEv($db, $id, $to, 'hkx', ['n' => $p['name']]); } continue; }
        $no = function (string $r) use ($db, $id, $to, &$p) { $db->prepare('UPDATE players SET hack_to=0, hack_t=0 WHERE id=?')->execute([$id]); $p['hack_to'] = 0; addEv($db, 0, $id, 'hk', ['st' => 'no', 'r' => $r, 'to' => $to]); };
        if (!$v || $t - (float)$v['seen'] > TIMEOUT) { $no('gone'); continue; }
        if (acctSig($db, (string)$v['name_lc'])) { $no('blk'); continue; }
        if (!hackNear($state, $v['state'])) { $no('far'); continue; }
        if ($k === 'hk0') {
          if ((float)$p['hack_cd'] > $t) { addEv($db, 0, $id, 'hk', ['st' => 'no', 'r' => 'cd', 's' => (int)ceil((float)$p['hack_cd'] - $t), 'to' => $to]); continue; }
          if ((float)$v['hacked_t'] + HACK_SHIELD > $t) { $no('shield'); continue; }
          $db->prepare('UPDATE players SET hack_to=?, hack_t=? WHERE id=?')->execute([$to, $t, $id]); $p['hack_to'] = $to; $p['hack_t'] = $t;
          addEv($db, $id, $to, 'hkw', ['n' => $p['name']]); addEv($db, 0, $id, 'hk', ['st' => 'go', 'to' => $to]); continue;
        }
        /* hk1: precisa ter começado com esse alvo há pelo menos HACK_MIN_T */
        $dt = $t - (float)$p['hack_t'];
        if ((int)$p['hack_to'] !== $to || $dt < HACK_MIN_T || $dt > HACK_MAX_T) { $no('time'); continue; }
        if ((float)$v['hacked_t'] + HACK_SHIELD > $t) { $no('shield'); continue; }
        $bal = acctMoney($db, (string)$v['name_lc']); $m = (int)min(HACK_CAP, floor(max(0, $bal) * HACK_PCT));
        if ($bal < HACK_MIN_BAL || $m <= 0) { $no('poor'); continue; }
        acctMoneyAdd($db, (string)$v['name_lc'], -$m); acctMoneyAdd($db, (string)$p['name_lc'], $m);
        $db->prepare('UPDATE players SET hack_to=0, hack_t=0, hack_cd=? WHERE id=?')->execute([$t + HACK_CD, $id]); $p['hack_to'] = 0; $p['hack_cd'] = $t + HACK_CD;
        $db->prepare('UPDATE players SET hacked_t=? WHERE id=?')->execute([$t, $to]);
        addEv($db, $id, $to, 'pixed', ['n' => $p['name'], 'm' => $m]); addEv($db, 0, $id, 'hk', ['st' => 'ok', 'm' => $m, 'n' => $v['name'], 'to' => $to]);
        addEv($db, 0, 0, 'sys', ['m' => $p['name'] . ' hackeou o PIX de ' . $v['name'], 'en' => $p['name'] . ' hacked ' . $v['name'] . "'s PIX"]);
      } elseif (in_array($k, ['jack', 'ride', 'unride', 'call', 'callok', 'callno'], true)) { /* r52: unride = carona substituída (quem estava sai do carro) */
        $to = (int)($e['to'] ?? 0); if ($to > 0 && $to !== $id) addEv($db, $id, $to, $k, ['n' => $p['name']]);
      }
    }
    txCommit($db);
    if (mt_rand(0, 19) === 0) { txBegin($db); cleanup($db); txCommit($db); }
    /* jogadores: aparência só para quem ainda não tem a versão atual (kv = "id:versão,...") */
    $known = [];
    foreach (explode(',', (string)($b['kv'] ?? '')) as $pair) { $kv = explode(':', $pair); if (count($kv) === 2) $known[(int)$kv[0]] = (int)$kv[1]; }
    $rows = $db->prepare('SELECT p.id,p.name,p.look,p.lookv,p.state,p.seen,p.kills,p.deaths,IFNULL(a.sigblock,0) bl FROM players p LEFT JOIN accounts a ON a.name_lc=p.name_lc WHERE p.id<>? AND p.seen>=?'); $rows->execute([$id, $t - TIMEOUT]);
    $players = [];
    foreach ($rows->fetchAll() as $r) {
      $o = ['id' => (int)$r['id'], 'n' => $r['name'], 'lv' => (int)$r['lookv'], 's' => $r['state'] ? json_decode($r['state'], true) : null, 'age' => round($t - (float)$r['seen'], 3), 'k' => (int)$r['kills'], 'd' => (int)$r['deaths'], 'bl' => (int)$r['bl']];
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
    out(['ok' => true, 'now' => $t, 'tod' => gameTod(), 'players' => $players, 'ev' => $ev, 'last' => $last, 'w' => $w, 'wv' => $wv, 'me' => ['k' => (int)$p['kills'], 'd' => (int)$p['deaths'], 'bl' => acctSig($db, (string)$p['name_lc']) ? 1 : 0]]);
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
  if (isset($db)) txRollback($db);
  error_log('[ccss online] ' . $e->getMessage());
  fail('erro no servidor', 500);
}
