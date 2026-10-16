import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createLawLoader, explainableQuestion, findLawReference, renderLawExplanation, validateLawLibrary, preparePilotQuestions} from '../dist/laws-ro.js';
import {prepareQuestions} from '../dist/quiz.js';
import {auditLawCoverage} from '../tools/law-audit.mjs';

const bank = JSON.parse(await readFile(new URL('../dist/questions.json', import.meta.url), 'utf8'));
const library = JSON.parse(await readFile(new URL('../dist/laws-ro.json', import.meta.url), 'utf8'));
const q = id => bank.find(item => item.id === id);
const definitions=JSON.parse(await readFile(new URL('../laws/references.json',import.meta.url),'utf8'));

test('The pilot includes every reviewed scenario once and every shuffled answer still has its reference', () => {
  const questions=preparePilotQuestions(library,bank,()=>.2);
  assert.equal(questions.length,library.references.length);
  const identities=items=>new Set(items.map(item=>JSON.stringify([item.questionRo,item.options[item.correctOption]])));
  assert.deepEqual(identities(questions),identities(bank.filter(item=>findLawReference(library,item))));
  assert.equal(identities(questions).size,questions.length);
  for(const question of questions)assert.ok(findLawReference(library,question));
  for(const id of [96,146,201])assert.ok(questions.some(item=>item.questionRo===q(id).questionRo));
  assert.deepEqual(preparePilotQuestions(library,[]),[]);
  assert.deepEqual(preparePilotQuestions({...library,references:[]},bank),[]);
});
test('The current-edition test contains precisely the five newly verified scenarios without duplicates',()=>{
  const questions=preparePilotQuestions(library,bank,()=>.2,'2026/27');
  assert.equal(questions.length,5);
  for(const id of [3,12,13,60,61])assert.ok(questions.some(item=>item.questionRo===q(id).questionRo));
  for(const item of questions)assert.ok(findLawReference(library,item).every(p=>p.reviewedEdition==='2026/27'));
});
test('Own translations and official PDF text retain distinct editions and provenance in the modal',()=>{
  for(const id of [3,12,13,60,61]) {
    const html=renderLawExplanation(library,q(id));
    assert.ok(html.includes('2026/27'));assert.ok(html.includes('traducere proprie din engleză, nu traducere oficială'));
    assert.ok(!html.includes('Pagina undefined'));assert.ok(!html.includes('Pagina null'));
    assert.ok(!html.includes('Compatibilitatea acestei asocieri'));
    assert.ok(html.includes('https://www.theifab.com/'));
  }
  const legacy=renderLawExplanation(library,q(221));
  assert.ok(legacy.includes('PDF românesc 2025/26 · text oficial'));
  assert.ok(legacy.includes('Compatibilitatea acestei asocieri cu ediția 2026/27 nu a fost încă reverificată'));
  const report=auditLawCoverage(bank,library,definitions).summary;
  assert.equal(report.verifiedScenarios,5);assert.equal(report.legacyScenarios,72);
  assert.equal(report.needsReviewScenarios,0);assert.equal(report.associatedScenarios,77);
});
test('Coverage accounts for every record and distinct scenario without treating pending cases as verified',()=>{
  const {summary,queue}=auditLawCoverage(bank,library,definitions);
  assert.equal(summary.totalRecords,788);assert.equal(summary.perLaw.length,17);
  assert.equal(summary.verifiedRecords+queue.reduce((n,group)=>n+group.ids.length,0),bank.length);
  assert.equal(summary.verifiedScenarios+summary.legacyScenarios+summary.needsReviewScenarios+summary.unmappedScenarios,summary.distinctScenarios);
  assert.equal(summary.complete,false);
  for(const id of [3,12,13,60,61]){
    assert.ok(findLawReference(library,q(id)).every(p=>p.reviewedEdition==='2026/27'));
    assert.ok(!queue.some(group=>group.ids.includes(id)));
  }
  assert.ok(queue.some(group=>group.ids.includes(221)&&group.status==='edition-review'));
  const changed=structuredClone(definitions);changed.reviewIssues=[{...definitions.resolvedIssues[0],correctText:'Changed decision'}];
  assert.throws(()=>auditLawCoverage(bank,library,changed));
});
test('New references justify misconduct, goalkeeper swaps, lost footwear and re-entry with the corresponding source rule',()=>{
  const cases=[[2,'reckless-caution'],[4,'vor-red'],[5,'rra-yellow'],[7,'crossbar-broken'],[23,'unnotified-swap'],[35,'second-caution-red'],[63,'equipment-correction'],[68,'lost-shoe']];
  for(const [id,sourceId] of cases)assert.ok(findLawReference(library,q(id)).some(p=>p.id===sourceId));
  const swap=findLawReference(library,q(23));assert.ok(!swap.some(p=>p.id==='ball-out'||p.id==='dropped-ball'));
  for(const record of definitions.reviewedQuestions){const original=q(record.id);assert.equal(record.questionRo,original.questionRo);assert.equal(record.correctText,original.options[original.correctOption]);}
});

test('Every reviewed source association resolves to a real question and literal source highlight', () => {
  assert.equal(validateLawLibrary(library), library);
  for(const reference of library.references) {
    const original = q(reference.seedId);
    assert.equal(reference.questionRo, original.questionRo);
    assert.equal(reference.correctText, original.options[original.correctOption]);
    const passages = findLawReference(library, original);
    assert.equal(passages.length, reference.passages.length);
    for(const item of passages)for(const quote of item.highlights)assert.ok(item.text.includes(quote));
  }
});
test('Corner plus caution is justified by the unchanged restart and reckless caution, never a dropped ball or DFK', () => {
  const passages=findLawReference(library,q(221));
  assert.ok(passages.some(item=>item.article==='12.5'&&item.highlights.some(text=>text.includes('decizia anterioară'))));
  const discipline=passages.find(item=>item.article==='12.4');
  assert.ok(discipline.highlights.some(text=>text.includes('comite cu imprudență')));
  assert.ok(passages.some(item=>item.law===17));
  assert.ok(!passages.some(item=>item.law===9||item.article==='12.1'));
  const html=renderLawExplanation(library,q(221));
  assert.ok(!html.includes('minge de arbitru'));assert.ok(!html.includes('În caz de contact fizic'));
  assert.ok(html.includes('Lovitură de colț și CG atacantului.'));
});
test('Other misconduct after the ball leaves play uses the correct disciplinary provision and restart', () => {
  const throwIn=findLawReference(library,q(223));
  assert.ok(throwIn.some(item=>item.law===15));
  assert.ok(throwIn.some(item=>item.article==='12.4'&&item.highlights.some(text=>text.includes('imprudență'))));
  const dismissal=findLawReference(library,q(224));
  assert.ok(dismissal.some(item=>item.law===16));
  assert.ok(dismissal.some(item=>item.highlights.includes('• comite un fault grosolan.')));
  for(const passages of [throwIn,dismissal])assert.ok(!passages.some(item=>item.id==='ball-out'||item.id==='direct-free-kick'));
});
test('A shared source passage has different highlights for recipient, location, and possession answers', () => {
  const drop=id=>findLawReference(library,q(id)).find(item=>item.id==='dropped-ball');
  assert.equal(drop(10).text,drop(214).text);
  assert.ok(drop(10).highlights.some(text=>text.includes('portarului echipei în apărare')));
  assert.ok(!drop(10).highlights.some(text=>text.includes('se execută în locul')));
  assert.deepEqual(drop(214).highlights,['Mingea de arbitru se execută în locul în care se afla la oprirea jocului.']);
  assert.ok(drop(213).highlights.some(text=>text.includes('care a intrat sau ar fi intrat în posesie')));
  assert.ok(!drop(213).highlights.some(text=>text.includes('portarului')));
  assert.ok(drop(227).highlights.some(text=>text.includes('portarului echipei în apărare')));
});
test('The possession decision highlights the complete outside-penalty-area point',()=>{
  const passage=findLawReference(library,q(213)).find(item=>item.id==='dropped-ball');
  assert.equal(passage.highlights.length,1);
  const quote=passage.highlights[0];
  assert.ok(quote.startsWith('• dacă mingea era în afara'));
  assert.ok(quote.includes('care a intrat sau ar fi intrat în posesie'));
  assert.ok(quote.includes('în caz contrar'));
  assert.ok(quote.endsWith('la oprirea jocului.'));
  assert.ok(renderLawExplanation(library,q(213)).includes(library.revisionLabel));
});
test('Literal highlights stay tied to the correct decision after option shuffling', () => {
  const question=q(221), shuffled=prepareQuestions([question],1,()=>.3)[0];
  const before=renderLawExplanation(library,question),after=renderLawExplanation(library,shuffled);
  assert.equal(before,after);
  assert.ok(before.includes('Justifică:'));
  for(const item of library.excerpts)assert.equal('highlight' in item,false);
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
    value=>value.targetEdition='2027/28',
    value=>value.excerpts[0].source.translation='own-ro',
    value=>value.excerpts.find(e=>e.source.kind==='ifab-web').source.url='javascript:alert(1)',
    value=>value.excerpts.find(e=>e.source.kind==='ifab-web').source.translation='official',
    value=>value.references[0].passages[0].id='missing',
    value=>value.references[0].passages[0].highlights=['not in the PDF'],
    value=>value.references[0].passages[0].highlights=[],
    value=>value.references[0].passages[0].highlights.push(value.references[0].passages[0].highlights[0]),
    value=>value.references[0].passages[0].justifies='',
    value=>value.references.push(value.references[0])
  ]) {const value=structuredClone(library);mutate(value);assert.throws(()=>validateLawLibrary(value));}
});
test('The buildless deploy contains no dependency on an absolute local PDF path', async () => {
  assert.ok(!JSON.stringify(library).includes('C:/Users/'));
  const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
  assert.ok(app.includes('data-explanation='));assert.ok(!app.includes('safeSource('));
});
