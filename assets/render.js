// 결과 화면 조각 — 검사 페이지와 관리자 페이지가 함께 씀
(function () {
  const { AXES, BASICS, CATS } = window.CAREER;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = v => Math.round(v * 100);

  function radar(axes) {
    const cx = 125, cy = 118, R = 80, n = AXES.length;
    const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    const ring = f => AXES.map((_, i) => pt(i, R * f).map(v => v.toFixed(1)).join(',')).join(' ');
    const at = (a, i) => pt(i, R * Math.max(0.04, axes[a.key]));
    const labels = AXES.map((a, i) => {
      const [x, y] = pt(i, R + 18);
      const anchor = Math.abs(x - cx) < 4 ? 'middle' : x > cx ? 'start' : 'end';
      return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}" font-size="12" fill="var(--fg)">${a.name}</text>`;
    }).join('');
    return `<svg viewBox="0 0 250 236" role="img" aria-label="성향 6가지 레이더 차트">
      ${[0.25, 0.5, 0.75, 1].map(f => `<polygon points="${ring(f)}" fill="none" stroke="var(--line)"/>`).join('')}
      ${AXES.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/>`; }).join('')}
      <polygon points="${AXES.map((a, i) => at(a, i).map(v => v.toFixed(1)).join(',')).join(' ')}" fill="var(--ink)" fill-opacity=".18" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>
      ${AXES.map((a, i) => { const [x, y] = at(a, i); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="var(--ink)"/>`; }).join('')}
      ${labels}
    </svg>`;
  }

  function topAxes(axes) { return [...AXES].sort((a, b) => axes[b.key] - axes[a.key]).slice(0, 2); }

  function axisBars(axes, aiScore) {
    const top = topAxes(axes);
    return `<div class="bars">
      ${AXES.map(a => `<div class="bar-row ${top.includes(a) ? 'top' : ''}"><span class="n">${a.name}</span><span class="t"><i style="width:${pct(axes[a.key])}%"></i></span><span class="v mono">${pct(axes[a.key])}</span></div>`).join('')}
      <div class="bar-row"><span class="n">AI 관심도</span><span class="t"><i style="width:${pct(aiScore)}%;background:var(--c-ai)"></i></span><span class="v mono">${pct(aiScore)}</span></div>
    </div>`;
  }

  function level(v) { return v >= 0.7 ? ['강점', 'lv-hi'] : v >= 0.45 ? ['보통', 'lv-mid'] : ['키워 가요', 'lv-lo']; }

  function basicsGrid(basics) {
    return `<div class="basics">${BASICS.map(b => { const [t, c] = level(basics[b.key]); return `<div><span class="n">${b.name}</span><span class="v">${pct(basics[b.key])}</span><span class="lv ${c}">${t}</span></div>`; }).join('')}</div>`;
  }

  function stat(label, val) { return `<div><dt>${label}</dt><dd class="${val ? '' : 'na'}">${esc(val || '근거 자료 확인 필요')}</dd></div>`; }

  function jobCard(r, rank) {
    const j = r.job, c = CATS[j.cat];
    const reason = r.shared.length
      ? `<b>${r.shared.map(a => a.name).join(' · ')}</b> 성향이 이 직무와 잘 맞아요.` + (r.bonus >= 1 ? ' 관심 있다고 답한 분야 · 활동도 이 직무와 이어져요.' : '')
      : '관심 있다고 답한 분야가 이 직무와 이어져요.';
    return `<article class="job ${rank ? 'rank-' + rank : ''}">
      <div class="job-head">
        ${rank ? `<span class="rank">${rank}</span>` : ''}
        <div style="min-width:0"><h3>${j.name}</h3><span class="en">${j.en}</span></div>
        <div class="pct">${r.pct}<span style="font-size:var(--s-sm)">%</span><small>적합도</small></div>
      </div>
      <div class="chips">
        <span class="chip" style="color:${c.color}">${c.name}</span>
        ${j.ai ? `<span class="chip" style="color:var(--c-ai)">AI 비중 ${j.ai === 2 ? '높음' : '보통'}</span>` : ''}
        ${j.ext ? '<span class="chip ext">자료 밖 직무 · 일부 수치 확인 전</span>' : ''}
      </div>
      ${j.course ? `<p class="course"><span>${esc((window.APP_CONFIG && window.APP_CONFIG.ACADEMY) || '학원')}에서 배우는 과정</span><b>${esc(j.course)}</b></p>` : ''}
      ${rank ? `<p class="why">${reason}</p>` : ''}
      <p class="desc">${j.desc}</p>
      <dl class="stats">${stat('예상 연봉 (신입~5년차)', j.salary)}${stat('준비 기간', j.prep)}${stat('시장 수요', j.demand)}</dl>
      <div class="cols">
        <div><h4>단계별 학습 로드맵</h4><ol class="road">${j.road.map(s => `<li><span>${s}</span></li>`).join('')}</ol></div>
        <div>
          ${j.duties ? `<h4>이런 일을 해요</h4><ul class="plain">${j.duties.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
          <h4 style="${j.duties ? 'margin-top:12px' : ''}">추천 자격증</h4><ul class="plain">${j.certs.map(d => `<li>${d}</li>`).join('')}</ul>
        </div>
      </div>
    </article>`;
  }

  function profilePanel(res) {
    const top = topAxes(res.axes);
    const aiLabel = res.aiScore >= 0.7 ? '높아요' : res.aiScore >= 0.45 ? '보통이에요' : '아직 낮아요';
    return `<section class="panel profile">
      ${radar(res.axes)}
      <div class="sum">
        <span class="eyebrow">성향</span>
        <h2 style="font-size:var(--s-lg)">${top.map(a => a.name).join(' · ')} 성향이 강해요</h2>
        <p class="note">${top[0].desc}. AI 관심도는 ${aiLabel}.</p>
        ${axisBars(res.axes, res.aiScore)}
      </div>
    </section>`;
  }

  window.RENDER = { esc, pct, radar, axisBars, basicsGrid, jobCard, profilePanel, topAxes, level };
})();
