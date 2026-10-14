import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prepareQuestions, score, safeSource, validSession, uniqueQuestions } from '../dist/quiz.js';
const bank=JSON.parse(await readFile(new URL('../dist/questions.json',import.meta.url),'utf8'));
test('Every shuffled answer key still identifies the original correct decision',()=>{
  const prepared=prepareQuestions(bank,bank.length,()=>.13);
  const original=new Map(bank.map(q=>[q.id,q]));
  for(const q of prepared){const source=original.get(q.id);assert.equal(q.options[q.correctOption],source.options[source.correctOption]);assert.deepEqual(Object.values(q.options).sort(),Object.values(source.options).sort());}
  assert.equal(bank.length,788);
});
test('Law filtering precedes deduplication and small pools do not inflate the test',()=>{
  const onlyBall=bank.filter(q=>q.lawNumber===2);
  const prepared=prepareQuestions(onlyBall,20);
  assert.equal(prepared.length,2);assert.ok(prepared.every(q=>q.lawNumber===2));
  const repeated=[bank[0],{...bank[0],id:99999}];assert.equal(uniqueQuestions(repeated).length,1);
});
test('Unanswered questions count towards the total but not as answered or correct',()=>{
  const questions=prepareQuestions(bank,3);
  const session={mode:'practice',questions,answers:{[questions[0].id]:questions[0].correctOption},index:0,startedAt:Date.now()};
  assert.deepEqual(score(session),{correct:1,answered:1,total:3,percent:33});assert.ok(validSession(session));
  assert.equal(validSession({...session,index:3}),false);assert.equal(validSession({...session,mode:'exam',deadline:null}),false);
});
test('External references allow only official HTTPS IFAB URLs',()=>{
  assert.equal(safeSource('javascript:alert(1)'),null);assert.equal(safeSource('https://www.theifab.com.example.com/'),null);
  assert.equal(safeSource(bank[0].sourceUrl),bank[0].sourceUrl);
});
