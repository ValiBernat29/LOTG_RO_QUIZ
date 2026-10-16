import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findLawReference,renderLawExplanation,validateLawLibrary} from '../dist/laws-ro.js';
import {prepareQuestions} from '../dist/quiz.js';
const read=async path=>JSON.parse((await readFile(new URL(path,import.meta.url),'utf8')).replace(/^\uFEFF/u,''));
const bank=await read('../dist/questions.json'),library=await read('../dist/laws-ro.json');
const get=id=>findLawReference(library,bank.find(q=>q.id===id));
const ids=[628,629,630,633,634,636,639,642,643,644,646,647,648,651,653,655,656,657,658,659,660,661];

test('The 22 free-kick scenarios match literal official Romanian and survive shuffled options',()=>{
  assert.equal(library.references.filter(r=>r.editionCheckId==='free-kicks-2026-27-review').length,22);
  for(const id of ids){
    const q=bank.find(q=>q.id===id),passages=get(id);
    assert.ok(passages.every(p=>p.source.translation==='official'&&p.source.edition==='2025/26'&&p.reviewedEdition==='2026/27'));
    assert.deepEqual(findLawReference(library,prepareQuestions([q],1,()=>.37)[0]),passages);
    for(const p of passages)for(const quote of p.highlights)assert.ok(p.text.includes(quote));
  }
  assert.equal(validateLawLibrary(library),library);
});

test('Second touches are penalised with an IFK, not the direct-own-goal corner exception',()=>{
  for(const id of [630,639,653]){
    assert.ok(get(id).some(p=>p.id==='free-second-touch'));
    assert.ok(get(id).some(p=>p.id==='free-kick-position'));
    assert.ok(!get(id).some(p=>p.id==='free-goals'));
  }
  assert.ok(get(633).some(p=>p.id==='spa-caution'));
  for(const id of [633,643])assert.ok(get(id).some(p=>p.id==='red-dogso-free-kick'));
});

test('Direct own goals, direct IFK goals and goalkeeper-touched own goals have distinct explanations',()=>{
  for(const id of [648,661]){
    const p=get(id).find(p=>p.id==='free-goals');
    assert.ok(p.highlights.every(h=>h.includes('poarta proprie')&&h.includes('lovitură de colț')));
  }
  for(const id of [651,659]){
    const p=get(id).find(p=>p.id==='free-goals');
    assert.ok(p.highlights.every(h=>h.includes('lovitură liberă indirectă')&&h.includes('lovitură de poartă')));
  }
  assert.ok(get(636).some(p=>p.id==='goal-scored'));
  assert.ok(get(636).some(p=>p.id==='kickoff-after-goal'));
  assert.ok(!get(636).some(p=>p.id==='free-goals'));
});

test('Wall proximity before the kick differs from proximity after the ball is in play',()=>{
  assert.ok(get(660).some(p=>p.id==='free-wall-infringement'));
  assert.ok(get(660).some(p=>p.id==='free-kick-position'));
  assert.ok(get(647).some(p=>p.id==='free-wall'&&p.highlights.some(h=>h.includes('până când mingea este în joc'))));
  assert.ok(get(647).some(p=>p.id==='goal-scored'));
  assert.ok(!get(647).some(p=>p.id==='free-wall-infringement'));
  assert.ok(get(634).some(p=>p.highlights.some(h=>h.includes('între stâlpii porții'))));
});

test('Quick interception, deliberate prevention, a permitted feint and a legal kick at an opponent are distinct',()=>{
  const prevented=get(656).find(p=>p.id==='free-distance-infringement');
  const intercepted=get(657).find(p=>p.id==='free-distance-infringement');
  assert.ok(prevented.highlights.every(h=>h.includes('trebuie să fie avertizat')));
  assert.ok(intercepted.highlights.every(h=>h.includes('arbitrul lasă jocul să continue')&&!h.includes('avertizat')));
  assert.ok(get(644).some(p=>p.id==='free-feint'));
  assert.ok(get(644).some(p=>p.id==='distance-caution'));
  assert.ok(get(655).some(p=>p.id==='free-kick-off-opponent'));
  assert.ok(!get(655).some(p=>p.id==='free-second-touch'));
});

test('Compound decisions separately justify the boundary restart, reckless caution and back-pass trick initiator',()=>{
  assert.ok(get(628).some(p=>p.id==='free-offfield'));
  assert.ok(get(628).some(p=>p.id==='reckless-caution'));
  for(const id of [629,646]){
    assert.ok(get(id).some(p=>p.id==='deliberate-trick-ifk'));
    assert.ok(get(id).some(p=>p.id==='deliberate-trick-caution'&&p.highlights.some(h=>h.includes('portarul este sancționat dacă este responsabil'))));
  }
});

test('Remaining nuanced scenarios are tracked and receive no guessed article or answer correction',async()=>{
  const pending=await read('../laws/free-kicks-pending.json');
  for(const row of pending.cases)assert.equal(get(row.id),null);
  assert.ok(pending.cases.find(r=>r.id===631).reason.includes('interpretarea specifică'));
  assert.ok(pending.cases.find(r=>r.id===626).reason.includes('5.3'));
  assert.ok(get(642).some(p=>p.id==='free-ifk-signal'));
  // The standalone web checkout on Netlify does not contain the parent scraper.
  try { assert.deepEqual(bank,await read('../../lotg_ro_questions.json')); }
  catch(error){ if(error.code!=='ENOENT')throw error; }
  assert.equal(bank.find(q=>q.id===298).correctOption,'A');
});

test('Duplicate reviews propagate regardless of the first record while the modal keeps the simplified layout',async()=>{
  const audit=await read('../laws/rule-change-review.json');
  for(const id of ids){
    assert.ok(audit.checked.some(r=>r.ids.includes(id)));
    const q=bank.find(q=>q.id===id),html=renderLawExplanation(library,q);
    assert.ok(!/Pagina|Scanare:|PDF românesc|transcriere|Verificare IFAB|href=/u.test(html));
    assert.equal((html.match(/Ediția de referință:/gu)??[]).length,1);
    for(const duplicate of bank.filter(other=>other.questionRo===q.questionRo&&other.options[other.correctOption]===q.options[q.correctOption]))
      assert.deepEqual(findLawReference(library,duplicate),get(id));
  }
});
