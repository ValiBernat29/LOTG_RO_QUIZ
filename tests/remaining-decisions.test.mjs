import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findLawReference,renderLawExplanation,validateLawLibrary} from '../dist/laws-ro.js';
import {prepareQuestions} from '../dist/quiz.js';
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const bank=await read('../dist/questions.json'),library=await read('../dist/laws-ro.json');
const manifest=await read('../laws/rechecks-rev22.json');
const q=id=>bank.find(x=>x.id===id),get=id=>findLawReference(library,q(id));

test('Rev22 associates thirteen decisions with literal official Romanian, including duplicates',()=>{
  assert.equal(manifest.rows.length,13);
  assert.equal(new Set(manifest.rows.map(x=>x.id)).size,13);
  assert.equal(validateLawLibrary(library),library);
  for(const row of manifest.rows){
    assert.equal(q(row.id).questionRo,row.questionRo);
    assert.equal(q(row.id).options[q(row.id).correctOption],row.correctText);
    assert.deepEqual(library.references.find(x=>x.seedId===row.id).passages,row.passages);
    const passages=get(row.id);
    assert.ok(passages.every(p=>p.reviewedEdition==='2026/27'&&p.source.translation==='official'));
    assert.deepEqual(findLawReference(library,prepareQuestions([q(row.id)],1,()=>.38)[0]),passages);
    for(const p of passages)for(const h of p.highlights)assert.equal(p.text.split(h).length,2);
    for(const duplicate of bank.filter(x=>x.questionRo===row.questionRo&&x.options[x.correctOption]===row.correctText))assert.deepEqual(get(duplicate.id),passages);
  }
  assert.deepEqual(get(394),get(673));assert.deepEqual(get(202),get(599));assert.deepEqual(get(411),get(635));
});

test('Penalty text crosses two PDF pages and highlights a missed kick, not a generic verbal IFK',()=>{
  const passages=get(394),restart=passages.find(p=>p.id==='penalty-defender-offence-restart');
  assert.equal(restart.page,137);assert.equal(restart.endPage,138);
  assert.ok(restart.text.startsWith('• un coechipier al portarului comite o abatere:'));
  assert.deepEqual(restart.highlights,['• un coechipier al portarului comite o abatere:','• dacă mingea nu intră în poartă, se repetă lovitura.']);
  assert.ok(passages.some(p=>p.id==='verbal-distraction'));
  assert.ok(!passages.some(p=>p.id==='verbal-restart'));
  assert.ok(!/Pagina|Scanare:|PDF românesc|transcriere|href=/u.test(renderLawExplanation(library,q(394))));
  for(const endPage of [136,137,139,'138']){
    const copy=structuredClone(library);copy.excerpts.find(x=>x.id===restart.id).endPage=endPage;
    assert.throws(()=>validateLawLibrary(copy));
  }
});

test('Temporary dismissal and pre-restart holding distinguish participation, warning and YC',()=>{
  assert.deepEqual(get(107).map(p=>p.id),['temporary-dismissal-shootout']);
  const holding=get(585).find(p=>p.id==='holding-before-restart-guidance');
  assert.equal(holding.article,'Instrucțiuni practice');
  assert.ok(holding.highlights.some(h=>h.includes('să atenționeze')&&h.includes('să avertizeze')));
  assert.ok(holding.highlights.every(h=>!h.includes('după ce mingea este în joc')));
  assert.ok(get(585).some(p=>p.id==='restart-unchanged'));
  assert.ok(!get(585).some(p=>p.id==='penalty-award'));
  for(const row of manifest.wordingChanges){assert.deepEqual(q(row.id),row.after);assert.equal(row.before.correctOption,row.after.correctOption);}
  assert.ok(q(585).options.A.startsWith('Atenționare verbală;'));
  for(const id of [411,635])assert.ok(q(id).options[q(id).correctOption].includes('CG ori atenționare verbală'));
});

test('Handball sources cover SPA and DOGSO branches, not a mandatory YC for the attackers own SPA',()=>{
  assert.deepEqual(get(337).map(p=>p.id),['handball-spa','dogso-handball','dogso-nondeliberate-outside']);
  assert.ok(get(337).at(-1).highlights.some(h=>h.includes('în afara propriei suprafețe')));
  for(const id of [535,551])assert.ok(get(id).some(p=>p.id==='handball-definition'&&p.highlights.some(h=>h.includes('Nu orice atingere')&&h.includes('justificabilă'))));
  assert.ok(get(547).some(p=>p.id==='unsporting-disrespect'));
  assert.ok(!get(547).some(p=>p.id==='handball-spa'));
});

test('Offensive gestures, substitute violence and conditional elbow sanctions keep their distinct restarts',()=>{
  assert.deepEqual(get(531).map(p=>p.id),['abusive-red','restart-unchanged']);
  assert.deepEqual(get(202).map(p=>p.id),['violent-red','drop-other-stoppages']);
  for(const id of ['penalty-award','reckless-caution','violent-description','violent-red'])assert.ok(get(563).some(p=>p.id===id));
  for(const id of ['unknown-official','match-report'])assert.ok(get(445).some(p=>p.id===id));
  assert.deepEqual(get(459).map(p=>p.id),['player-dissent','restart-unchanged']);
  assert.equal(q(298).correctOption,'A');
});

test('Practical guidance checks must cover the exact law and chapter',()=>{
  for(const mutate of [
    check=>check.sections=check.sections.filter(x=>x!=='12.Instrucțiuni practice'),
    check=>check.sections=check.sections.map(x=>x==='12.Instrucțiuni practice'?'13.Instrucțiuni practice':x),
    check=>check.sections.push('12.Practice'),
    check=>check.laws=check.laws.filter(x=>x!==12)
  ]){
    const copy=structuredClone(library);mutate(copy.editionChecks.find(c=>c.id==='remaining-decisions-2026-27-review'));
    assert.throws(()=>validateLawLibrary(copy));
  }
});
