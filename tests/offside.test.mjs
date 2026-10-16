import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findLawReference,renderLawExplanation,validateLawLibrary} from '../dist/laws-ro.js';
import {prepareQuestions} from '../dist/quiz.js';
import {auditLawCoverage} from '../tools/law-audit.mjs';
const json=async file=>JSON.parse(await readFile(new URL(file,import.meta.url),'utf8'));
const library=await json('../dist/laws-ro.json'),bank=await json('../dist/questions.json'),definitions=await json('../laws/references.json');
const q=id=>bank.find(q=>q.id===id),get=id=>findLawReference(library,q(id));

test('All 57 new offside associations retain official Romanian text and a separate current-edition check',()=>{
  const refs=library.references.filter(r=>r.editionCheckId==='offside-2026-27-review');
  assert.equal(refs.length,57);
  for(const r of refs){
    const passages=get(r.seedId);
    assert.ok(passages.every(p=>p.source.translation==='official'&&p.source.edition==='2025/26'&&p.reviewedEdition==='2026/27'));
    assert.ok(passages.every(p=>p.editionCheck?.laws.includes(11)));
    assert.deepEqual(findLawReference(library,prepareQuestions([q(r.seedId)],1,()=>.73)[0]),passages);
    assert.ok(!renderLawExplanation(library,q(r.seedId)).includes('traducere proprie'));
  }
});

test('Saves, deflections, deliberate play and unsuccessful deliberate play receive distinct relevant highlights',()=>{
  for(const id of [267,306,328])assert.ok(get(id).some(p=>p.id==='offside-rebound'&&p.highlights.some(t=>t.includes('respinsă în mod deliberat'))));
  for(const id of [303,308,323])assert.ok(get(id).some(p=>p.id==='offside-rebound'&&p.highlights.some(t=>t.includes('ricoșat sau a deviat'))));
  for(const id of [273,274])assert.ok(get(id).some(p=>p.id==='offside-control-indicators'&&p.highlights.some(t=>t.includes('control limitat'))));
  for(const id of [275,276])assert.ok(get(id).some(p=>p.id==='offside-control'&&p.highlights.some(t=>t.includes('imprecisă sau nereușită'))));
  assert.ok(get(312).some(p=>p.id==='offside-save'));
  assert.ok(get(312).some(p=>p.id==='offside-deliberate'));
  assert.ok(!get(312).some(p=>p.id==='offside-ifk'));
});

test('Direct restart exceptions are not incorrectly reused for a subsequent pass or free kick',()=>{
  const direct=get(318).find(p=>p.id==='offside-direct-restarts');
  assert.ok(direct.highlights.includes('• dintr-o aruncare de la margine.'));
  assert.ok(get(300).some(p=>p.highlights.includes('• dintr-o lovitură de colț.')));
  assert.ok(get(309).some(p=>p.highlights.includes('• dintr-o lovitură de poartă.')));
  for(const id of [265,285,302]){
    assert.ok(get(id).some(p=>p.id==='offside-active'));
    assert.ok(get(id).some(p=>p.id==='offside-ifk'));
    assert.ok(!get(id).some(p=>p.id==='offside-direct-restarts'));
  }
});

test('Offside restart, timing, blocked vision and opponent interference are independently justified',()=>{
  assert.ok(get(257).some(p=>p.highlights.some(t=>t.includes('ultimul punct de contact'))));
  for(const id of [266,299])assert.ok(get(id).some(p=>p.id==='offside-ifk'&&p.highlights.some(t=>t.includes('propria jumătate'))));
  assert.ok(get(324).some(p=>p.highlights.some(t=>t.includes('obstrucţionarea clară a câmpului vizual'))));
  assert.ok(get(264).some(p=>p.id==='offside-impact'));
  assert.ok(get(322).some(p=>p.id==='offside-sequence'&&p.highlights.some(t=>t.includes('înainte de a se comite faultul'))));
  assert.ok(get(326).some(p=>p.highlights.some(t=>t.includes('linia mediană')&&t.includes('în afara suprafeței sale de pedeapsă'))));
});

test('Reverification does not rewrite the PDF edition or permit unknown checks or unrelated laws',()=>{
  const html=renderLawExplanation(library,q(257));
  assert.ok(html.includes('Ediția de referință: 2026/27'));
  assert.ok(get(257).every(p=>p.source.edition==='2025/26'));
  assert.ok(!html.includes('Verificare IFAB'));
  assert.ok(!html.includes('Compatibilitatea acestei asocieri cu ediția 2026/27 nu a fost încă reverificată'));
  for(const mutate of [
    l=>l.editionChecks[0].url='javascript:alert(1)',
    l=>l.editionChecks[0].edition='2027/28',
    l=>l.editionChecks[0].laws=[12],
    l=>l.references.find(r=>r.editionCheckId).editionCheckId='missing',
    l=>l.editionChecks.push(l.editionChecks[0])
  ]){const copy=structuredClone(library);mutate(copy);assert.throws(()=>validateLawLibrary(copy));}
});

test('The outdated caution answer is resolved with independent offside and disciplinary justifications',()=>{
  assert.equal(q(298).correctOption,'A');
  assert.ok(get(298).some(p=>p.id==='offside-deliberate'));
  assert.ok(get(298).some(p=>p.id==='dogso-advantage-goal-summary-2627'));
  const {queue}=auditLawCoverage(bank,library,definitions);
  assert.ok(!queue.some(g=>g.ids.includes(298)));
  assert.ok(definitions.resolvedIssues.some(r=>r.id===298&&r.revisionId==='dogso-advantage-goal-298'));
});
