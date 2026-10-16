import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareQuestions, repairSavedSession, score} from '../dist/quiz.js';
import {answerBalance} from '../tools/answer-balance.mjs';
const revisions=JSON.parse(await readFile(new URL('../editorial/answer-revisions.json',import.meta.url),'utf8'));
const bank=JSON.parse(await readFile(new URL('../dist/questions.json',import.meta.url),'utf8'));

test('Editorial changes keep IDs, answer letters, and four distinct choices',()=>{
  assert.equal(new Set(revisions.rows.map(r=>r.id)).size,revisions.rows.length);
  for(const r of revisions.rows){
    const q=bank.find(q=>q.id===r.id);
    assert.equal(q.questionRo,r.currentQuestionRo ?? r.questionRo);assert.equal(q.correctOption,r.currentCorrectOption ?? r.correctOption);
    assert.deepEqual(q.options,r.currentOptions ?? r.after);assert.equal(new Set(Object.values(q.options)).size,4);
  }
  const original=bank.map(q=>({...q,options:revisions.rows.find(r=>r.id===q.id)?.before??q.options}));
  assert.equal(answerBalance(bank).scenarios,answerBalance(original).scenarios);
  assert.ok(answerBalance(bank).uniqueLongest<answerBalance(original).uniqueLongest);
  assert.equal(answerBalance(bank).overTwiceWrongMean,0);
});

test('Saved shuffled sessions migrate by text, keeping selections, deadlines and scores',()=>{
  for(const r of revisions.rows)for(const random of [()=>0,()=>.4,()=>.99]){
    if(r.currentCorrectOption)continue; // Semantic changes are verified separately, including rescoring.
    const source=bank.find(q=>q.id===r.id);
    const [question]=prepareQuestions([{...source,options:r.before}],1,random);
    for(const choice of ['A','B','C','D']){
      const session={mode:'exam',questions:[question],answers:{[r.id]:choice},index:0,startedAt:100,deadline:1800100};
      const untouched=structuredClone(session), repaired=repairSavedSession(session), q=repaired.questions[0];
      assert.deepEqual(session,untouched);
      assert.deepEqual(score(repaired),score(session));
      assert.equal(q.correctOption,question.correctOption);assert.equal(q.correctText,r.after[r.correctOption]);
      for(const letter of ['A','B','C','D']){
        const originalLetter=Object.keys(r.before).find(k=>r.before[k]===question.options[letter]);
        assert.equal(q.options[letter],r.after[originalLetter]);
      }
      assert.deepEqual({...repaired,questions:[]},{...session,questions:[]});
      assert.deepEqual(repairSavedSession(repaired),repaired);
    }
  }
});

test('Unknown saved wording is not partially rewritten',()=>{
  const r=revisions.rows[0], source=bank.find(q=>q.id===r.id);
  const q={...source,options:{...r.before}};
  q.options[Object.keys(q.options).find(k=>k!==q.correctOption)]='Formulare necunoscută.';
  const session={mode:'practice',questions:[q],answers:{},index:0,startedAt:100};
  assert.deepEqual(repairSavedSession(session),session);
});
