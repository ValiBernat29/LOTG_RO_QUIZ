import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findLawReference,renderLawExplanation,validateLawLibrary} from '../dist/laws-ro.js';
import {prepareQuestions} from '../dist/quiz.js';
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const library=await read('../dist/laws-ro.json'),bank=await read('../dist/questions.json');
const q=id=>bank.find(q=>q.id===id),get=id=>findLawReference(library,q(id));
const ids=[742,743,744,746,747,749,750,751,753,754,756,757,758,759,760,761,764,765,768,770,771,773,774,776,777,778,779,788];

test('All 28 boundary restart associations retain official Romanian and resolve after shuffling',()=>{
  assert.equal(library.references.filter(r=>r.editionCheckId==='boundary-restarts-2026-27-review').length,28);
  for(const id of ids){
    const passages=get(id);
    assert.ok(passages.every(p=>p.source.translation==='official'&&p.reviewedEdition==='2026/27'));
    assert.deepEqual(findLawReference(library,prepareQuestions([q(id)],1,()=>.42)[0]),passages);
    for(const p of passages)for(const h of p.highlights)assert.ok(p.text.includes(h));
  }
  assert.equal(validateLawLibrary(library),library);
});

test('Throw-in foot position, delivery and ground contact select the corresponding requirement and restart',()=>{
  for(const id of [743,750])assert.ok(get(id).some(p=>p.id==='throw-delivery'&&p.highlights.every(h=>h.includes('ambele picioare'))));
  assert.ok(get(749).some(p=>p.id==='throw-entry-restart'&&p.highlights.some(h=>h.includes('echipa adversă'))));
  assert.ok(get(742).some(p=>p.id==='throw-delivery'&&p.highlights.some(h=>h.includes('din spate și pe deasupra capului'))));
  for(const id of [747,758]){
    const p=get(id).find(p=>p.id==='throw-entry-restart');
    assert.ok(p.highlights.every(h=>h.includes('de aceeași echipă')&&!h.includes('echipa adversă')));
  }
  assert.ok(get(761).some(p=>p.id==='throw-delivery'&&p.highlights.some(h=>h.includes('La momentul aruncării'))));
});

test('Direct throw-in goals and the no-offside exception do not become a valid goal or a second-touch offence',()=>{
  assert.ok(get(746).some(p=>p.highlights.some(h=>h.includes('se acordă lovitură de colț'))));
  const direct=get(753).find(p=>p.id==='throw-direct-goals');
  assert.ok(direct.highlights.some(h=>h.includes('poarta adversă - se acordă lovitură de poartă')));
  assert.ok(get(753).some(p=>p.id==='offside-direct-restarts'&&p.highlights.includes('• dintr-o aruncare de la margine.')));
  assert.ok(!get(753).some(p=>p.id==='offside-ifk'||p.id==='goal-scored'));
  assert.ok(get(760).some(p=>p.id==='throw-direct-goals'&&p.highlights[0].includes('poarta echipei care execută')));
});

test('A referee deflection followed by the ball leaving the field does not show a dropped-ball passage',()=>{
  assert.ok(get(744).some(p=>p.id==='ball-out-boundary'));
  assert.ok(get(744).some(p=>p.id==='throw-in-restart'));
  assert.ok(!get(744).some(p=>p.id==='ball-out'||p.id==='dropped-ball'));
});

test('Interference after a throw-in, legal throwing at an opponent and the SPA second touch stay distinct',()=>{
  for(const id of [751,759])assert.ok(get(id).some(p=>p.id==='throw-unfair-interference'&&p.highlights.some(h=>h.includes('avertizat')&&h.includes('lovitură liberă indirectă'))));
  assert.ok(get(754).some(p=>p.id==='throw-second-touch'));
  assert.ok(get(754).some(p=>p.id==='spa-caution'));
  assert.ok(get(756).some(p=>p.id==='throw-off-opponent'));
  assert.ok(!get(756).some(p=>p.id==='throw-second-touch'));
  assert.ok(get(788).some(p=>p.id==='corner-off-opponent'&&p.law===17));
});

test('Keeper handling a direct throw differs from a sanctioned second touch after a goal kick',()=>{
  assert.ok(get(757).some(p=>p.id==='keeper-direct-throw-ifk'&&p.highlights.some(h=>h.includes('aruncare de la margine efectuată de un coechipier'))));
  assert.ok(get(757).some(p=>p.id==='keeper-illegal-handling-no-card'));
  assert.ok(get(778).some(p=>p.id==='goal-kick-second-touch'&&p.highlights.some(h=>h.includes('executantul este portarul'))));
  assert.ok(get(778).some(p=>p.id==='keeper-second-touch-discipline'));
  assert.ok(get(778).some(p=>p.id==='spa-caution'));
  assert.ok(get(778).some(p=>p.id==='red-dogso-free-kick'));
  assert.ok(!get(778).some(p=>p.id==='keeper-illegal-handling-no-card'));
});

test('Goal-kick timing and genuine lack of time to leave support play continuing, not deliberate encroachment',()=>{
  for(const id of [768,770,779]){
    assert.ok(get(id).some(p=>p.id==='goal-kick-no-time-to-leave'&&p.highlights.some(h=>h.includes('nu au avut timp să o părăsească'))));
    assert.ok(get(id).some(p=>p.id==='goal-kick-procedure'));
  }
  for(const id of [768,770,773])assert.ok(get(id).some(p=>p.id==='goal-scored'));
  assert.ok(!get(773).some(p=>p.id==='goal-kick-no-time-to-leave'));
  assert.ok(get(774).some(p=>p.id==='goal-kick-foul-before-play'));
  assert.ok(get(777).some(p=>p.id==='goal-kick-direct-goals'&&p.highlights.some(h=>h.includes('numai împotriva echipei adverse'))));
  assert.equal(get(769),null);assert.equal(get(775),null);
});

test('A DOGSO second touch followed by a goal uses the Romanian 2026 summary, not the no-goal sending-off rule',()=>{
  for(const id of [764,765]){
    assert.ok(get(id).some(p=>p.id==='advantage'));
    assert.ok(get(id).some(p=>p.id==='goal-scored'));
    assert.ok(get(id).some(p=>p.id==='dogso-advantage-goal-summary-2627'&&p.source.kind==='official-ro-scan'&&p.source.edition==='2026/27'&&p.editionCheck.sections.includes('12.Rezumat')));
    assert.ok(!get(id).some(p=>p.id==='red-dogso-free-kick'));
  }
  for(const mutate of [
    l=>l.editionChecks.find(c=>c.id==='boundary-restarts-2026-27-review').sections=l.editionChecks.find(c=>c.id==='boundary-restarts-2026-27-review').sections.filter(s=>s!=='12.Rezumat'),
    l=>l.editionChecks.find(c=>c.id==='boundary-restarts-2026-27-review').sections.push('12.Capitol inventat')
  ]){const copy=structuredClone(library);mutate(copy);assert.throws(()=>validateLawLibrary(copy));}
});

test('New explanations propagate to exact duplicates and retain the simplified UI without changing the bank key',async()=>{
  for(const id of ids){
    const html=renderLawExplanation(library,q(id));
    assert.equal((html.match(/Ediția de referință:/gu)??[]).length,1);
    assert.ok(!/Pagina|Scanare:|PDF românesc|transcriere|href=/u.test(html));
    for(const other of bank.filter(other=>other.questionRo===q(id).questionRo&&other.options[other.correctOption]===q(id).options[q(id).correctOption]))assert.deepEqual(findLawReference(library,other),get(id));
  }
  assert.equal(q(298).correctOption,'A');
  const pending=await read('../laws/boundary-restarts-pending.json');
  assert.equal(pending.cases.length,17);
  const resolvedInRev20=new Set([745,748,767,780,781,785,786]);
  for(const row of pending.cases){
    if(resolvedInRev20.has(row.id))assert.ok(get(row.id).every(p=>p.editionCheck.id==='autonomous-expansion-2026-27-review'));
    else assert.equal(get(row.id),null);
    assert.equal(row.correctText,q(row.id).options[q(row.id).correctOption]);
  }
});
