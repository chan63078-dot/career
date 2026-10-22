// IT·AI 진로적성검사 — 문항, 직무, 점수 계산 (검사 페이지와 관리자 페이지가 함께 씀)
(function (root) {
  const VERSION = '2026-10-v2';

  const LIKERT = ['전혀 아니다', '대체로 아니다', '보통이다', '대체로 그렇다', '매우 그렇다'];

  // ───────── 성향 6가지 ─────────
  const AXES = [
    { key: 'B', name: '만들기',        desc: '직접 만들어서 결과물을 보는 걸 좋아해요' },
    { key: 'A', name: '분석',          desc: '숫자와 패턴에서 답을 찾아요' },
    { key: 'S', name: '시스템',        desc: '구조를 짜고 안정적으로 돌아가게 해요' },
    { key: 'P', name: '지키기',        desc: '허점을 찾고 막는 일에 끌려요' },
    { key: 'F', name: '장비·현장',     desc: '장비 · 하드웨어 · 영상처럼 실물을 다루는 일에 끌려요' },
    { key: 'H', name: '사람·비즈니스', desc: '기획하고, 설득하고, 일을 더 낫게 바꿔요' },
  ];

  // ───────── 기초 소양 4영역 (Part 1) ─────────
  const BASICS = [
    { key: 'D', name: '디지털 활용' },
    { key: 'R', name: '문제 해결' },
    { key: 'L', name: '논리 · 분석' },
    { key: 'C', name: '창의 · 기획' },
  ];

  // ───────── 문항 ─────────
  // k: 기초 소양 영역, w: 성향 축 가중치, job: 직무 가산점, ai: AI 관심도 문항
  const PARTS = [
    { id: 'basic', title: 'Part 1. 기초 소양', hint: '평소 내 모습과 가장 가까운 답을 골라 주세요', items: [
      { t: '나는 스스로 프로그래밍(코딩)을 공부해 본 적이 있다.', k: 'D', w: { B: 1 } },
      { t: '인터넷에서 원하는 정보를 빠르고 정확하게 찾는다.', k: 'D' },
      { t: '데이터에서 규칙을 찾아내는 데 능숙하다.', k: 'L', w: { A: 1 } },
      { t: '간단한 PC 오류(인터넷 끊김, 프린터 문제 등)를 혼자 해결한다.', k: 'D', w: { S: 1 } },
      { t: '긴 설명문이나 매뉴얼에서 필요한 정보를 효과적으로 찾는다.', k: 'D' },
      { t: '문제를 해결할 때 독창적인 방법을 자주 생각한다.', k: 'C' },
      { t: '오류가 발생했을 때 원인을 차근차근 탐색한다.', k: 'R', w: { S: 1 } },
      { t: '제한된 조건 속에서도 색다른 해법을 찾을 수 있다.', k: 'C' },
      { t: '파일 저장 · 압축 · 백업 등의 기본 기능을 잘 활용한다.', k: 'D' },
      { t: '새로운 개념을 배울 때 기존 경험과 잘 연결한다.', k: 'C' },
      { t: '일상에서 개선할 수 있는 아이디어를 자주 떠올린다.', k: 'C', w: { H: 1 }, job: { oa: 1, aipm: 1 } },
      { t: '새로운 도구나 기술을 접하면 창의적으로 응용할 방법을 떠올린다.', k: 'C', w: { B: 1 } },
      { t: '복잡한 내용을 들으면 핵심을 빠르게 정리한다.', k: 'L' },
      { t: '논리 퍼즐이나 퀴즈 푸는 것을 좋아한다.', k: 'L', w: { A: 1 } },
      { t: '상상한 아이디어를 실제 실행 계획으로 구체화할 수 있다.', k: 'C', w: { H: 1 }, job: { oa: 1, aipm: 1 } },
      { t: '도표나 그림을 보면 내용을 쉽게 이해한다.', k: 'L' },
      { t: '제한된 자원 속에서도 목표 달성 방법을 찾는다.', k: 'R' },
      { t: '새로운 문법이나 규칙을 금방 이해하고 적용한다.', k: 'L' },
      { t: '다양한 대안을 고려해 최적의 방법을 선택한다.', k: 'R' },
      { t: '눈에 보이지 않는 구조를 머릿속으로 잘 상상한다.', k: 'L', w: { S: 1 } },
      { t: '사건이나 현상의 원인과 결과를 논리적으로 연결할 수 있다.', k: 'L' },
      { t: '문제 해결 후 재발을 막기 위해 대비한다.', k: 'R', w: { S: 1, P: 1 } },
      { t: '서로 다른 상황의 공통점과 차이점을 분석하는 데 능하다.', k: 'L' },
      { t: '예상치 못한 문제 상황에서도 침착하게 행동한다.', k: 'R' },
      { t: '문서 · 스프레드시트 · 프레젠테이션 도구를 능숙하게 다룬다.', k: 'D', job: { oa: 1 } },
      { t: '복잡한 상황을 단계별로 정리해 결론에 도달한다.', k: 'L' },
      { t: '다양한 소프트웨어를 목적에 맞게 선택해 사용한다.', k: 'D' },
      { t: '모순된 주장이나 논리를 쉽게 찾아낸다.', k: 'L', w: { P: 1 } },
      { t: '새로운 프로그램을 접했을 때 쉽게 익힌다.', k: 'D' },
      { t: '새로운 문제를 해결하면 큰 성취감을 느낀다.', k: 'R' },
    ]},
    { id: 'fit', title: 'Part 2. 분야 적합도', hint: '경험해 봤거나 관심 있는 정도를 골라 주세요', items: [
      { t: '사람들의 성장을 돕는 일에 보람을 느낀다.', w: { H: 2 }, job: { oa: 1 } },
      { t: '반복적인 일을 자동으로 처리하는 데 흥미를 느껴 본 적이 있다.', w: { S: 1, B: 1, H: 1 }, job: { oa: 2 } },
      { t: '맞춤형 PC를 만들어 본 경험이 있다. (조립 PC)', w: { S: 2, F: 2 }, job: { network: 1 } },
      { t: '생성형 AI를 사용해 수익화를 해 본 경험이 있다.', w: { H: 1 }, job: { creator: 2, mkt: 1 }, ai: 1 },
      { t: '새로운 기술을 배우는 것에 적극적이다.', w: { B: 1, S: 1 } },
      { t: '숫자와 그래프로 정보를 표현하는 것이 글보다 훨씬 편하다.', w: { A: 2 }, job: { analyst: 1 } },
      { t: '기능보다 디자인을 보고 물건을 구매해 본 적이 있다.', w: { H: 1 }, job: { creator: 2, front: 1 } },
      { t: '사람들과 소통하면서 지식을 전달할 때 성취감을 느낀다.', w: { H: 2 }, job: { oa: 1, aipm: 1 } },
      { t: '한글이나 워드보다 엑셀을 쓰는 게 더 편하다.', w: { A: 1 }, job: { analyst: 1, oa: 1 } },
      { t: '인공지능이 사회에 미치는 영향을 이해하고 싶다.', w: { H: 1 }, job: { aipm: 1, aisec: 2 }, ai: 1 },
      { t: '컴퓨터의 기본 성능이나 설정에 대해 많이 알고 있다.', w: { S: 2, F: 1 }, job: { network: 1 } },
      { t: '어려운 내용을 쉽게 설명하는 능력이 있다고 생각한다.', w: { H: 2 }, job: { aipm: 1 } },
      { t: '스마트폰이나 컴퓨터에서 IP 주소가 무슨 역할을 하는지 알고 있다.', w: { S: 2, P: 1 }, job: { network: 1, infrasec: 1, mlops: 1 } },
      { t: 'GPT 등 생성형 AI를 매우 잘 다룬다고 생각한다.', w: { B: 1 }, job: { oa: 1 }, ai: 1 },
      { t: '악성코드(바이러스)에 대해 잘 알고 있다.', w: { P: 3 }, job: { soc: 1, pentest: 1 } },
      { t: 'AI는 앞으로 사회 변화에 큰 영향을 줄 것이라고 확신한다.', ai: 1 },
      { t: '해킹, 개인정보 유출 등 보안 관련 뉴스에 관심이 많다.', w: { P: 3 }, job: { soc: 1 } },
      { t: 'PC나 인터넷 문제가 발생하면 최대한 스스로 분석하고 해결한다.', w: { S: 2, B: 1 } },
      { t: '비밀번호 관리 같은 기본 보안 습관을 철저히 지킨다.', w: { P: 2 } },
      { t: '엑셀이나 통계 도구를 사용해 데이터를 정리해 본 경험이 있다.', w: { A: 2 }, job: { analyst: 1, curator: 2 } },
      { t: '밤낮이 바뀌어도 큰 문제가 없다고 생각한다.', w: { S: 1 }, job: { soc: 2, network: 1 } },
      { t: '새로운 서비스를 사용할 때 보안성을 우선 고려한다.', w: { P: 2 }, job: { infrasec: 1 } },
      { t: '데이터를 수집하거나 처리해서 의사결정을 해 본 경험이 있다.', w: { A: 2 }, job: { analyst: 1 } },
      { t: '컴퓨터 프로그램을 만드는 과정이 궁금하다.', w: { B: 3 }, job: { front: 1, back: 1 } },
      { t: '데이터 애널리스트라는 직업에 대해 잘 알고 있다.', w: { A: 1 }, job: { analyst: 2 } },
      { t: '법이나 규정, 규칙 등에 대해 알아보고 이해하는 것을 좋아한다.', w: { P: 1, H: 1 }, job: { infrasec: 1, soc: 1, aisec: 1 } },
      { t: '교사나 강사를 꿈꿔 본 적이 있다.', w: { H: 2 }, job: { oa: 1 } },
      { t: '다양하게 소통하며 협업하는 걸 좋아한다.', w: { H: 2 }, job: { aipm: 1 } },
      { t: '질문에 차분히 답변하는 것이 편하다.', w: { H: 1 } },
      { t: '수학 · 통계에 대한 이해도가 있는 편이다.', w: { A: 3 }, job: { analyst: 1 } },
      { t: '카메라 영상 속 사람이나 물체를 AI가 알아보는 기술이 신기하다.', w: { F: 2, A: 1 }, job: { vision: 2 }, ai: 1 },
      { t: '행사나 동아리 활동을 기획해서 사람들을 모아 본 적이 있다.', w: { H: 2 }, job: { aipm: 1, mkt: 1 } },
      { t: '그림 · 영상 · 음악 같은 콘텐츠를 만드는 걸 좋아한다.', w: { B: 1, H: 1 }, job: { creator: 3, mkt: 1 } },
      { t: '정해진 절차와 기준을 꼼꼼하게 지키는 편이다.', w: { P: 2, S: 1 }, job: { soc: 2, curator: 3, infrasec: 1 } },
      { t: '남들이 놓친 실수나 허점을 잘 찾아낸다.', w: { P: 3, A: 1 }, job: { pentest: 2, curator: 2 } },
      { t: '무언가가 멈추지 않고 잘 돌아가도록 관리할 때 뿌듯하다.', w: { S: 3 }, job: { network: 1, infrasec: 1, mlops: 1 } },
      { t: '서버실이나 통신 장비처럼 실제 장비를 만지는 일이 재밌을 것 같다.', w: { F: 3, S: 1 }, job: { network: 2 } },
      { t: 'AI가 어떻게 답을 만들어 내는지 원리가 궁금하다.', w: { A: 1, B: 1 }, job: { aidev: 2, vision: 1, mlops: 2 }, ai: 1 },
      { t: '내 아이디어로 사람들의 반응을 끌어낼 때 즐겁다.', w: { H: 2 }, job: { mkt: 2, creator: 1 } },
      { t: '앱이나 웹사이트를 쓰다가 "화면을 이렇게 바꾸면 더 편할 텐데" 하고 생각할 때가 많다.', w: { B: 1, H: 1 }, job: { front: 2 } },
      { t: '로그인이나 결제처럼 화면 뒤에서 데이터가 어떻게 처리되는지 궁금하다.', w: { B: 2, S: 1 }, job: { back: 2 } },
    ]},
    { id: 'subject', title: 'Part 3. 좋아하거나 자신 있는 과목', hint: '성적과 상관없이 끌리는 정도를 골라 주세요', items: [
      { t: '수학 (특히 확률과 통계)', w: { A: 3 }, job: { analyst: 1 } },
      { t: '물리 · 화학', w: { F: 2, A: 1 }, job: { vision: 1, network: 1 } },
      { t: '정보 (코딩)', w: { B: 3, S: 1 }, job: { front: 1, back: 1 } },
      { t: '국어 · 논술 (글쓰기)', w: { H: 2 }, job: { oa: 1, mkt: 1, aipm: 1 } },
      { t: '사회 · 경제', w: { H: 2, A: 1 }, job: { mkt: 1 } },
      { t: '영어 (영어로 된 자료 읽기)', w: { B: 1, S: 1, P: 1 } },
      { t: '미술 · 디자인', w: { H: 1 }, job: { creator: 3, front: 1 } },
      { t: '기술 · 공학 (기계 · 전기 다루기)', w: { F: 3, B: 1 }, job: { network: 2, vision: 1 } },
    ]},
    { id: 'industry', title: 'Part 4. 관심 있는 분야', hint: '나중에 일해 보고 싶은 정도를 골라 주세요', items: [
      { t: '웹사이트 · 앱 · 게임 서비스 회사', w: { B: 1 }, job: { front: 3, back: 3 } },
      { t: '은행 · 공공기관의 전산실', w: { S: 1 }, job: { infrasec: 2, network: 2, soc: 1 } },
      { t: '해킹 · 악성코드에 대응하는 보안 회사', w: { P: 1 }, job: { soc: 3, pentest: 3 } },
      { t: '통신사 · 데이터센터 · 클라우드 회사', w: { S: 1, F: 1 }, job: { network: 3, infrasec: 1, mlops: 1 } },
      { t: '공장 자동화 · CCTV 같은 영상 AI', w: { F: 1 }, job: { vision: 4 }, ai: 1 },
      { t: '회사 사무 · 업무 효율화', job: { oa: 4, curator: 1 } },
      { t: '광고 · SNS · 유튜브 · 웹툰', job: { mkt: 3, creator: 3 } },
      { t: '챗GPT 같은 AI 서비스 자체', job: { aidev: 3, aipm: 1, mlops: 2, aisec: 2, vision: 1 }, ai: 1 },
    ]},
  ];

  // ───────── 직무 ─────────
  // 코리아AI아카데미 과정 분류 기준
  const CATS = {
    web:   { name: '웹 · 앱 개발',             color: 'var(--c-dev)' },
    ai:    { name: 'AI · 빅데이터',             color: 'var(--c-ai)' },
    sec:   { name: '정보보안',                 color: 'var(--c-sec)' },
    net:   { name: '네트워크 · 서버',           color: 'var(--c-infra)' },
    aiuse: { name: 'AI 활용 (업무 · 콘텐츠)',   color: 'var(--c-ax)' },
  };
  // p: 직무 성향 프로필 (0~3), ai: AI 비중 (0~2), course: 학원에서 배우는 과정
  // ext: 「IT · AI 직무 둘러보기」 자료에 없는 직무 (수치 일부 미확인)
  const JOBS = [
    { id: 'front', cat: 'web', name: '프론트엔드 개발자', en: 'Frontend Developer · Web / App',
      p: { B: 3, A: 0, S: 0, P: 0, F: 0, H: 2 }, ai: 0,
      course: '웹&앱개발 — 프론트엔드 개발 · 풀스택 개발자 과정',
      salary: '약 3,000 ~ 4,800만원', prep: '10 ~ 14개월', demand: '매우 높음',
      desc: '사용자가 직접 보고 누르는 웹 · 앱 화면을 만들어요. HTML/CSS와 JavaScript, React로 화면을 구성하고 서버 API와 연결해요. 디자인 감각과 사용자 입장에서 생각하는 힘이 있으면 유리해요.',
      road: ['HTML · CSS · JavaScript 기초 (1~2개월)', 'React 컴포넌트 & 상태관리 (2~4개월)', 'API 연동 · 배포 (3~5개월)', '포트폴리오 & 취업 준비 (1~2개월)'],
      certs: ['정보처리기사', 'SQLD (SQL 개발자)'] },
    { id: 'back', cat: 'web', name: '백엔드 개발자', en: 'Backend Developer · Server / API',
      p: { B: 3, A: 1, S: 2, P: 0, F: 0, H: 0 }, ai: 0,
      course: '웹&앱개발 — 백엔드 개발 · 풀스택 개발자 과정',
      salary: '약 3,000 ~ 4,400만원', prep: '10 ~ 14개월', demand: '매우 높음',
      desc: '로그인, 결제, 게시판처럼 화면 뒤에서 데이터를 처리하는 서버와 DB를 만들어요. Java Spring Boot나 Python으로 API를 만들고 클라우드에 배포해요. 신입은 포트폴리오와 코딩테스트로 평가받는 경우가 많아요.',
      road: ['Java 또는 Python 기초 (1~2개월)', 'Spring Boot · DB 설계 (2~4개월)', '인증 · Docker · AWS 배포 (3~5개월)', '포트폴리오 & 코딩테스트 (1~2개월)'],
      certs: ['정보처리기사', 'SQLD (SQL 개발자)', 'AWS SAA'] },
    { id: 'aidev', cat: 'ai', name: 'AI 응용 SW 개발자', en: 'AI Application Developer · LLM',
      p: { B: 3, A: 2, S: 0, P: 0, F: 0, H: 0 }, ai: 2,
      course: 'AI&빅데이터 — AI 활용 소프트웨어(응용SW) 개발자 과정',
      salary: '약 3,500 ~ 5,500만원', prep: '12 ~ 18개월', demand: '매우 높음 (급상승)',
      desc: '머신러닝 · 딥러닝 모델과 ChatGPT 같은 LLM을 활용해 실제 서비스를 만들어요. LLM API 활용, RAG, AI 에이전트 개발이 핵심 역량이에요. 수학 · 통계 기초와 직접 만든 프로젝트를 중요하게 봐요.',
      road: ['수학 & Python 기반 (2~3개월)', 'ML / DL 핵심 학습 (3~5개월)', 'LLM & AI 서비스 개발 (3~5개월)', '배포 & 취업 준비 (2~3개월)'],
      certs: ['빅데이터분석기사', 'ADsP (데이터분석 준전문가)', 'AICE Associate'] },
    { id: 'vision', cat: 'ai', ext: true, name: 'AI 영상인식(비전) 개발자', en: 'Computer Vision Developer',
      p: { B: 2, A: 2, S: 0, P: 0, F: 2, H: 0 }, ai: 2,
      course: 'AI&빅데이터 — AI 영상 객체 탐지 · 분석 플랫폼 과정',
      desc: '카메라 영상에서 사람 · 물체 · 불량을 찾아내는 AI 모델을 만들고 서비스에 붙여요. 공장 불량 검사, CCTV 안전 관제, 매장 분석처럼 쓰이는 곳이 넓어요. 모델 정확도뿐 아니라 실제 카메라 환경에서 잘 돌아가게 만드는 능력이 중요해요.',
      duties: ['영상 데이터 수집과 라벨링 기준 정하기', '객체 탐지 모델 학습과 정확도 점검', '오탐 · 미탐 사례를 보고 데이터 보강', '탐지 결과를 웹 대시보드 · 알림과 연결'],
      road: ['Python · 수학 기초', '딥러닝 · OpenCV', '객체 탐지 모델 실습', '서비스 연동 · 포트폴리오'],
      certs: ['빅데이터분석기사', 'ADsP', 'AICE Associate'] },
    { id: 'analyst', cat: 'ai', name: '데이터 분석가', en: 'Data Analyst',
      p: { B: 0, A: 3, S: 0, P: 0, F: 0, H: 2 }, ai: 1,
      course: 'AI&빅데이터 — 빅데이터 분석 과정, 빅데이터분석기사 · SQLD 자격증',
      salary: '약 3,300 ~ 5,500만원', prep: '10 ~ 14개월', demand: '높음 (경력직 선호 · 실무형 인재 부족)',
      desc: 'SQL · 파이썬 · BI 도구로 데이터를 뽑고 정리해서 지표를 만들고, 실험 결과를 해석해 기획 · 마케팅 · 운영 부서의 의사결정을 도와요. 신입은 인턴이나 SQL 테스트 · 과제 전형으로 들어가는 경우가 많아요.',
      duties: ['핵심 지표(매출 · 전환율 · 리텐션) 대시보드 점검', '기획 · 마케팅팀 요청을 받아 SQL로 데이터 추출', 'A/B 테스트 결과 집계와 유의성 검정', '이상 지표 원인 분석과 리포트 작성'],
      road: ['기초 (1~3개월)', '핵심 도구 (4~7개월)', '실전 프로젝트 (8~11개월)', '취업 준비 (12~14개월)'],
      certs: ['ADsP', 'SQLD', '빅데이터분석기사'] },
    { id: 'aipm', cat: 'ai', ext: true, name: 'AI 서비스 기획자 (PM)', en: 'AI Product Manager',
      p: { B: 1, A: 1, S: 0, P: 0, F: 0, H: 3 }, ai: 2,
      course: 'AI 업무 활용 과정 + AI&빅데이터 과정 (기획 포트폴리오 중심)',
      desc: 'AI로 어떤 서비스를 만들지 정하고, 개발자 · 디자이너 · 현업 사이에서 기능과 우선순위를 조율해요. 사용자 문제를 정의하고 AI가 낸 결과의 품질 기준과 성과 지표를 정해요. 코딩을 직접 하지 않아도 되지만 AI가 할 수 있는 일과 한계는 알아야 해요.',
      duties: ['사용자 인터뷰로 AI가 풀 문제 정의', 'AI 기능 기획서와 화면 흐름 작성', 'AI 답변 품질 평가 기준 만들기', '출시 후 지표를 보고 다음 개선안 정리'],
      road: ['서비스 기획 기초', '데이터 · AI 이해', 'AI 서비스 프로토타입 만들기', '기획 포트폴리오 · 취업'],
      certs: ['ADsP', 'AICE Basic / Associate', 'SQLD'] },
    { id: 'mlops', cat: 'ai', ext: true, name: 'MLOps 엔지니어', en: 'MLOps Engineer',
      p: { B: 2, A: 1, S: 3, P: 0, F: 0, H: 0 }, ai: 2,
      course: 'AI&빅데이터 — AI 활용 SW 개발자 과정 + 네트워크&서버 과정',
      desc: 'AI 모델을 실제 서비스에 올리고, 데이터가 바뀌어도 모델이 계속 잘 동작하도록 학습 · 배포 · 모니터링을 자동화해요. AI 개발자와 서버 운영 사이에 있는 직무라, 개발이나 인프라 경력을 쌓은 뒤 옮겨 오는 경우가 많아요.',
      duties: ['모델 학습 · 배포 파이프라인 관리', '모델 성능 저하 감시와 재학습 일정 관리', 'GPU 서버와 클라우드 비용 관리', 'AI 개발자가 쓰는 실험 환경 구축'],
      road: ['Python · Linux 기초', '머신러닝 기초', '컨테이너 · 클라우드', '모델 배포 · 모니터링'],
      certs: ['AWS SAA', 'CKA (Kubernetes 관리자)', 'AWS Certified Machine Learning Engineer – Associate'] },
    { id: 'curator', cat: 'ai', ext: true, name: 'AI 데이터 큐레이터', en: 'AI Data Curator · Labeling QA',
      p: { B: 0, A: 2, S: 0, P: 1, F: 0, H: 1 }, ai: 2,
      course: 'AI&빅데이터 — 빅데이터 분석 과정 (입문 직무)',
      desc: 'AI가 배울 데이터를 모으고, 기준에 맞게 라벨을 붙이고, 품질을 검수해요. 데이터 품질이 AI 성능을 좌우해서 꼼꼼함과 기준을 지키는 태도가 중요해요. 진입 장벽이 낮은 편이라 데이터 · AI 분야 첫 경력으로 시작하기 좋아요.',
      duties: ['라벨링 작업 기준서 확인과 예외 사례 정리', '작업 결과 표본 검수와 오류 피드백', '데이터 품질 지표 집계', '모델 팀과 데이터 수집 범위 협의'],
      road: ['컴퓨터 활용 기초', '라벨링 도구 · 기준 이해', '품질 검수 · SQL', '데이터 분석 직무로 확장'],
      certs: ['컴퓨터활용능력', 'ADsP', 'SQLD'] },
    { id: 'aisec', cat: 'sec', name: 'AI 인프라 보안', en: 'AI Security · MLSecOps',
      p: { B: 1, A: 1, S: 2, P: 3, F: 0, H: 0 }, ai: 2,
      course: '정보보안 과정 → 보안 경력을 쌓은 뒤 AI 보안으로 확장',
      salary: '약 4,000 ~ 7,000만원 (경력 전환 기준, 추정)', prep: '18 ~ 24개월', demand: '성장 중 (신흥 직군 · 경력 중심)',
      desc: 'AI 모델 · 파이프라인 · 인프라의 보안을 맡는 새 직군이에요. LLM 프롬프트 인젝션 방어, AI 모델 공급망 보안, AI 거버넌스 체계를 다뤄요. 신입 공고는 드물어서 보안이나 인프라 경력을 쌓은 뒤 넓혀 가는 경로가 현실적이에요.',
      road: ['기반 지식 통합 (4~6개월)', 'AI/ML 보안 전문화 (4~6개월)', 'MLSecOps 파이프라인 구축 (4~5개월)', 'LLM 보안 & AI 거버넌스 (4~6개월)'],
      certs: ['정보보안기사', 'AWS Security Specialty', 'OSCP+ (선택)'] },
    { id: 'soc', cat: 'sec', name: '보안관제 · 침해사고 대응', en: 'Security Operations (SOC) · Incident Response',
      p: { B: 0, A: 1, S: 2, P: 3, F: 0, H: 0 }, ai: 0,
      course: '정보보안 — 보안운영 · 보안사고 분석 과정, 정보보안(산업)기사 자격증',
      salary: '약 3,000 ~ 5,000만원', prep: '12 ~ 20개월', demand: '높음',
      desc: '보안 장비와 로그를 24시간 지켜보면서 공격 시도를 찾아내고, 사고가 나면 원인을 분석해 대응해요. 보안 분야 신입은 보안관제로 시작하는 경우가 많고, 교대 근무가 있을 수 있어요. 경력이 쌓이면 침해사고 분석가나 보안 컨설턴트로 넓혀 갈 수 있어요.',
      road: ['보안 기초 & OS (3~4개월)', '공격 기법 이해 (3~5개월)', '방어 & 보안관제 (3~4개월)', '전문화 & 실전 경험 (3~5개월)'],
      certs: ['정보보안산업기사 · 기사', 'CEH (공인 윤리적 해커)'] },
    { id: 'pentest', cat: 'sec', name: '모의해킹 전문가', en: 'Penetration Tester · White Hacker',
      p: { B: 2, A: 1, S: 1, P: 3, F: 0, H: 0 }, ai: 0,
      course: '정보보안 — 모의해킹 · 침해사고 대응 과정',
      salary: '약 3,000 ~ 5,000만원', prep: '12 ~ 20개월', demand: '높음',
      desc: '공격자의 입장에서 웹 · 시스템 · 네트워크의 취약점을 먼저 찾아내고, 막는 방법을 보고서로 정리해요. 직접 도구를 다루고 코드를 읽는 일이 많아서 만들기와 지키기 성향이 함께 있으면 잘 맞아요.',
      road: ['보안 기초 & OS (3~4개월)', '웹 · 시스템 공격 기법 (3~5개월)', '모의해킹 실습 & 보고서 (3~4개월)', '전문화 & 실전 경험 (3~5개월)'],
      certs: ['정보보안기사', 'CEH (공인 윤리적 해커)', 'OSCP+'] },
    { id: 'infrasec', cat: 'sec', name: '인프라 보안 엔지니어', en: 'Infrastructure / Cloud Security',
      p: { B: 0, A: 0, S: 3, P: 3, F: 0, H: 0 }, ai: 0,
      course: '정보보안 + 네트워크&서버 — 보안 인프라 구축 과정',
      salary: '약 3,200 ~ 5,200만원', prep: '12 ~ 18개월', demand: '높음 (수요 증가)',
      desc: '서버 · 네트워크 · 클라우드 인프라 전반의 보안 구조를 설계하고 운영해요. 방화벽 · IDS/IPS · SIEM 운영부터 클라우드 보안 설계, ISMS 같은 보안 인증 대응까지 맡아요. 네트워크 운영 경험 후 보안으로 옮기는 경로가 일반적이에요.',
      road: ['인프라 & 네트워크 기반 (3~4개월)', '클라우드 보안 (3~4개월)', '보안 아키텍처 설계 (3~4개월)', '컴플라이언스 & 취업 준비 (2~3개월)'],
      certs: ['정보보안기사', 'AWS Security Specialty', 'CCNP Security'] },
    { id: 'network', cat: 'net', ext: true, name: '네트워크 · 시스템 엔지니어', en: 'Network / System Engineer',
      p: { B: 0, A: 0, S: 3, P: 1, F: 2, H: 0 }, ai: 0,
      course: '네트워크&서버 — 네트워크 · 시스템 엔지니어 과정, CCNA · CCNP 자격증',
      salary: '약 3,000 ~ 4,200만원',
      desc: '회사 · 기관의 네트워크 장비와 서버를 설치하고, 끊기지 않게 운영 · 점검해요. 라우터 · 스위치 설정, 리눅스 서버 관리, 장애 대응이 주 업무예요. 실제 장비를 다루는 일이 많고, 경력을 쌓아 클라우드나 인프라 보안으로 넓혀 가기 좋아요.',
      duties: ['네트워크 장비 설정과 장애 원인 점검', '리눅스 · 윈도우 서버 계정 · 백업 관리', '회선 · 장비 증설 작업', '야간 · 주말 점검 작업 대응'],
      road: ['네트워크 기초 (TCP/IP)', '라우팅 · 스위칭 (CCNA)', '리눅스 · 서버 운영', '장비 실습 · 취업 준비'],
      certs: ['CCNA · CCNP', '네트워크관리사', '리눅스마스터'] },
    { id: 'oa', cat: 'aiuse', name: 'AI 업무자동화 전문가', en: 'Office Automation · RPA · AX',
      p: { B: 1, A: 0, S: 1, P: 0, F: 0, H: 3 }, ai: 2,
      course: 'AI 업무 활용 과정',
      salary: '약 2,900 ~ 4,500만원 (추정)', prep: '10 ~ 12개월 (비전공 기준 추정)', demand: '전사 AX 확산으로 현업형 수요 증가',
      desc: '사무 현장의 반복 업무를 찾아 생성형 AI, RPA, 엑셀 · 파이썬으로 자동화해요. 사내 AI 도입, 프롬프트 가이드 작성, 직원 교육도 맡아요. 업무 흐름을 이해하는 게 코딩만큼 중요해서 문과 · 비전공자도 도전할 수 있어요.',
      duties: ['현업 부서와 반복 업무 인터뷰 후 자동화 후보 선정', 'Power Automate · RPA로 보고서 취합 봇 제작', '사내 생성형 AI 프롬프트 템플릿 · 사용 가이드 작성', '자동화 전후 절감 시간을 정리해 성과 보고'],
      road: ['사무 기초 (1~2개월)', '자동화 도구 (2~3개월)', '파이썬 · AI 활용 (2~3개월)', '실전 · 취업 (2~4개월)'],
      certs: ['컴퓨터활용능력 1 · 2급', '사무자동화산업기사', 'AICE Basic / Associate'] },
    { id: 'mkt', cat: 'aiuse', name: 'AI 마케터 · 웹 콘텐츠 담당', en: 'AI Marketer · Web Content',
      p: { B: 0, A: 2, S: 0, P: 0, F: 0, H: 3 }, ai: 1,
      course: '생성형 AI 활용 웹 콘텐츠 · 홍보 실무 과정',
      salary: '약 3,000 ~ 4,500만원', prep: '10 ~ 12개월 (비전공 기준 추정)', demand: '스타트업 · 커머스 중심 꾸준한 수요',
      desc: '생성형 AI로 웹 콘텐츠와 광고 소재를 만들고, 광고 · 방문 데이터를 보고 고객 확보와 구매를 늘려요. GA4와 광고 플랫폼으로 성과를 재고 A/B 테스트해요. 개인 프로젝트로 실제 성과를 보여 주는 게 중요해요.',
      duties: ['GA4 · 광고 대시보드에서 전일 성과 점검', '생성형 AI로 광고 소재 · 카피 변형안 제작', '홈페이지 · 블로그 · SNS 콘텐츠 운영', 'A/B 테스트 결과 정리 후 다음 가설 공유'],
      road: ['마케팅 · 데이터 기초 (1~2개월)', '측정 · 분석 도구 (2~3개월)', 'AI 콘텐츠 · 자동화 (2~3개월)', '포트폴리오 · 취업 (1~2개월)'],
      certs: ['Google Ads 인증', 'Google Analytics 인증 (GA4)', '검색광고마케터 1급'] },
    { id: 'creator', cat: 'aiuse', ext: true, name: '생성형 AI 콘텐츠 크리에이터', en: 'Generative AI Content Creator',
      p: { B: 2, A: 0, S: 0, P: 0, F: 0, H: 2 }, ai: 2,
      course: 'AI 쇼츠(영상) · AI 음원 · AI 웹툰 제작 과정',
      desc: '생성형 AI 도구로 쇼츠 영상 · 음원 · 웹툰 · 이미지를 기획하고 만들어 브랜드나 채널 콘텐츠를 제작해요. 도구를 다루는 기술보다 무엇을 만들지 정하는 기획력과 좋은 결과물을 고르는 안목이 중요해요. 저작권 · 초상권 같은 AI 콘텐츠 규칙도 알아야 해요.',
      duties: ['콘텐츠 기획안과 프롬프트 작성', '영상 · 이미지 생성 후 보정 · 편집', '채널별 반응을 보고 다음 콘텐츠 방향 정하기', '저작권 · 초상권 문제 검토'],
      road: ['디자인 · 영상 기초', '생성형 AI 도구 익히기', '쇼츠 · 웹툰 · 음원 제작 실습', '포트폴리오 · 채널 운영'],
      certs: ['GTQ (그래픽기술자격)', '컴퓨터그래픽스운용기능사', 'AICE Basic'] },
  ];

  // ───────── 점수 계산 ─────────
  const ITEMS = PARTS.flatMap((p, pi) => p.items.map(it => ({ ...it, part: pi, w: it.w || {}, job: it.job || {} })));
  ITEMS.forEach((it, i) => { it.no = i + 1; });
  const JOB_BY_ID = Object.fromEntries(JOBS.map(j => [j.id, j]));
  const BONUS_CAP = 6;

  const mean = a => a.reduce((s, x) => s + x, 0) / (a.length || 1);

  // answers: 문항 번호 순서의 배열 (1~5, 0 = 미응답)
  function score(answers) {
    const val = no => answers[no - 1] || 0;
    const x = no => val(no) ? (val(no) - 1) / 4 : 0;          // 0 ~ 1
    const agree = no => Math.max(0, (val(no) - 3) / 2);        // '그렇다' 쪽만 0 ~ 1

    const num = {}, den = {};
    AXES.forEach(a => { num[a.key] = 0; den[a.key] = 0; });
    const bonus = {};
    const ai = [];
    const basicsRaw = Object.fromEntries(BASICS.map(b => [b.key, []]));
    ITEMS.forEach(it => {
      for (const k in it.w) { num[k] += it.w[k] * x(it.no); den[k] += it.w[k]; }
      for (const j in it.job) bonus[j] = (bonus[j] || 0) + it.job[j] * agree(it.no);
      if (it.ai) ai.push(x(it.no));
      if (it.k) basicsRaw[it.k].push(x(it.no));
    });
    const axes = Object.fromEntries(AXES.map(a => [a.key, den[a.key] ? num[a.key] / den[a.key] : 0]));
    const basics = Object.fromEntries(BASICS.map(b => [b.key, mean(basicsRaw[b.key])]));
    const aiScore = mean(ai);

    // 학생 자신의 평균 대비 높은 축을 직무 프로필과 비교 (응답 성향 차이 보정)
    const sMean = mean(AXES.map(a => axes[a.key]));
    const sc = AXES.map(a => axes[a.key] - sMean);
    const sLen = Math.hypot(...sc);
    const jobs = JOBS.map(j => {
      const pv = AXES.map(a => j.p[a.key]);
      const pMean = mean(pv);
      const pc = pv.map(v => v - pMean);
      const r = sLen > 1e-6 ? sc.reduce((s, v, i) => s + v * pc[i], 0) / (sLen * Math.hypot(...pc)) : 0;
      const fit = (r + 1) / 2;
      const b = Math.min(bonus[j.id] || 0, BONUS_CAP) / BONUS_CAP;
      const aiFit = 1 - Math.abs(aiScore - j.ai / 2);
      const total = 0.65 * fit + 0.25 * b + 0.10 * aiFit;
      const shared = AXES.map((a, i) => ({ a, s: sc[i] > 0 && pc[i] > 0 ? sc[i] * pc[i] : 0 }))
        .filter(o => o.s > 0).sort((p, q) => q.s - p.s).slice(0, 2).map(o => o.a);
      return { job: j, total, pct: Math.round(Math.min(99, total * 100)), shared, bonus: bonus[j.id] || 0 };
    }).sort((p, q) => q.total - p.total);

    return { axes, basics, aiScore, jobs };
  }

  const api = { VERSION, LIKERT, AXES, BASICS, PARTS, ITEMS, CATS, JOBS, JOB_BY_ID, score };
  if (typeof module !== 'undefined') module.exports = api; else root.CAREER = api;
})(this);
