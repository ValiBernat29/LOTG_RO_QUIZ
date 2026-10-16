import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareQuestions, repairSavedSession, score} from '../dist/quiz.js';
import {findLawReference} from '../dist/laws-ro.js';
const json=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const bank=await json('../dist/questions.json'), library=await json('../dist/laws-ro.json');
const revisions=await json('../editorial/question-revisions.json'), options=await json('../editorial/answer-revisions.json');

test('Every context change is anchored to its English source and unchanged correct decision',()=>{
  assert.equal(new Set(revisions.rows.map(r=>r.id)).size,revisions.rows.length);
  for(const r of revisions.rows){
    const q=bank.find(q=>q.id===r.id);
    assert.equal(q.questionRo,r.afterQuestionRo);assert.equal(q.options[q.correctOption],r.correctText);
    assert.ok(r.sourceQuestion && r.sourceAnswer && r.reason);
    const duplicates=bank.filter(q=>q.questionRo===r.afterQuestionRo);
    assert.ok(duplicates.every(q=>q.options[q.correctOption]===r.correctText));
  }
});

test('Re-entry example names both teams, prior treatment, opponent shot and goal prevented',()=>{
  for(const id of [30,453,702]){
    const q=bank.find(q=>q.id===id);
    for(const text of ['echipei A','echipei B','îngrijiri','șutează pe lângă portarul','propria suprafață de pedeapsă','împiedicând-o să intre în poartă'])assert.ok(q.questionRo.includes(text));
    assert.ok(findLawReference(library,q)?.length);
  }
  const medical=bank.find(q=>q.id===121).questionRo;
  assert.ok(medical.includes('personalul medical stabilește că jucătorul nu mai trebuie să continue'));
  assert.ok(bank.find(q=>q.id===217).questionRo.includes('niciun jucător nu mai are șansa'));
  assert.ok(bank.find(q=>q.id===639).questionRo.includes('fără să fi fost atinsă de alt jucător'));
});

test('Saved shuffled questions receive the fuller stem without resetting scores or timing',()=>{
  for(const r of revisions.rows)for(const random of [()=>.12,()=>.82]){
    const source=bank.find(q=>q.id===r.id), oldOptions=options.rows.find(o=>o.id===r.id)?.before;
    for(const originalOptions of [source.options,...(oldOptions?[oldOptions]:[])]){
      const [q]=prepareQuestions([{...source,questionRo:r.beforeQuestionRo,options:originalOptions}],1,random);
      for(const choice of ['A','B','C','D']){
        const session={mode:'exam',questions:[q],answers:{[q.id]:choice},index:0,startedAt:100,deadline:1800100};
        const untouched=structuredClone(session), repaired=repairSavedSession(session);
        assert.deepEqual(session,untouched);assert.equal(repaired.questions[0].questionRo,r.afterQuestionRo);
        assert.deepEqual(score(repaired),score(session));
        assert.deepEqual({...repaired,questions:[]},{...session,questions:[]});
        assert.equal(repaired.questions[0].correctOption,q.correctOption);
        assert.deepEqual(repairSavedSession(repaired),repaired);
      }
    }
  }
});

test('Unknown or semantically different saved questions do not receive guessed context',()=>{
  const r=revisions.rows[0],q=bank.find(q=>q.id===r.id);
  for(const question of [{...q,questionRo:'O altă întrebare?'},{...q,questionRo:r.beforeQuestionRo,options:{...q.options,[q.correctOption]:'O altă decizie.'}}]){
    const session={mode:'practice',questions:[question],answers:{},index:0,startedAt:100};
    assert.deepEqual(repairSavedSession(session),session);
  }
});
