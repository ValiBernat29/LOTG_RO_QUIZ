import { LETTERS, LAW_NAMES, uniqueQuestions, prepareQuestions, score, safeSource, validSession, examDurationMs } from './quiz.js';
const app = document.querySelector('#app');
const prefix = 'lotg.quiz.v1.';
let data = [], session = null, selected = new Set(Object.keys(LAW_NAMES).map(Number));
let mode = 'practice', count = 20, view = 'home', draft = null, reviewWrong = false, result = null;
let timer, toastTimer, modalOpen = false, storageWarning = false;
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = time => new Intl.DateTimeFormat('ro-RO', { day:'numeric', month:'long', year:'numeric' }).format(time);
const examMinutes = questions => new Intl.NumberFormat('ro-RO').format(examDurationMs(questions) / 60000);
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(prefix + key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(prefix + key, JSON.stringify(value)); } catch { if (!storageWarning) { storageWarning = true; toast('Browserul nu permite salvarea progresului. Poți continua sesiunea.'); } } };
const remove = key => { try { localStorage.removeItem(prefix + key); } catch {} };
const history = () => { const value = read('history', []); return Array.isArray(value) ? value.filter(v => v && Number.isFinite(v.total) && Number.isFinite(v.correct) && Number.isFinite(v.finishedAt) && ['practice','exam'].includes(v.mode)) : []; };
function toast(text) { const el = document.querySelector('#toast'); el.textContent = text; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 4000); }
function persist() { if (session) save('active', session); }
function setView(next) {
  view = next; clearInterval(timer); draft = null;
  document.querySelector('#nav-home').classList.toggle('active', next !== 'history');
  document.querySelector('#nav-history').classList.toggle('active', next === 'history');
  document.querySelector('#page-label').textContent = {home:'Antrenament',quiz:session?.mode === 'exam' ? 'Simulare examen' : 'Sesiune de antrenament',result:'Rezultatele tale',history:'Istoric sesiuni'}[next];
  document.querySelector('#history-count').textContent = history().length;
  render();
  if (next !== 'quiz') {
    const heading = app.querySelector('h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  }
  if (next === 'quiz') { timer = setInterval(tick, 1000); tick(); }
}
function pool() { return uniqueQuestions(data.filter(q => selected.has(q.lawNumber))); }
function pitch() { return `<div class="pitch-art" aria-hidden="true"><svg viewBox="0 0 380 230" fill="none"><rect x="12" y="12" width="345" height="205" rx="3" stroke="#6b9471" stroke-width="1.3"/><path d="M184 12v205M12 65h59v99H12m345-99h-59v99h59M12 91h24v48H12m345-48h-24v48h24" stroke="#6b9471" stroke-width="1.3"/><circle cx="184" cy="114" r="35" stroke="#6b9471" stroke-width="1.3"/><circle cx="184" cy="114" r="2.5" fill="#a1c481"/><path d="M71 87c22 12 22 40 0 54m227-54c-22 12-22 40 0 54" stroke="#6b9471" stroke-width="1.3"/><circle cx="140" cy="68" r="7" fill="#c4dea5"/><circle cx="246" cy="144" r="7" fill="#c4dea5"/><circle cx="280" cy="69" r="7" stroke="#a1c481" stroke-width="2"/><path d="M146 70l91 65" stroke="#c4dea5" stroke-dasharray="5 5"/><path d="M226 132l11 3-5-10" stroke="#c4dea5" stroke-width="1.8"/></svg></div><span class="pitch-chip" aria-hidden="true">Pregătit pentru următoarea fază ↗</span>`; }
function render() {
  if (view === 'home') renderHome();
  if (view === 'quiz') renderQuiz();
  if (view === 'result') renderResult();
  if (view === 'history') renderHistory();
}
function renderHome() {
  const sessions = history();
  const totals = sessions.reduce((a,v) => ({correct:a.correct + v.correct,total:a.total + v.total}), {correct:0,total:0});
  const available = pool().length, actual = Math.min(count === 'all' ? available : count, available);
  app.innerHTML = `<div class="headline"><div><div class="eyebrow"><span class="online-dot"></span> ANTRENEAZĂ-ȚI DECIZIILE</div><h1>Fiecare fază.<br>O decizie mai bună.</h1><p class="intro">Pregătirea începe înainte de primul fluier.<br>Exersează Legile Jocului, în ritmul tău.</p></div><div class="date-pill">${esc(date(Date.now()))}</div></div>
    ${session ? `<div class="resume"><span aria-hidden="true">◷</span><div><strong>Ai o sesiune în desfășurare</strong><p>${score(session).answered} din ${session.questions.length} răspunsuri · ${session.mode === 'exam' ? 'Simulare examen; timpul continuă să curgă' : 'Antrenament'}</p></div><button class="primary" data-action="resume">Continuă ↗</button></div>` : ''}
    <section class="hero"><div class="hero-copy"><div class="eyebrow">DIN TEREN, ÎN ANTRENAMENT</div><h2>Cunoaște legea.<br>Ia decizia cu încredere.</h2><p>Situații de joc și patru variante de răspuns.<br>Alege decizia corectă și află unde mai ai de exersat.</p><div class="hero-tags"><span>${data.length} întrebări în bancă</span><span>17 legi</span><span>În limba română</span></div></div>${pitch()}</section>
    <section class="stats" aria-label="Progresul tău"><div class="stat"><span class="stat-icon">◎</span><div><div class="stat-value">${sessions.length}</div><div class="stat-caption">Sesiuni finalizate</div></div></div><div class="stat"><span class="stat-icon">✓</span><div><div class="stat-value">${totals.total ? Math.round(totals.correct / totals.total * 100) + '%' : '—'}</div><div class="stat-caption">Răspunsuri corecte</div></div></div><div class="stat"><span class="stat-icon">▤</span><div><div class="stat-value">${totals.total}</div><div class="stat-caption">Întrebări parcurse</div></div></div></section>
    <div class="section-title"><h2>Construiește-ți antrenamentul</h2><span>Tu alegi ritmul.</span></div>
    <div class="setup-grid"><section class="card laws-card"><div class="card-heading"><span class="step">1</span> Alege legile</div><p class="laws-subtitle">Concentrează-te pe o lege sau pregătește un test mixt.</p><div class="laws-toolbar"><span>${selected.size} din 17 legi selectate</span><button class="text-button" data-action="toggle-laws">${selected.size === 17 ? 'Deselectează toate' : 'Selectează toate'}</button></div><div class="law-list">${Object.entries(LAW_NAMES).map(([id,name]) => `<label class="law"><input type="checkbox" data-law="${id}" ${selected.has(+id) ? 'checked' : ''}><span class="law-number">${id.padStart(2,'0')}</span><span class="law-name">${esc(name)}</span><span class="law-count">${data.filter(q => q.lawNumber === +id).length}</span></label>`).join('')}</div></section>
    <section class="card config-card"><div class="card-heading"><span class="step">2</span> Cum vrei să exersezi?</div><div class="modes"><button class="mode ${mode === 'practice' ? 'selected' : ''}" data-mode="practice" aria-pressed="${mode === 'practice'}"><div class="mode-top"><span>◈</span><i class="radio"></i></div><strong>Antrenament</strong><p>Corectare imediată.<br>Fără presiunea timpului.</p></button><button class="mode ${mode === 'exam' ? 'selected' : ''}" data-mode="exam" aria-pressed="${mode === 'exam'}"><div class="mode-top"><span>◷</span><i class="radio"></i></div><strong>Simulare examen</strong><p>Rezultate la final.<br>30 de minute / 20 de întrebări.</p></button></div><div class="card-heading"><span class="step">3</span> Numărul de întrebări</div><div class="counts">${[10,20,40,'all'].map(n => `<button class="count-button ${count === n ? 'selected' : ''}" data-count="${n}" aria-pressed="${count === n}">${n === 'all' ? 'Toate' : n}<small>${n === 'all' ? 'disponibile' : 'întrebări'}</small></button>`).join('')}</div><button class="primary wide" data-action="start" ${actual ? '' : 'disabled'}>Începe ${mode === 'exam' ? 'testul' : 'antrenamentul'} <span class="arrow">↗</span></button><p class="setup-help">${actual ? `${actual} întrebări · ${mode === 'exam' ? examMinutes(actual) + ' minute' : 'în ritmul tău'}` : 'Selectează cel puțin o lege.'}<br>${available} situații distincte disponibile</p></section>
    <aside class="card note-card"><h3>Un test diferit, de fiecare dată.</h3><p>Întrebările și variantele sunt amestecate. Situațiile identice din banca de întrebări apar o singură dată într-o sesiune.</p><span>Pregătire constantă. Decizii mai sigure. ↗</span></aside></div>`;
}
function start() {
  const available = pool(); if (!available.length) return;
  const questions = prepareQuestions(available, count === 'all' ? available.length : +count);
  const now = Date.now();
  session = {version:1, timePolicyVersion:2, mode, questions, answers:{}, flags:[], index:0, startedAt:now, deadline: mode === 'exam' ? now + examDurationMs(questions.length) : null};
  persist(); setView('quiz'); focusQuestion();
}
function focusQuestion() { requestAnimationFrame(() => { document.querySelector('.question-text')?.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }); }
function renderQuiz() {
  const q = session.questions[session.index], summary = score(session), answer = session.answers[q.id];
  const checked = session.mode === 'practice' && !!answer;
  const picked = session.mode === 'exam' ? answer : (draft ?? answer);
  const correct = answer === q.correctOption, marked = session.flags.includes(q.id), source = safeSource(q.sourceUrl);
  app.innerHTML = `<div class="quiz-heading"><div><div class="eyebrow">${session.mode === 'exam' ? 'SIMULARE EXAMEN' : 'ANTRENAMENT ÎN DESFĂȘURARE'}</div><h1>Care este decizia ta?</h1><p>${session.questions.length} situații de joc · ${session.mode === 'exam' ? 'Corectare la final' : 'Corectare după fiecare răspuns'}</p></div><span class="time-chip" id="timer" aria-label="${session.mode === 'exam' ? 'Timp rămas' : 'Timp parcurs'}">00:00</span></div>
    <div class="quiz-grid"><section class="card question-card"><div class="question-meta"><span class="law-tag">Legea ${q.lawNumber} · ${esc(LAW_NAMES[q.lawNumber])}</span><button class="bookmark ${marked ? 'marked' : ''}" data-action="flag" aria-pressed="${marked}">${marked ? '★ Marcată' : '☆ Marchează'}</button></div><div class="question-number">ÎNTREBAREA ${session.index + 1} DIN ${session.questions.length}</div><h2 class="question-text" tabindex="-1">${esc(q.questionRo)}</h2>
    <div class="options" role="group" aria-label="Variante de răspuns">${LETTERS.map(letter => `<button class="option ${picked === letter ? 'selected' : ''} ${checked && letter === q.correctOption ? 'correct' : ''} ${checked && letter === answer && !correct ? 'incorrect' : ''}" data-answer="${letter}" aria-pressed="${picked === letter}" ${checked ? 'disabled' : ''}><span class="option-letter">${letter}</span><span>${esc(q.options[letter])}</span></button>`).join('')}</div>
    ${checked ? `<div class="feedback ${correct ? '' : 'error'}" role="status"><strong>${correct ? '✓ Ai luat decizia corectă.' : 'Mai exersăm această situație.'}</strong>${correct ? 'Răspunsul tău corespunde deciziei corecte.' : `Răspunsul corect este ${q.correctOption}: ${esc(q.options[q.correctOption])}`}${source ? `<br><a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Consultă legea pe site-ul IFAB ↗</a>` : ''}</div>` : ''}
    <div class="question-actions"><button class="secondary" data-action="previous" ${session.index ? '' : 'disabled'}>← Înapoi</button>${session.mode === 'practice' && !checked ? `<button class="primary" data-action="verify" ${draft ? '' : 'disabled'}>Verifică răspunsul <span>✓</span></button>` : `<button class="primary" data-action="next">${session.index === session.questions.length - 1 ? 'Vezi rezultatul' : 'Următoarea întrebare'} <span>→</span></button>`}</div><div class="keyboard-note"><span class="key">1</span>–<span class="key">4</span> pentru răspuns · <span class="key">Enter</span> pentru a continua</div></section>
    <aside><section class="card progress-card"><h3>Progresul sesiunii</h3><div class="progress-label"><span>${summary.answered} răspunsuri</span><span>${Math.round(summary.answered/summary.total*100)}%</span></div><div class="progress-bar"><div class="progress-fill" style="width:${summary.answered/summary.total*100}%"></div></div><div class="question-grid" aria-label="Navigare între întrebări">${session.questions.map((item,i) => {const a=session.answers[item.id];return `<button class="question-dot ${i === session.index ? 'current' : ''} ${a ? 'answered' : ''} ${session.mode === 'practice' && a ? a === item.correctOption ? 'right' : 'wrong' : ''} ${session.flags.includes(item.id) ? 'flagged' : ''}" data-index="${i}" ${i === session.index ? 'aria-current="step"' : ''} aria-label="Întrebarea ${i+1}${a ? ', răspuns înregistrat' : ', fără răspuns'}${session.flags.includes(item.id) ? ', marcată' : ''}">${i+1}</button>`;}).join('')}</div><div class="legend"><span><i></i>Răspuns</span><span><i class="empty"></i>De parcurs</span><span><i class="flagged"></i>Marcată</span></div><button class="secondary wide" data-action="finish">Încheie sesiunea</button><button class="text-button" style="margin-top:16px;width:100%" data-action="home">Revino la antrenament</button></section><section class="card glossary"><div class="card-heading">REPERE PENTRU ARBITRI</div><dl><dt>SPA</dt><dd>Oprirea unui atac promițător.</dd><dt>DOGSO</dt><dd>Împiedicarea unui gol sau a unei ocazii clare de gol.</dd></dl></section></aside></div>`;
  updateTimer();
}
function pick(letter) {
  const q=session.questions[session.index];
  if (session.mode === 'practice' && session.answers[q.id]) return;
  draft=letter;
  if (session.mode === 'exam') { session.answers[q.id]=letter; persist(); }
  renderQuiz();
  app.querySelector(`[data-answer="${letter}"]`)?.focus({preventScroll:true});
}
function verify() { if (!draft) return; session.answers[session.questions[session.index].id]=draft; draft=null; persist(); renderQuiz(); app.querySelector('[data-action="next"]')?.focus({preventScroll:true}); }
function goto(index) { if (index < 0 || index >= session.questions.length) return; session.index=index; draft=null; persist(); renderQuiz(); focusQuestion(); }
function updateTimer() {
  const el=document.querySelector('#timer'); if (!el || !session) return;
  const seconds = Math.max(0, Math.floor((session.mode === 'exam' ? session.deadline-Date.now() : Date.now()-session.startedAt) / 1000));
  el.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  el.classList.toggle('urgent',session.mode === 'exam' && seconds < 60);
}
function tick() {
  if (view !== 'quiz' || !session) return;
  if (session.mode === 'exam' && Date.now() >= session.deadline) { closeModal(); finish(true); return; }
  updateTimer();
}
function finish(expired=false) {
  if (!session) return;
  const summary=score(session), completed={...session,finishedAt:Date.now(),expired};
  const entries=history(); entries.unshift({mode:session.mode,...summary,finishedAt:completed.finishedAt});
  save('history',entries.slice(0,50)); save('lastResult',completed); remove('active');
  result=completed; session=null; reviewWrong=false; setView('result');
  if (expired) toast('Timpul a expirat. Răspunsurile tale au fost înregistrate.');
}
function requestFinish() {
  const unanswered=score(session).total-score(session).answered;
  if (!unanswered) { finish(); return; }
  confirmAction('Închei sesiunea?', `Ai ${unanswered} ${unanswered === 1 ? 'întrebare fără răspuns' : 'întrebări fără răspuns'}. Acestea vor fi incluse în rezultat ca necompletate.`, 'Vezi rezultatul', () => finish());
}
function confirmAction(title,text,label,action) {
  if (modalOpen) return; modalOpen=true;
  const before=document.activeElement;
  const backdrop=document.createElement('div'); backdrop.className='modal-backdrop';
  backdrop.innerHTML=`<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description"><h2 id="modal-title">${esc(title)}</h2><p id="modal-description">${esc(text)}</p><div class="modal-actions"><button class="secondary" data-modal="cancel">Continuă sesiunea</button><button class="primary" data-modal="accept">${esc(label)}</button></div></section>`;
  document.body.append(backdrop);
  backdrop.querySelector('[data-modal="cancel"]').onclick=()=>{closeModal();before?.focus();};
  backdrop.querySelector('[data-modal="accept"]').onclick=()=>{closeModal();action();};
  backdrop.querySelector('button').focus();
  backdrop.onkeydown=e=>{if(e.key==='Escape'){closeModal();before?.focus();}if(e.key==='Tab'){e.preventDefault();const buttons=[...backdrop.querySelectorAll('button')];buttons[(buttons.indexOf(document.activeElement)+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}};
}
function closeModal() { document.querySelector('.modal-backdrop')?.remove(); modalOpen=false; }
function renderResult() {
  if (!result) { setView('home'); return; }
  const summary=score(result), missing=summary.total-summary.answered;
  const mistakes=result.questions.filter(q=>result.answers[q.id]!==q.correctOption);
  const list=reviewWrong ? mistakes : result.questions;
  app.innerHTML=`<div class="headline"><div><div class="eyebrow">SESIUNE FINALIZATĂ</div><h1>Încă un pas înainte.</h1><p class="intro">${result.mode === 'exam' ? 'Simulare examen' : 'Antrenament'} · ${esc(date(result.finishedAt))}${result.expired ? ' · Timp expirat' : ''}</p></div></div><section class="result-hero"><div class="score-ring"><strong>${summary.percent}%</strong><small>RĂSPUNSURI CORECTE</small></div><div><h2>${summary.percent >= 80 ? 'Bine pregătit pentru teren.' : 'Fiecare greșeală e o lecție.'}</h2><p>${summary.correct} răspunsuri corecte din ${summary.total}.<br>${summary.answered-summary.correct} greșite${missing ? ` · ${missing} fără răspuns` : ''}.</p><button class="primary" data-action="home">Un nou antrenament ↗</button></div></section><div class="result-actions"><button class="secondary" data-action="retry" ${mistakes.length ? '' : 'disabled'}>↻ Exersează situațiile greșite</button><button class="secondary" data-action="history">Vezi istoricul →</button></div><div class="section-title"><h2>Revizuiește deciziile</h2><label class="review-filter"><input type="checkbox" id="review-wrong" ${reviewWrong ? 'checked' : ''}> Doar greșite / necompletate</label></div>${list.length ? list.map(q=>{const a=result.answers[q.id],right=a===q.correctOption,source=safeSource(q.sourceUrl);return `<details class="review-item"><summary><span class="review-status ${right?'':a?'wrong':'empty'}">${right?'Corect':a?'Greșit':'Fără răspuns'}</span><span>${esc(q.questionRo)}</span></summary><div class="review-answer">${a?`<p class="${right?'right-answer':'wrong-answer'}"><strong>Răspunsul tău:</strong> ${a}. ${esc(q.options[a])}</p>`:'<p>Nu ai selectat un răspuns.</p>'}<p class="right-answer"><strong>Decizia corectă:</strong> ${q.correctOption}. ${esc(q.options[q.correctOption])}</p>${source?`<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Legea ${q.lawNumber} pe site-ul IFAB ↗</a>`:''}</div></details>`;}).join(''):'<div class="empty-state"><h2>Toate deciziile sunt corecte.</h2><p>Poți începe un nou antrenament.</p></div>'}`;
}
function retry() {
  const wrong=result.questions.filter(q=>result.answers[q.id]!==q.correctOption);
  if (!wrong.length) return;
  const questions=prepareQuestions(wrong,wrong.length);
  session={version:1,mode:'practice',questions,answers:{},flags:[],index:0,startedAt:Date.now(),deadline:null};
  persist();setView('quiz');focusQuestion();
}
function renderHistory() {
  const entries=history(),last=read('lastResult',null);
  app.innerHTML=`<div class="headline"><div><div class="eyebrow">PROGRESUL TĂU</div><h1>Pregătirea lasă urme.</h1><p class="intro">Ultimele 50 de sesiuni, salvate în acest browser.</p></div><button class="secondary" data-action="home">← Antrenament</button></div>${entries.length?`<section class="card"><div class="section-title"><h2>Sesiuni finalizate</h2>${validSession(last)?'<button class="text-button" data-action="last-result">Revizuiește ultima sesiune</button>':''}</div><div class="history-table-wrap"><table class="history-table"><thead><tr><th>DATA</th><th>MOD</th><th>CORECTE</th><th>SCOR</th></tr></thead><tbody>${entries.map(item=>`<tr><td>${esc(date(item.finishedAt))}</td><td>${item.mode==='exam'?'Simulare examen':'Antrenament'}</td><td>${item.correct} / ${item.total}</td><td><span class="score-pill">${Math.round(item.correct/item.total*100)}%</span></td></tr>`).join('')}</tbody></table></div></section>`:'<div class="empty-state"><h2>Primul antrenament te așteaptă.</h2><p>După ce finalizezi o sesiune, rezultatul va apărea aici.</p><button class="primary" data-action="home">Începe pregătirea ↗</button></div>'}`;
}
app.addEventListener('change',e=>{
  const law=e.target.dataset.law;
  if(law){if(e.target.checked)selected.add(+law);else selected.delete(+law);renderHome();app.querySelector(`[data-law="${law}"]`)?.focus({preventScroll:true});}
  if(e.target.id==='review-wrong'){reviewWrong=e.target.checked;renderResult();app.querySelector('#review-wrong')?.focus({preventScroll:true});}
});
app.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.mode){mode=button.dataset.mode;renderHome();return;}
  if(button.dataset.count){count=button.dataset.count==='all'?'all':+button.dataset.count;renderHome();return;}
  if(button.dataset.answer){pick(button.dataset.answer);return;}
  if(button.dataset.index!==undefined){goto(+button.dataset.index);return;}
  switch(button.dataset.action){
    case 'toggle-laws':selected=selected.size===17?new Set():new Set(Object.keys(LAW_NAMES).map(Number));renderHome();break;
    case 'start':if(session)confirmAction('Începi o sesiune nouă?','Sesiunea în desfășurare va fi înlocuită. Rezultatele sesiunilor finalizate rămân în istoric.','Începe sesiunea',start);else start();break;
    case 'resume':setView('quiz');break;
    case 'verify':verify();break;
    case 'next':if(session.index===session.questions.length-1)requestFinish();else goto(session.index+1);break;
    case 'previous':goto(session.index-1);break;
    case 'flag':{const id=session.questions[session.index].id;session.flags=session.flags.includes(id)?session.flags.filter(v=>v!==id):[...session.flags,id];persist();renderQuiz();break;}
    case 'finish':requestFinish();break;
    case 'home':setView('home');break;
    case 'history':setView('history');break;
    case 'retry':if(session)confirmAction('Reiei situațiile greșite?','Sesiunea în desfășurare va fi înlocuită cu acest antrenament.','Reia întrebările',retry);else retry();break;
    case 'last-result':{const last=read('lastResult',null);if(validSession(last)){result=last;reviewWrong=false;setView('result');}break;}
  }
});
document.querySelector('#nav-home').onclick=()=>setView('home');
document.querySelector('#nav-history').onclick=()=>setView('history');
document.querySelector('.brand').onclick=e=>{e.preventDefault();setView('home');};
document.addEventListener('keydown',e=>{
  if(view!=='quiz'||modalOpen||e.altKey||e.ctrlKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(/^[1-4]$/.test(e.key)){e.preventDefault();pick(LETTERS[+e.key-1]);}
  if(e.key==='Enter'&&!['BUTTON','A'].includes(e.target.tagName)){e.preventDefault();const button=document.querySelector('[data-action="verify"],[data-action="next"]');if(button&&!button.disabled)button.click();}
});
window.addEventListener('beforeunload',persist);
async function boot(){
  try{
    const response=await fetch('./questions.json');if(!response.ok)throw new Error('Questions unavailable');
    const value=await response.json();if(!Array.isArray(value)||!value.length||!value.every(q=>Number.isInteger(q.id)&&LAW_NAMES[q.lawNumber]&&typeof q.questionRo==='string'&&q.options&&LETTERS.every(k=>typeof q.options[k]==='string')&&LETTERS.includes(q.correctOption)))throw new Error('Invalid question bank');
    data=value;const stored=read('active',null);if(validSession(stored)){session={...stored,flags:Array.isArray(stored.flags)?stored.flags:[]};
      if(session.mode==='exam'&&(session.timePolicyVersion??1)<2){session.deadline=session.startedAt+examDurationMs(session.questions.length);session.timePolicyVersion=2;persist();}
    }
    if(session?.mode==='exam'&&Date.now()>=session.deadline){finish(true);return;}
    setView('home');
  }catch{app.innerHTML='<div class="empty-state"><h2>Nu am putut încărca întrebările.</h2><p>Verifică conexiunea și reîncarcă pagina.<br>Pentru folosirea locală, pornește interfața conform instrucțiunilor proiectului.</p><button class="primary" id="reload">Reîncearcă ↻</button></div>';document.querySelector('#reload').onclick=()=>location.reload();}
}
boot();
