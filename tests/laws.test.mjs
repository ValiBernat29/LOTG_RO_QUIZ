import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createLawLoader, explainableQuestion, findLawReference, renderLawExplanation, validateLawLibrary, preparePilotQuestions} from '../dist/laws-ro.js';
import {prepareQuestions} from '../dist/quiz.js';

const bank = JSON.parse(await readFile(new URL('../dist/questions.json', import.meta.url), 'utf8'));
const library = JSON.parse(await readFile(new URL('../dist/laws-ro.json', import.meta.url), 'utf8'));
const q = id => bank.find(item => item.id === id);

test('The pilot includes every reviewed scenario once and every shuffled answer still has its reference', () => {
  const questions=preparePilotQuestions(library,bank,()=>.2);
  assert.equal(questions.length,19);
  const identities=items=>new Set(items.map(item=>JSON.stringify([item.questionRo,item.options[item.correctOption]])));
  assert.deepEqual(identities(questions),identities(bank.filter(item=>findLawReference(library,item))));
  assert.equal(identities(questions).size,questions.length);
  for(const question of questions)assert.ok(findLawReference(library,question));
  for(const id of [96,146,201])assert.ok(questions.some(item=>item.questionRo===q(id).questionRo));
  assert.deepEqual(preparePilotQuestions(library,[]),[]);
  assert.deepEqual(preparePilotQuestions({...library,references:[]},bank),[]);
});

test('Every reviewed source association resolves to a real question and literal source highlight', () => {
  assert.equal(validateLawLibrary(library), library);
  for(const reference of library.references) {
    const original = q(reference.seedId);
    assert.equal(reference.questionRo, original.questionRo);
    assert.equal(reference.correctText, original.options[original.correctOption]);
    const passages = findLawReference(library, original);
    assert.equal(passages.length, reference.excerpts.length);
    for(const item of passages)assert.ok(item.text.includes(item.highlight));
  }
});
test('References survive option shuffling and duplicate questions under different laws', () => {
  for(const id of [96,146,201,272]) {
    const source = q(id), shuffled = prepareQuestions([source],1,()=>.2)[0];
    assert.deepEqual(findLawReference(library,shuffled),findLawReference(library,source));
  }
  assert.deepEqual(findLawReference(library,q(201)),findLawReference(library,q(595)));
  assert.deepEqual(findLawReference(library,q(146)),findLawReference(library,q(619)));
  assert.deepEqual(findLawReference(library,q(96)),findLawReference(library,q(380)));
  assert.deepEqual(findLawReference(library,q(272)),findLawReference(library,q(440)));
});
test('Changing the question or correct decision invalidates a previously reviewed association', () => {
  const question=q(96);
  assert.equal(findLawReference(library,{...question,questionRo:'O altă situație?'}),null);
  assert.equal(findLawReference(library,{...question,options:{...question.options,[question.correctOption]:'Altă decizie.'}}),null);
});
test('Explanations are unavailable before verification and throughout an active exam', () => {
  const question=q(96), session={mode:'practice',questions:[question],index:0,answers:{}};
  assert.equal(explainableQuestion('quiz',session,null,question.id),null);
  session.answers[question.id]=question.correctOption;
  assert.equal(explainableQuestion('quiz',session,null,question.id),question);
  assert.equal(explainableQuestion('quiz',{...session,mode:'exam'},null,question.id),null);
  assert.equal(explainableQuestion('home',session,null,question.id),null);
  assert.equal(explainableQuestion('result',null,{questions:[question]},question.id),question);
});
test('Unreviewed questions show an explicit notice instead of an invented passage or IFAB link', () => {
  const question=bank.find(item=>!findLawReference(library,item));
  const html=renderLawExplanation(library,question);
  assert.ok(html.includes('Pasaj încă neasociat'));
  assert.ok(!html.includes('<blockquote>'));assert.ok(!html.includes('href='));
});
test('Excerpts are safely escaped and cite the real source article and page', () => {
  const html=renderLawExplanation(library,q(146));
  assert.ok(html.includes('Art. 12.4 · Pagina 124'));
  assert.ok(html.includes('Pagina 125'));assert.ok(html.includes('<mark>'));
  const changed=structuredClone(library), item=changed.excerpts.find(item=>item.id==='unknown-official');
  item.text='<script>alert(1)</script> '+item.text;
  const escaped=renderLawExplanation(changed,q(146));
  assert.ok(!escaped.includes('<script>'));assert.ok(escaped.includes('&lt;script&gt;'));
});
test('The source library is cached after success and can retry failed loads', async () => {
  let calls=0;
  const load=createLawLoader(async()=>{calls++;if(calls===1)throw new Error('offline');return {ok:true,json:async()=>library};});
  await assert.rejects(load(),/offline/);
  const [first,second]=await Promise.all([load(),load()]);
  assert.equal(first,library);assert.equal(second,library);assert.equal(calls,2);
  await load();assert.equal(calls,2);
  await assert.rejects(createLawLoader(async()=>({ok:false}))(),/unavailable/);
});
test('Broken article ids, highlights, editions and duplicate references fail validation', () => {
  for(const mutate of [
    value=>value.edition='2026/27',
    value=>value.references[0].excerpts=['missing'],
    value=>value.excerpts[0].highlight='not in the PDF',
    value=>value.references.push(value.references[0])
  ]) {const value=structuredClone(library);mutate(value);assert.throws(()=>validateLawLibrary(value));}
});
test('The buildless deploy contains no dependency on an absolute local PDF path', async () => {
  assert.ok(!JSON.stringify(library).includes('C:/Users/'));
  const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
  assert.ok(app.includes('data-explanation='));assert.ok(!app.includes('safeSource('));
});
