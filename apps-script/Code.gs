/**
 * IT·AI 진로적성검사 — 결과 저장 서버 (Google Apps Script 웹 앱)
 *
 * 구글 시트의 [확장 프로그램 → Apps Script]에 붙여 넣고 웹 앱으로 배포하세요.
 * [프로젝트 설정 → 스크립트 속성]
 *   ADMIN_PASSWORD  관리자 비밀번호 (필수)
 *   NOTIFY_EMAIL    새 검사 알림을 받을 메일 주소, 여러 명이면 쉼표로 구분 (선택)
 *   ADMIN_URL       알림 메일에 넣을 관리자 페이지 주소 (선택)
 * 자세한 순서는 README.md를 보세요.
 */

const SHEET_NAME = 'results';
// 열 순서는 바꾸지 마세요. 새 열은 항상 맨 뒤에 추가합니다.
const HEADERS = [
  'id', '검사일시', '이름', '생년월일', '연락처', '소속', '동의일시',
  '1위', '1위%', '2위', '2위%', '3위', '3위%',
  '성향(JSON)', '기초소양(JSON)', 'AI관심도', '응답', '검사버전', '상담메모',
  '상담상태', '담당멘토', '소요시간(초)', '상태변경일시',
];
const COL = Object.fromEntries(HEADERS.map((h, i) => [h, i + 1]));
const ANSWER_COUNT = 87;
const STATUSES = ['신규', '연락 완료', '상담 완료', '등록', '보류'];
const RETENTION_DAYS = 365;    // 개인정보 보유 기간 (검사일 기준)
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
      case 'update': return json_(admin_(body, update_));
      case 'memo':   return json_(admin_(body, update_));   // 예전 관리자 화면 호환
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
  const now = now_();
  const id = Utilities.getUuid();
  const row = new Array(HEADERS.length).fill('');
  const set = (h, v) => { row[COL[h] - 1] = v; };
  set('id', id); set('검사일시', now); set('이름', name); set('생년월일', birth); set('연락처', phone);
  set('소속', str_(b.affiliation, 60)); set('동의일시', now);
  [0, 1, 2].forEach(i => { set((i + 1) + '위', str_(top[i] && top[i].name, 40)); set((i + 1) + '위%', num_(top[i] && top[i].pct)); });
  set('성향(JSON)', JSON.stringify(b.axes || {})); set('기초소양(JSON)', JSON.stringify(b.basics || {}));
  set('AI관심도', num_(b.ai)); set('응답', answers); set('검사버전', str_(b.version, 20));
  set('상담상태', STATUSES[0]); set('소요시간(초)', num_(b.durationSec));

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { sheet_().appendRow(row.map(text_)); } finally { lock.releaseLock(); }

  notify_(name, str_(b.affiliation, 60), now, top);
  return { ok: true, id: id };
}

// 새 검사 알림 메일 — 실패해도 저장에는 영향 없음
function notify_(name, affiliation, when, top) {
  const props = PropertiesService.getScriptProperties();
  const to = (props.getProperty('NOTIFY_EMAIL') || '').trim();
  if (!to) return;
  const adminUrl = props.getProperty('ADMIN_URL') || '';
  const lines = [
    name + (affiliation ? ' (' + affiliation + ')' : '') + ' 학생이 진로적성검사를 마쳤어요.',
    '',
    '검사일시: ' + when,
    ...top.map((t, i) => (i + 1) + '위: ' + (t && t.name) + ' (' + (t && t.pct) + '%)'),
    '',
    adminUrl ? '관리자 페이지에서 확인하기: ' + adminUrl : '관리자 페이지에서 상세 결과를 확인해 주세요.',
  ];
  try {
    MailApp.sendEmail({ to: to, subject: '[진로적성검사] ' + name + ' 학생 검사 완료', body: lines.join('\n') });
  } catch (err) {
    console.warn('알림 메일을 보내지 못했어요: ' + err.message);
  }
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
  const g = (v, h) => v[COL[h] - 1];
  const rows = values.map(v => ({
    id: g(v, 'id'), submittedAt: g(v, '검사일시'), name: g(v, '이름'), birth: g(v, '생년월일'), phone: g(v, '연락처'),
    affiliation: g(v, '소속'), consentAt: g(v, '동의일시'),
    top: [1, 2, 3].map(i => ({ name: g(v, i + '위'), pct: Number(g(v, i + '위%')) })).filter(t => t.name),
    axes: parse_(g(v, '성향(JSON)')), basics: parse_(g(v, '기초소양(JSON)')), ai: Number(g(v, 'AI관심도')),
    answers: g(v, '응답'), version: g(v, '검사버전'), memo: g(v, '상담메모'),
    status: g(v, '상담상태') || STATUSES[0], mentor: g(v, '담당멘토'), durationSec: Number(g(v, '소요시간(초)')) || 0,
  })).filter(r => r.id);
  rows.reverse(); // 최신순
  return { ok: true, rows: rows };
}

function update_(b) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const r = findRow_(b.id);
    if (!r) return fail_('not_found', '해당 결과를 찾지 못했어요.');
    const sh = sheet_();
    if (b.memo !== undefined) sh.getRange(r, COL['상담메모']).setValue(text_(str_(b.memo, 2000)));
    if (b.mentor !== undefined) sh.getRange(r, COL['담당멘토']).setValue(text_(str_(b.mentor, 30)));
    if (b.status !== undefined) {
      if (STATUSES.indexOf(b.status) < 0) return fail_('bad_request', '알 수 없는 상담 상태예요.');
      const cell = sh.getRange(r, COL['상담상태']);
      if (cell.getDisplayValue() !== b.status) {
        cell.setValue(text_(b.status));
        sh.getRange(r, COL['상태변경일시']).setValue(text_(now_()));
      }
    }
    return { ok: true };
  } finally { lock.releaseLock(); }
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

// ───── 보유 기간이 지난 결과 자동 삭제 (매일 새벽 트리거) ─────
function purgeOld() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = sheet_();
    const n = sh.getLastRow() - 1;
    if (n < 1) return 0;
    const dates = sh.getRange(2, COL['검사일시'], n, 1).getDisplayValues();
    const cutoff = Utilities.formatDate(new Date(Date.now() - RETENTION_DAYS * 86400000), 'Asia/Seoul', 'yyyy-MM-dd');
    let removed = 0;
    for (let i = dates.length - 1; i >= 0; i--) {       // 아래부터 지워야 행 번호가 밀리지 않음
      const d = String(dates[i][0]).slice(0, 10);
      if (d && d < cutoff) { sh.deleteRow(i + 2); removed++; }
    }
    console.log('보유 기간이 지난 결과 ' + removed + '건을 지웠어요.');
    return removed;
  } finally { lock.releaseLock(); }
}

// 처음 한 번 실행: results 시트 · 머리글 준비, 자동 삭제 트리거 등록 (권한 승인 포함)
function setup() {
  sheet_();
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'purgeOld').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('purgeOld').timeBased().everyDays(1).atHour(3).inTimezone('Asia/Seoul').create();
  // 알림 메일 권한도 미리 승인받기 위해 남은 메일 수를 조회
  console.log('준비 완료. 오늘 보낼 수 있는 알림 메일: ' + MailApp.getRemainingDailyQuota() + '통');
}

// ───── 도우미 ─────
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.setFrozenRows(1); }
  // 머리글이 없거나 예전 버전이면 맨 뒤에 새 열 머리글을 채움
  if (sh.getLastColumn() < HEADERS.length || sh.getRange(1, 1).getValue() !== 'id') {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
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
function now_() { return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'); }
// 시트가 날짜 · 숫자 · 수식으로 바꾸지 않도록 글자로 저장
function text_(v) { return typeof v === 'string' && v !== '' ? "'" + v : v; }
function str_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max); }
function num_(v) { const n = Number(v); return isFinite(n) ? Math.round(n) : ''; }
function parse_(s) { try { return JSON.parse(s); } catch (e) { return {}; } }
function fail_(code, message) { return { ok: false, code: code, message: message }; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
