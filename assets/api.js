// Apps Script 웹 앱 호출 — Content-Type을 지정하지 않아 text/plain으로 보내면 CORS 사전 요청 없이 전송돼요
window.API = {
  configured() { return !!(window.APP_CONFIG && window.APP_CONFIG.API_URL); },
  async post(body) {
    if (!this.configured()) throw Object.assign(new Error('저장 주소(API_URL)가 설정되지 않았어요.'), { code: 'not_configured' });
    let res;
    try {
      res = await fetch(window.APP_CONFIG.API_URL, { method: 'POST', body: JSON.stringify(body) });
    } catch (e) {
      throw Object.assign(new Error('서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.'), { code: 'network' });
    }
    let data;
    try { data = await res.json(); } catch (e) {
      throw Object.assign(new Error('서버 응답을 읽지 못했어요. Apps Script 배포 설정을 확인해 주세요.'), { code: 'bad_response' });
    }
    if (!data.ok) throw Object.assign(new Error(data.message || '요청을 처리하지 못했어요.'), { code: data.code || 'error' });
    return data;
  },
};
