import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findLawReference,renderLawExplanation,validateLawLibrary} from '../dist/laws-ro.js';
import {prepareQuestions} from '../dist/quiz.js';
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const library=await read('../dist/laws-ro.json'),bank=await read('../dist/questions.json');
const manifest=await read('../laws/expansion-rev20.json');
const q=id=>bank.find(q=>q.id===id),get=id=>findLawReference(library,q(id));

test('Rev20 records 295 individual new mappings and three explicit legacy rechecks',()=>{
  assert.equal(manifest.rows.length,295);
  assert.equal(new Set(manifest.rows.map(r=>r.id)).size,295);
  assert.deepEqual(manifest.upgradedLegacyIds,[44,217,218]);
  assert.equal(library.references.filter(r=>r.editionCheckId==='autonomous-expansion-2026-27-review').length,298);
  for(const row of manifest.rows){
    const question=q(row.id),reference=library.references.find(r=>r.seedId===row.id);
    assert.equal(row.questionRo,question.questionRo);
    assert.equal(row.correctText,question.options[question.correctOption]);
    assert.deepEqual(reference.passages,row.passages);
    assert.ok(row.note.trim());
    const passages=get(row.id);
    assert.ok(passages.every(p=>p.reviewedEdition==='2026/27'&&p.source.translation==='official'));
    assert.deepEqual(findLawReference(library,prepareQuestions([question],1,()=>.47)[0]),passages);
  }
  assert.equal(validateLawLibrary(library),library);
});

test('Rev20 source matching propagates by exact decision, not duplicate ID or shuffled answer letter',()=>{
  const newKeys=new Set(manifest.rows.map(r=>JSON.stringify([r.questionRo,r.correctText])));
  for(const question of bank){
    if(!newKeys.has(JSON.stringify([question.questionRo,question.options[question.correctOption]])))continue;
    assert.ok(get(question.id)?.length);
    assert.deepEqual(findLawReference(library,prepareQuestions([question],1,()=>.81)[0]),get(question.id));
    assert.equal(findLawReference(library,{...question,questionRo:question.questionRo+' Alt context.'}),null);
  }
});

test('Attempted violence selects attempted strikes, not a contact-only justification',()=>{
  for(const id of [606,617]){
    const passages=get(id),direct=passages.find(p=>p.id==='direct-free-kick');
    assert.ok(direct.highlights.some(h=>h.includes('încearcă să lovească')));
    assert.ok(!direct.highlights.some(h=>h.includes('În caz de contact fizic')));
    assert.ok(passages.some(p=>p.id==='violent-description'&&p.highlights.some(h=>h.includes('indiferent dacă a avut loc sau nu un contact'))));
    assert.ok(passages.some(p=>p.id==='violent-red'));
  }
});

test('Thrown match balls and substitute objects use the corresponding actor and offence',()=>{
  assert.ok(get(613).some(p=>p.id==='direct-free-kick'));
  assert.ok(!get(613).some(p=>p.id==='object-thrown'));
  for(const id of [587,608])assert.ok(get(id).some(p=>p.id==='object-substitute'));
  assert.ok(get(587).some(p=>p.id==='substitute-cautions'));
  assert.ok(get(587).some(p=>p.id==='spa-caution'));
});

test('Cancelled celebrations and permitted goalkeeper handling select the actual disciplinary exception',()=>{
  const celebration=get(607).find(p=>p.id==='celebration-cautions');
  assert.equal(celebration.highlights.length,2);
  assert.ok(celebration.highlights.some(h=>h.includes('chiar dacă golul este anulat')));
  assert.ok(celebration.highlights.some(h=>h.includes('își scoate tricoul')));
  const keeper=get(193);
  assert.ok(keeper.some(p=>p.id==='dfk-other-offences'&&p.highlights.some(h=>h.includes('cu excepția portarului'))));
  assert.ok(!keeper.some(p=>p.id==='keeper-outside-area'));
});

test('The half-time goalkeeper exception and clearly leaving ball are expressly rechecked',()=>{
  const swap=get(44);
  assert.ok(swap.some(p=>p.id==='unnotified-swap'&&p.justifies.includes('fără CG')));
  assert.ok(swap.some(p=>p.id==='match-report'));
  for(const id of [217,218]){
    const p=get(id)[0];
    assert.equal(p.reviewedEdition,'2026/27');
    assert.ok(p.highlights.some(h=>h.includes('urmează să părăsească în mod clar')&&h.includes('nicio sancțiune disciplinară')));
  }
  assert.equal(q(298).correctOption,'A');
});

test('Protocol checks must be explicitly scoped and cannot cover another law or omitted chapter',()=>{
  for(const mutate of [
    c=>c.sections=c.sections.filter(s=>s!=='5.Protocol'),
    c=>c.sections=c.sections.map(s=>s==='5.Protocol'?'6.Protocol':s),
    c=>c.sections.push('5.Arbitrary'),
    c=>c.laws=c.laws.filter(l=>l!==5)
  ]){
    const changed=structuredClone(library);
    mutate(changed.editionChecks.find(c=>c.id==='autonomous-expansion-2026-27-review'));
    assert.throws(()=>validateLawLibrary(changed));
  }
});

test('Pending restart advantage and VAR changes are not certified with a generic old rule',()=>{
  for(const id of [72,73,74,75,76,77,84,85,91,92,93,170,627,631,662,684,769,775,784])assert.equal(get(id),null);
  for(const id of [45,50])assert.equal(get(id)[0].reviewedEdition,'2025/26');
  for(const id of [460,575]){
    const html=renderLawExplanation(library,q(id));
    assert.ok(html.includes('<mark>'));
    assert.ok(!/Pagina|Scanare:|PDF românesc|transcriere|href=/u.test(html));
  }
});

test('Every remaining scenario has an explicit editorial reason and is not certified as current',async()=>{
  const pending=await read('../laws/pending-rev20.json'),queue=await read('../laws/review-queue.json');
  const resolved=new Set([
    ...(await read('../laws/rechecks-rev21.json')).rows,
    ...(await read('../laws/rechecks-rev22.json')).rows
  ].map(r=>r.id));
  assert.equal(pending.complete,false);
  assert.equal(pending.cases.length,70);
  assert.deepEqual(pending.cases.filter(c=>!c.ids.some(id=>resolved.has(id))).map(c=>c.ids),queue.map(c=>c.ids));
  for(const row of pending.cases){
    assert.ok(row.category&&row.reason.trim());
    if(row.ids.some(id=>resolved.has(id)))continue;
    for(const id of row.ids){
      assert.equal(row.questionRo,q(id).questionRo);
      assert.equal(row.correctText,q(id).options[q(id).correctOption]);
      assert.ok(!get(id)||get(id)[0].reviewedEdition!=='2026/27');
    }
  }
});

test('Rev21 repairs wording without changing answer keys and associates all three corrected scenarios',async()=>{
  const snapshot=await read('../laws/rechecks-rev21.json');
  assert.deepEqual(snapshot.rows.map(r=>r.id),[241,463,592]);
  for(const row of snapshot.rows){
    assert.deepEqual(q(row.id),row.after);
    assert.equal(row.before.correctOption,row.after.correctOption);
    assert.equal(q(row.id).id,row.before.id);
    const reference=library.references.find(r=>r.seedId===row.id);
    assert.equal(reference.editionCheckId,'remaining-wording-2026-27-review');
    assert.deepEqual(reference.passages,row.passages);
    assert.deepEqual(findLawReference(library,prepareQuestions([q(row.id)],1,()=>.26)[0]),get(row.id));
  }
  assert.ok(!JSON.stringify(q(241)).includes('disponibilă.'));
  assert.ok(!JSON.stringify(q(463)).includes('mânaui'));
  assert.ok(!JSON.stringify(q(592)).includes('suprafețe de pedeapsă tehnice'));
  assert.ok(get(241).some(p=>p.id==='shootout-injured-goalkeeper'));
  assert.ok(get(463).some(p=>p.id==='handball-definition'&&p.highlights.some(h=>h.includes('nenatural'))));
  assert.ok(!get(463).some(p=>p.id==='handball-scoring-caution'));
  assert.ok(get(592).some(p=>p.id==='official-yellow'&&p.highlights.some(h=>h.includes('clară/constantă'))));
});
