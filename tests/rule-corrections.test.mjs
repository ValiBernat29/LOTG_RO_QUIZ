import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {repairSavedSession,score} from '../dist/quiz.js';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const bank=await read('../dist/questions.json'), editorial=await read('../editorial/answer-revisions.json');
const corrections=await read('../editorial/rule-corrections.json');
const permutations=a=>a.length?a.flatMap((v,i)=>permutations(a.filter((_,j)=>j!==i)).map(t=>[v,...t])):[[]];
test('Semantic corrections preserve selections but evaluate every shuffled letter against the new decision',()=>{
  for(const r of corrections.rows){
    const q=bank.find(q=>q.id===r.id);
    assert.equal(q.correctOption,r.after.correctOption);assert.deepEqual(q.options,r.after.options);
    const oldEditorial=editorial.rows.find(e=>e.id===r.id);
    for(const options of [r.before.options,oldEditorial.before])for(const order of permutations(['A','B','C','D'])){
      const old={...q,options:Object.fromEntries(order.map((src,i)=>['ABCD'[i],options[src]])),correctOption:'ABCD'[order.indexOf(r.before.correctOption)],correctText:options[r.before.correctOption]};
      for(const answer of ['A','B','C','D']){
        const saved={mode:'exam',questions:[old],index:0,answers:{[q.id]:answer},flags:[q.id],startedAt:100,deadline:1800100};
        const untouched=structuredClone(saved),fixed=repairSavedSession(saved),actual=fixed.questions[0];
        assert.deepEqual(saved,untouched);assert.deepEqual({...fixed,questions:[]},{...saved,questions:[]});
        assert.equal(actual.correctOption,'ABCD'[order.indexOf(r.after.correctOption)]);
        assert.equal(actual.correctText,r.after.options[r.after.correctOption]);
        assert.deepEqual(Object.values(actual.options).sort(),Object.values(r.after.options).sort());
        assert.equal(score(fixed).correct,answer===actual.correctOption?1:0);
        assert.deepEqual(repairSavedSession(fixed),fixed);
        assert.equal(actual.ruleCorrection.revisionId,r.revisionId);
      }
    }
  }
});
test('New sessions, historical summaries and unknown question versions are not guessed or erased',()=>{
  const r=corrections.rows[0],q=bank.find(q=>q.id===r.id);
  for(const question of [q,{...q,questionRo:'Altă versiune a întrebării?'},{...q,options:{...q.options,[q.correctOption]:'O altă decizie.'}}]){
    const session={mode:'practice',questions:[question],index:0,answers:{},startedAt:100};assert.deepEqual(repairSavedSession(session),session);
  }
  const history=[{total:20,correct:17,finishedAt:100,mode:'exam'}];assert.equal(repairSavedSession(history),history);
});
test('A goal does not erase an independent reckless or serious-foul sanction, nor a DOGSO caution without a goal',()=>{
  for(const id of [343,576,593,668,708,710])assert.ok(!corrections.rows.some(r=>r.id===id));
  assert.ok(bank.find(q=>q.id===576).options[bank.find(q=>q.id===576).correctOption].includes('CR'));
  assert.ok(bank.find(q=>q.id===343).options[bank.find(q=>q.id===343).correctOption].includes('CG'));
});

test('The rule audit distinguishes confirmed corrections, retained decisions, and pending thematic warnings',async()=>{
  const report=await read('../laws/rule-change-review.json');
  assert.equal(report.totalRecords,788);
  assert.ok(report.corrected.some(r=>r.ids.includes(298)));
  assert.ok(report.checked.some(r=>r.ids.includes(576)));
  assert.ok(report.checked.some(r=>r.ids.includes(343)));
  assert.ok(report.pending.length>0);
  assert.ok(report.pending.every(r=>r.status==='manual-review'&&r.reason.includes('nu eroare confirmată')));
  const ids=report.corrected.concat(report.checked,report.pending).flatMap(r=>r.ids);
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(!report.pending.some(r=>r.ids.includes(298)));
});
