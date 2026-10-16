import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findLawReference,renderLawExplanation,validateLawLibrary} from '../dist/laws-ro.js';
import {prepareQuestions} from '../dist/quiz.js';
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const library=await read('../dist/laws-ro.json'),bank=await read('../dist/questions.json');
const ids=[152,153,154,156,157,159,637,638,641,645,650,652];
const q=id=>bank.find(q=>q.id===id),get=id=>findLawReference(library,q(id));

test('All twelve compound decisions use official Romanian, current-edition checks and stable shuffled references',()=>{
  for(const id of ids){
    const passages=get(id);
    assert.ok(passages.length);
    assert.ok(passages.every(p=>p.source.translation==='official'&&p.reviewedEdition==='2026/27'&&p.editionCheck));
    assert.deepEqual(findLawReference(library,prepareQuestions([q(id)],1,()=>.83)[0]),passages);
    for(const p of passages)for(const quote of p.highlights)assert.ok(p.text.includes(quote));
  }
  assert.equal(validateLawLibrary(library),library);
});

test('Keeper back-pass handling has an IFK, goal-area placement and no-card rule, not a DOGSO dismissal',()=>{
  const passages=get(641);
  for(const id of ['keeper-backpass-ifk','attacking-ifk-goal-area','keeper-illegal-handling-no-card'])assert.ok(passages.some(p=>p.id===id));
  assert.ok(passages.some(p=>p.highlights.some(h=>h.includes('nu se aplică nicio sancțiune disciplinară'))));
  assert.ok(!passages.some(p=>p.id==='red-dogso-free-kick'||p.id==='free-second-touch'));
});

test('An attack on a keeper controlling the ball has its own DFK, defending goal-area placement and severity evidence',()=>{
  const passages=get(650);
  for(const id of ['keeper-hand-control','keeper-cannot-be-challenged','direct-free-kick','defending-free-kick-goal-area','challenge-severity'])assert.ok(passages.some(p=>p.id===id));
  assert.ok(!passages.some(p=>p.id==='keeper-backpass-ifk'||p.id==='attacking-ifk-goal-area'));
  const intensity=passages.find(p=>p.id==='challenge-severity');
  assert.ok(intensity.text.includes('Nu este necesară aplicarea unei sancțiuni disciplinare'));
  assert.ok(intensity.text.includes('Se sancționează cu avertisment'));
  assert.ok(intensity.text.includes('Se sancționează cu eliminare'));
  assert.ok(!passages.some(p=>p.highlights.some(h=>h.includes('mai mult de opt secunde'))));
});

test('Dissent and kicking the ball away after stoppage do not replace the originally awarded restart',()=>{
  for(const id of [153,652]){
    assert.ok(get(id).some(p=>p.id==='player-dissent'));
    assert.ok(get(id).some(p=>p.id==='restart-unchanged'));
  }
  assert.ok(get(652).some(p=>p.id==='second-caution-red'));
  assert.ok(get(652).some(p=>p.id==='direct-free-kick'));
  assert.ok(get(153).some(p=>p.id==='throw-in-restart'));
  assert.ok(get(637).some(p=>p.id==='kick-ball-away-caution'));
  assert.ok(get(637).some(p=>p.id==='free-kick-position'));
  assert.ok(get(638).some(p=>p.id==='red-dogso-free-kick'));
  assert.ok(get(645).some(p=>p.id==='violent-red'));
  assert.ok(get(645).some(p=>p.id==='off-field-opponent-official-restart'&&p.highlights.some(h=>h.includes('oficial al echipei adverse'))));
});

test('Reserve assistance and competition-defined replacement use only the applicable Law 6 sections',()=>{
  assert.ok(get(152).some(p=>p.id==='reserve-assistant-help'&&p.highlights.some(h=>h.includes('poate asista arbitrul'))));
  const replacement=get(154)[0];
  assert.equal(replacement.article,'Introducere');
  assert.ok(replacement.editionCheck.sections.includes('6.Introducere'));
  assert.ok(replacement.text.includes('Regulamentul competiției'));
  for(const mutate of [
    l=>l.editionChecks.find(c=>c.id==='officials-2026-27-review').sections[0]='5.Introducere',
    l=>l.editionChecks.find(c=>c.id==='officials-2026-27-review').sections[0]='6.Instrucțiuni inventate',
    l=>l.editionChecks.find(c=>c.id==='officials-2026-27-review').sections[0]='Introducere'
  ]){const copy=structuredClone(library);mutate(copy);assert.throws(()=>validateLawLibrary(copy));}
});

test('Duration highlights address celebration time, permission to change the interval, and no kick-off after an extended penalty',()=>{
  const time=get(156).find(p=>p.id==='allowance-time-lost');
  assert.ok(time.highlights.includes('• manifestările de bucurie la marcarea unui gol.'));
  assert.ok(!time.highlights.some(h=>h.includes('jucătorilor accidentați')));
  assert.ok(get(157).some(p=>p.id==='half-time-interval'&&p.highlights.some(h=>h.includes('numai cu permisiunea arbitrului'))));
  assert.ok(get(159).some(p=>p.id==='extended-half-penalty'));
  assert.ok(get(159).some(p=>p.id==='goal-scored'));
  assert.ok(!get(159).some(p=>p.id==='kickoff-after-goal'));
});

test('Resolved cases leave the pending list, nuanced cases stay pending, and every new modal remains simple',async()=>{
  const pending=await read('../laws/free-kicks-pending.json');
  assert.equal(pending.resolvedCases.length,7);assert.equal(pending.cases.length,7);
  for(const row of pending.resolvedCases)assert.ok(get(row.id));
  for(const row of pending.cases)assert.equal(get(row.id),null);
  for(const id of [631,632,640,654,148,149,150,158])assert.equal(get(id),null);
  const reviews=await read('../editorial/rule-reviews.json');
  for(const id of ids){
    assert.ok(reviews.reviews.some(r=>r.id===id&&r.correctText===q(id).options[q(id).correctOption]));
    const html=renderLawExplanation(library,q(id));
    assert.equal((html.match(/Ediția de referință:/gu)??[]).length,1);
    assert.ok(!/Pagina|Scanare:|PDF românesc|transcriere|href=/u.test(html));
    for(const duplicate of bank.filter(other=>other.questionRo===q(id).questionRo&&other.options[other.correctOption]===q(id).options[q(id).correctOption]))assert.deepEqual(findLawReference(library,duplicate),get(id));
  }
  assert.equal(q(298).correctOption,'A');
});
