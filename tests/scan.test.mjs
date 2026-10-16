import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateLawLibrary,findLawReference,preparePilotQuestions,renderLawExplanation} from '../dist/laws-ro.js';
const json=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const library=await json('../dist/laws-ro.json'), definitions=await json('../laws/references.json');
const catalog=await json('../laws/official-ro-2026-27.json'), bank=await json('../dist/questions.json');
const q=id=>bank.find(q=>q.id===id);

test('Scan transcriptions match the reviewed catalog and preserve the source hash',()=>{
  assert.equal(catalog.source.sha256,'661c83943ad4e57445696c0e73cf46c3a27ec067b1c806695ceffa29baa3cd3a');
  for(const item of catalog.excerpts){
    assert.deepEqual(library.excerpts.find(e=>e.id===item.id),item);
    assert.deepEqual(definitions.excerpts.find(e=>e.id===item.id),item);
    assert.equal(item.source.transcription,'manual-visual');
    assert.ok(!item.source.scanPages.includes(3)); // Clipped page 26 is not silently reconstructed.
    assert.ok(!item.source.scanPages.includes(10));
  }
  for(const id of ['sub-ten-seconds-2627','sub-one-minute-2627','accessories-2627'])
    assert.equal(library.excerpts.find(e=>e.id===id).source.translation,'official');
});

test('Countdown explanations justify the awarded restart and disciplinary condition, not generic delay',()=>{
  for(const id of [332,762,763]){
    const passages=findLawReference(library,q(id));
    assert.ok(passages.some(p=>p.id==='countdown-start-2627'&&p.highlights.some(t=>t.includes('va folosi fluierul'))));
    assert.ok(passages.some(p=>p.id==='countdown-goal-2627'&&p.highlights.some(t=>t.includes('va acorda o lovitură de la colț echipei adverse'))));
    assert.ok(passages.some(p=>p.id==='countdown-caution-16-2627'&&p.highlights.some(t=>t.includes('întârzie apoi excesiv'))));
  }
  for(const id of [333,334,738,739])assert.ok(findLawReference(library,q(id)).some(p=>
    p.id==='countdown-throw-2627'&&p.highlights.some(t=>t.includes('din aceeași poziție'))));
  const warning=findLawReference(library,q(13)).find(p=>p.id==='sub-time-conditions-2627');
  assert.ok(warning.highlights.some(t=>t.includes('doar avertizat (cartonaș galben) dacă întârzierea este excesivă')));
});

test('Treatment exceptions highlight the actual exception supporting each decision',()=>{
  const expected=[[83,'părăsește voluntar'],[90,'adversarul este avertizat sau eliminat'],[143,'jucătorul accidentat va fi executantul']];
  for(const [id,text] of expected){
    const passages=findLawReference(library,q(id));
    assert.ok(passages.some(p=>p.id==='treatment-exceptions-2627'&&p.highlights.some(t=>t.includes(text))));
    assert.ok(!renderLawExplanation(library,q(id)).includes('Art. Protocol'));
  }
  // These require separate analysis of the presumed/actual serious-injury condition.
  for(const id of [84,85,170])assert.equal(findLawReference(library,q(id)),null);
});

test('Scan metadata cannot masquerade as an integral law article, different PDF, or own translation',()=>{
  for(const change of [
    e=>e.source.sha256='0'.repeat(64),e=>e.source.file='other.pdf',e=>e.source.translation='own-ro',
    e=>e.source.scanPages=[0],e=>e.source.scanPages=[11],e=>e.source.scanPages=[1,1],
    e=>e.source.section='complete-law',e=>e.article='3.3',e=>e.page=null
  ]){const copy=structuredClone(library),e=copy.excerpts.find(e=>e.source.kind==='official-ro-scan');change(e);assert.throws(()=>validateLawLibrary(copy));}
});

test('Current-edition pilot retains all new references after option shuffling',()=>{
  const pilot=preparePilotQuestions(library,bank,()=>.73,'2026/27');
  assert.equal(pilot.length,541);
  for(const q of pilot)assert.ok(findLawReference(library,q)?.length);
  assert.deepEqual(findLawReference(library,q(332)),findLawReference(library,q(762)));
  assert.deepEqual(findLawReference(library,q(333)),findLawReference(library,q(738)));
});
