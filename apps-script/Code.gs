/**
 * IT·AI 진로적성검사 — 결과 저장 서버 (Google Apps Script 웹 앱)
 *
 * 구글 시트의 [확장 프로그램 → Apps Script]에 붙여 넣고 웹 앱으로 배포하세요.
 * 관리자 비밀번호는 [프로젝트 설정 → 스크립트 속성]에 ADMIN_PASSWORD로 저장합니다.
 * 자세한 순서는 README.md를 보세요.
 */

const SHEET_NAME = 'results';
const HEADERS = [
  'id', '검사일시', '이름', '생년월일', '연락처', '소속', '동의일시',
  '1위', '1위%', '2위', '2위%', '3위', '3위%',
  '성향(JSON)', '기초소양(JSON)', 'AI관심도', '응답', '검사버전', '상담메모',
];
const ANSWER_COUNT = 87;
const MAX_FAILS = 10;          // 비밀번호를 10번 틀리면
const LOCK_SECONDS = 600;      // 10분 동안 관리자 기능을 잠금

function doGet() {
  return json_({ ok: true, service: 'it-ai-career-test' });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, code: 'bad_request', message: '요청 형식이 올바르지 않아요.' }); }
  try {
    switch (body.action) {
      case 'submit': return json_(submit_(body));
      case 'list':   return json_(admin_(body, list_));
      case 'memo':   return json_(admin_(body, memo_));
      case 'delete': return json_(admin_(body, delete_));
      default:       return json_({ ok: false, code: 'bad_request', message: '알 수 없는 요청이에요.' });
    }
  } catch (err) {
    return json_({ ok: false, code: 'server_error', message: '서버 오류가 발생했어요: ' + err.message });
  }
}

// ───── 학생 결과 저장 ─────
function submit_(b) {
  const name = str_(b.name, 30), phone = str_(b.phone, 20), birth = str_(b.birth, 10);
  const answers = String(b.answers || '');
  if (name.length < 2) return fail_('bad_request', '이름이 비어 있어요.');
  if (!/^01[016789]-\d{3,4}-\d{4}$/.test(phone)) return fail_('bad_request', '연락처 형식이 올바르지 않아요.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return fail_('bad_request', '생년월일 형식이 올바르지 않아요.');
  if (b.consent !== true) return fail_('bad_request', '개인정보 수집 · 이용 동의가 필요해요.');
  if (!new RegExp('^[1-5]{' + ANSWER_COUNT + '}$').test(answers)) return fail_('bad_request', '응답이 모두 채워지지 않았어요.');

  const top = Array.isArray(b.top) ? b.top.slice(0, 3) : [];
  const now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  const id = Utilities.getUuid();
  const row = [
    id, now, name, birth, phone, str_(b.affiliation, 60), now,
    str_(top[0] && top[0].name, 40), num_(top[0] && top[0].pct),
    str_(top[1] && top[1].name, 40), num_(top[1] && top[1].pct),
    str_(top[2] && top[2].name, 40), num_(top[2] && top[2].pct),
    JSON.stringify(b.axes || {}), JSON.stringify(b.basics || {}), num_(b.ai), answers, str_(b.version, 20), '',
  ];

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { sheet_().appendRow(row.map(text_)); } finally { lock.releaseLock(); }
  return { ok: true, id: id };
}

// ───── 관리자 ─────
function admin_(b, fn) {
  const props = PropertiesService.getScriptProperties();
  const password = props.getProperty('ADMIN_PASSWORD');
  if (!password) return fail_('not_configured', '관리자 비밀번호가 설정되지 않았어요. 스크립트 속성에 ADMIN_PASSWORD를 추가해 주세요.');

  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('fails') || 0);
  if (fails >= MAX_FAILS) return fail_('locked', '비밀번호를 여러 번 틀려서 10분 동안 잠겼어요.');
  if (String(b.password || '') !== password) {
    cache.put('fails', String(fails + 1), LOCK_SECONDS);
    return fail_('unauthorized', '비밀번호가 맞지 않아요.');
  }
  cache.remove('fails');
  return fn(b);
}

function list_() {
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return { ok: true, rows: [] };
  const values = sh.getRange(2, 1, n, HEADERS.length).getDisplayValues();
  const rows = values.map(v => ({
    id: v[0], submittedAt: v[1], name: v[2], birth: v[3], phone: v[4], affiliation: v[5], consentAt: v[6],
    top: [[v[7], v[8]], [v[9], v[10]], [v[11], v[12]]].filter(t => t[0]).map(t => ({ name: t[0], pct: Number(t[1]) })),
    axes: parse_(v[13]), basics: parse_(v[14]), ai: Number(v[15]), answers: v[16], version: v[17], memo: v[18],
  })).filter(r => r.id);
  rows.reverse(); // 최신순
  return { ok: true, rows: rows };
}

function memo_(b) {
  const r = findRow_(b.id);
  if (!r) return fail_('not_found', '해당 결과를 찾지 못했어요.');
  sheet_().getRange(r, HEADERS.indexOf('상담메모') + 1).setValue(text_(str_(b.memo, 2000)));
  return { ok: true };
}

function delete_(b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const r = findRow_(b.id);
    if (!r) return fail_('not_found', '해당 결과를 찾지 못했어요.');
    sheet_().deleteRow(r);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

// ───── 도우미 ─────
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
function findRow_(id) {
  if (!id) return 0;
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const ids = sh.getRange(2, 1, n, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return 0;
}
// 시트가 날짜 · 숫자 · 수식으로 바꾸지 않도록 글자로 저장
function text_(v) { return typeof v === 'string' && v !== '' ? "'" + v : v; }
function str_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }
function num_(v) { const n = Number(v); return isFinite(n) ? Math.round(n) : ''; }
function parse_(s) { try { return JSON.parse(s); } catch (e) { return {}; } }
function fail_(code, message) { return { ok: false, code: code, message: message }; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// 처음 한 번 실행하면 results 시트와 머리글을 만들어요 (권한 승인용)
function setup() { sheet_(); }
