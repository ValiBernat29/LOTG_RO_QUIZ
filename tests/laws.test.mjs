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
test('The current-edition test contains all 541 reviewed scenarios without duplicates',()=>{
  const questions=preparePilotQuestions(library,bank,()=>.2,'2026/27');
  assert.equal(questions.length,541);
  for(const id of [3,12,13,60,61,83,90,143,332,333,334,763])assert.ok(questions.some(item=>item.questionRo===q(id).questionRo));
  for(const item of questions)assert.ok(findLawReference(library,item).every(p=>p.reviewedEdition==='2026/27'));
});
test('Every explanation shows its reviewed edition once and hides technical provenance without deleting it',()=>{
  const before=JSON.stringify(library);
  for(const reference of library.references) {
    const html=renderLawExplanation(library,q(reference.seedId));
    assert.ok(html.includes(`Ediția de referință: ${reference.reviewedEdition}`));
    assert.equal((html.match(/Ediția de referință:/gu)??[]).length,1);
    assert.equal((html.match(/202[56]\/2[67]/gu)??[]).length,1);
    assert.ok(!/Pagina|Scanare:|PDF românesc|transcriere|fotografie|traducere proprie|Sursa IFAB|Verificare IFAB|law-provenance|href=/u.test(html));
    assert.ok(!html.includes(library.revisionLabel));
    assert.ok(html.includes('Legea '));assert.ok(html.includes('<mark>'));
  }
  assert.equal(JSON.stringify(library),before);
  assert.ok(renderLawExplanation(library,q(12)).includes('Legea 3 · Protocol</div>'));
  const legacy=renderLawExplanation(library,q(45));
  assert.ok(legacy.includes('Ediția de referință: 2025/26'));
  assert.ok(!legacy.includes('2026/27'));
  const report=auditLawCoverage(bank,library,definitions).summary;
  assert.equal(report.verifiedScenarios,541);assert.equal(report.legacyScenarios,2);
  assert.equal(report.needsReviewScenarios,0);assert.equal(report.associatedScenarios,543);
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
  assert.ok(queue.some(group=>group.ids.includes(45)&&group.status==='edition-review'));
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
  assert.ok(!renderLawExplanation(library,q(213)).includes(library.revisionLabel));
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
test('Excerpts are safely escaped and display the law and article without page numbers', () => {
  const html=renderLawExplanation(library,q(146));
  assert.ok(html.includes('Legea 12 · Art. 12.4</div>'));
  assert.ok(!html.includes('Pagina'));assert.ok(html.includes('<mark>'));
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
test('Sixteen legacy associations now have an explicit current-edition check without relabelling the Romanian source',()=>{
  const ids=[9,10,96,146,201,272,221,223,224,225,1,2,5,6,7,23];
  const reviewed=library.references.filter(r=>r.editionCheckId==='legacy-compatibility-2026-27-review');
  assert.equal(reviewed.length,17);
  for(const id of ids){
    const passages=findLawReference(library,q(id));
    assert.ok(passages.every(p=>p.reviewedEdition==='2026/27'&&p.source.edition==='2025/26'&&p.source.translation==='official'&&p.editionCheck));
    assert.deepEqual(findLawReference(library,prepareQuestions([q(id)],1,()=>.61)[0]),passages);
    assert.ok(renderLawExplanation(library,q(id)).includes('Ediția de referință: 2026/27'));
  }
  assert.equal(findLawReference(library,q(45))[0].reviewedEdition,'2025/26');
  assert.equal(findLawReference(library,q(631)),null);
});

test('A reckless push after the ball leaves the goal line keeps the goal kick and separately justifies the caution',()=>{
  const passages=findLawReference(library,q(766));
  for(const id of ['restart-unchanged','goal-kick-restart','reckless-caution'])assert.ok(passages.some(p=>p.id===id));
  assert.ok(!passages.some(p=>p.id==='penalty-award'||p.id==='dropped-ball'));
  assert.equal(q(298).correctOption,'A');
});

test('Removing the explanation training section preserves answer explanations',async()=>{
  const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
  assert.ok(!app.includes('pilot-current'));
  assert.ok(!app.includes('Testează noutățile'));
  assert.ok(!app.includes('data-action="pilot"'));
  assert.ok(app.includes('data-explanation='));
  assert.ok(!app.includes('startPilot'));
  assert.ok(app.includes('loadLawLibrary()'));
});
test('The 26 rev15 checks preserve their pre-review passages, correct decisions and original Romanian provenance',async()=>{
  const snapshot=JSON.parse(await readFile(new URL('../laws/rechecks-rev15.json',import.meta.url),'utf8'));
  assert.equal(snapshot.rows.length,26);
  assert.equal(library.references.filter(r=>r.editionCheckId==='dropped-equipment-discipline-2026-27-review').length,26);
  for(const old of snapshot.rows){
    const r=library.references.find(r=>r.seedId===old.id);
    assert.equal(r.reviewedEdition,'2026/27');
    assert.equal(r.questionRo,old.questionRo);assert.equal(r.correctText,old.correctText);
    assert.deepEqual(r.passages,old.passages);
    assert.ok(findLawReference(library,q(old.id)).every(p=>p.source.edition==='2025/26'&&p.source.translation==='official'));
    assert.deepEqual(findLawReference(library,prepareQuestions([q(old.id)],1,()=>.34)[0]),findLawReference(library,q(old.id)));
  }
});

test('Dropped-ball recipient, position and goal cancellation keep scenario-specific highlights after reverification',()=>{
  const get=id=>findLawReference(library,q(id));
  assert.ok(get(210).some(p=>p.highlights.some(h=>h.includes('se schimbă echipa'))));
  assert.ok(get(213).some(p=>p.highlights.some(h=>h.includes('care a intrat sau ar fi intrat în posesie'))));
  assert.ok(get(214).some(p=>p.highlights.includes('Mingea de arbitru se execută în locul în care se afla la oprirea jocului.')));
  assert.ok(get(227).some(p=>p.highlights.some(h=>h.includes('portarului echipei în apărare'))));
  assert.ok(get(227).some(p=>p.highlights.some(h=>h.includes('mingea intră direct în poartă'))));
});

test('Equipment and disciplinary checks do not conflate interference, permission or a second caution',()=>{
  const get=id=>findLawReference(library,q(id));
  assert.ok(get(63).some(p=>p.id==='equipment-correction'&&p.highlights.some(h=>h.includes('intervine în joc'))));
  assert.ok(get(70).some(p=>p.highlights.some(h=>h.includes('lovitură liberă indirectă'))));
  for(const id of [68,69,71])assert.ok(get(id).some(p=>p.id==='lost-shoe'));
  assert.ok(get(66).some(p=>p.id==='shin-guards'));
  assert.ok(get(65).some(p=>p.id==='optional-gloves'));
  for(const id of [35,36,41])assert.ok(get(id).some(p=>p.id==='second-caution-red'));
});

test('Rechecks do not automatically certify unresolved legacy associations or FAQ interpretations',()=>{
  for(const id of [45,50])assert.equal(findLawReference(library,q(id))[0].reviewedEdition,'2025/26');
  assert.equal(findLawReference(library,q(631)),null);
  assert.equal(q(298).correctOption,'A');
});

test('Rev16 reverifies six player and goalkeeper scenarios without changing the reviewed decision or highlights',async()=>{
  const snapshot=JSON.parse(await readFile(new URL('../laws/rechecks-rev16.json',import.meta.url),'utf8'));
  assert.deepEqual(snapshot.rows.map(r=>r.id),[16,51,52,53,56,57]);
  const refs=library.references.filter(r=>r.editionCheckId==='players-goalkeepers-2026-27-review');
  assert.equal(refs.length,6);
  for(const old of snapshot.rows){
    const ref=refs.find(r=>r.seedId===old.id);
    assert.equal(ref.reviewedEdition,'2026/27');
    assert.equal(ref.questionRo,old.questionRo);assert.equal(ref.correctText,old.correctText);
    assert.deepEqual(ref.passages,old.passages);
    const passages=findLawReference(library,q(old.id));
    assert.ok(passages.every(p=>p.source.edition==='2025/26'&&p.source.translation==='official'));
    assert.deepEqual(findLawReference(library,prepareQuestions([q(old.id)],1,()=>.4)[0]),passages);
  }
});

test('Rev16 keeps goalkeeper changes distinct from substitute entry and deliberate departure distinct from temporary absence',()=>{
  const get=id=>findLawReference(library,q(id));
  assert.ok(get(16).some(p=>p.id==='shirt-colors'));
  assert.ok(get(57).some(p=>p.id==='swap-goalkeeper'));
  assert.ok(!get(57).some(p=>p.id==='substitute-entry'));
  assert.ok(get(52).some(p=>p.highlights.some(h=>h.includes('în mod deliberat'))));
  assert.ok(get(53).some(p=>p.id==='refuse-substitution'));
  assert.ok(get(51).some(p=>p.id==='unnotified-starter'));
  assert.ok(get(56).some(p=>p.id==='return-substitutes'));
});

test('The explanation training card and its styles are removed without deleting the reviewed library',async()=>{
  const app=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../dist/styles.css',import.meta.url),'utf8');
  assert.ok(!/pilot-card|pilot-title|pilotLoading|Toate explicațiile disponibile|Exersează cu explicații|preparePilotQuestions/u.test(app));
  assert.ok(!/pilot-card|pilot-actions/u.test(css));
  assert.ok(app.includes('Vezi explicația din Legile Jocului'));
  assert.equal(preparePilotQuestions(library,bank,()=>.5).length,543);
  assert.ok(preparePilotQuestions(library,bank,()=>.5).some(r=>r.questionRo===q(217).questionRo));
});

test('Rev17 reverifies eight associations without changing scenarios, decisions or Romanian source texts',async()=>{
  const snapshot=JSON.parse(await readFile(new URL('../laws/rechecks-rev17.json',import.meta.url),'utf8'));
  assert.deepEqual(snapshot.rows.map(r=>r.id),[14,19,27,29,30,31,38,48]);
  const refs=library.references.filter(r=>r.editionCheckId==='reentry-interference-dogso-2026-27-review');
  assert.equal(refs.length,8);
  for(const old of snapshot.rows){
    const ref=refs.find(r=>r.seedId===old.id);
    assert.equal(ref.questionRo,old.questionRo);assert.equal(ref.correctText,old.correctText);
    assert.equal(ref.reviewedEdition,'2026/27');
    assert.deepEqual(ref.passages.map(p=>p.id),old.passages.map(p=>p.id));
    const passages=findLawReference(library,q(old.id));
    assert.ok(passages.every(p=>p.source.edition==='2025/26'&&p.source.translation==='official'));
    for(const passage of passages){
      const before=old.passages.find(p=>p.id===passage.id);
      for(const highlight of passage.highlights){
        assert.ok(passage.text.includes(highlight));
        assert.ok(before.highlights.some(h=>h.includes(highlight)));
      }
    }
    assert.deepEqual(findLawReference(library,prepareQuestions([q(old.id)],1,()=>.42)[0]),passages);
  }
});

test('Re-entry highlights distinguish no interference, SPA, direct DOGSO dismissal and conditional restart',()=>{
  const get=(id,passage)=>findLawReference(library,q(id)).find(p=>p.id===passage);
  assert.deepEqual(get(31,'return-restart').highlights,['• să avertizeze jucătorul pentru intrarea pe teren fără permisiune.']);
  for(const id of [30,38]){
    const highlights=get(id,'return-restart').highlights.join(' ');
    assert.ok(highlights.includes('lovitură liberă directă'));
    assert.ok(!highlights.includes('lovitură liberă indirectă'));
  }
  assert.ok(get(30,'unauthorized-dogso').highlights.some(h=>h.includes('eliminare')));
  assert.ok(get(30,'penalty-award'));
  for(const id of [19,38]){
    assert.ok(get(id,'two-cautions'));
    assert.ok(get(id,'second-caution-red'));
  }
  assert.ok(get(48,'return-restart').highlights.some(h=>h.includes('lovitură liberă indirectă')));
  assert.equal(q(298).correctOption,'A');
});

test('Goal cancellation highlights the interfering attacking team rather than the outside-agent exception',()=>{
  const passages=findLawReference(library,q(27));
  const highlights=passages.find(p=>p.id==='extra-person-goal').highlights.join(' ');
  assert.ok(highlights.includes('echipei care a marcat golul'));
  assert.ok(highlights.includes('lovitură liberă directă'));
  assert.ok(!highlights.includes('minge de arbitru'));
  assert.ok(!highlights.includes('persoană străină/factor extern'));
  assert.ok(passages.some(p=>p.id==='substitute-cautions'));
  assert.ok(findLawReference(library,q(14)).some(p=>p.id==='drop-other-stoppages'));
  assert.ok(findLawReference(library,q(29)).some(p=>p.id==='red-dogso-free-kick'));
  for(const id of [45,50])assert.equal(findLawReference(library,q(id))[0].reviewedEdition,'2025/26');
});

test('Rev18 reverifies seven associations without changing questions, answers or the source edition',async()=>{
  const snapshot=JSON.parse(await readFile(new URL('../laws/rechecks-rev18.json',import.meta.url),'utf8'));
  assert.deepEqual(snapshot.rows.map(r=>r.id),[11,42,43,47,55,58,59]);
  const refs=library.references.filter(r=>r.editionCheckId==='outside-agents-intervals-authority-2026-27-review');
  assert.equal(refs.length,7);
  for(const old of snapshot.rows){
    const ref=refs.find(r=>r.seedId===old.id);
    assert.equal(ref.questionRo,old.questionRo);assert.equal(ref.correctText,old.correctText);
    assert.equal(ref.reviewedEdition,'2026/27');
    if(old.id!==58)assert.deepEqual(ref.passages,old.passages);
    const passages=findLawReference(library,q(old.id));
    assert.ok(passages.every(p=>p.source.edition==='2025/26'&&p.source.translation==='official'));
    assert.deepEqual(findLawReference(library,prepareQuestions([q(old.id)],1,()=>.29)[0]),passages);
  }
});

test('Outside agents retain scenario-specific possession, goalkeeper and goal conditions',()=>{
  const get=(id,passage)=>findLawReference(library,q(id)).find(p=>p.id===passage);
  assert.ok(get(11,'extra-persons').highlights.some(h=>h.includes('minge de arbitru')));
  assert.ok(get(11,'dropped-ball').highlights.some(h=>h.includes('ar fi intrat în posesie')));
  assert.ok(get(59,'dropped-ball').highlights.some(h=>h.includes('portarului echipei în apărare')));
  assert.ok(get(47,'extra-persons').highlights.some(h=>h.includes('dacă mingea intră în poartă')));
  for(const id of [43,55])assert.ok(get(id,'unnotified-break').highlights.some(h=>h.includes('autorităţilor competente')));
  assert.ok(get(42,'sent-off-before-list'));
  assert.ok(get(42,'authority-before-match'));
});

test('A coach interference is justified by team-official provisions rather than a player-only penalty provision',()=>{
  const passages=findLawReference(library,q(58));
  assert.deepEqual(passages.map(p=>p.id),['official-interference-red','extra-persons']);
  assert.ok(passages.find(p=>p.id==='extra-persons').highlights.some(h=>h.includes('un oficial al echipei')));
  const highlight=passages.find(p=>p.id==='official-interference-red').highlights.join(' ');
  assert.ok(highlight.includes('a interveni în joc'));
  assert.ok(!highlight.includes('a înfrunta un oficial'));
  assert.ok(!passages.some(p=>p.id==='penalty-award'));
  assert.equal(q(298).correctOption,'A');
});

test('Rev19 reverifies four substitution scenarios with unchanged decisions and Romanian provenance',async()=>{
  const snapshot=JSON.parse(await readFile(new URL('../laws/rechecks-rev19.json',import.meta.url),'utf8'));
  assert.deepEqual(snapshot.rows.map(r=>r.id),[17,18,22,24]);
  const refs=library.references.filter(r=>r.editionCheckId==='substitution-before-penalty-2026-27-review');
  assert.equal(refs.length,4);
  for(const old of snapshot.rows){
    const ref=refs.find(r=>r.seedId===old.id);
    assert.equal(ref.questionRo,old.questionRo);assert.equal(ref.correctText,old.correctText);
    assert.equal(ref.reviewedEdition,'2026/27');
    assert.deepEqual(ref.passages.map(p=>p.id),old.passages.map(p=>p.id));
    const passages=findLawReference(library,q(old.id));
    assert.ok(passages.every(p=>p.source.edition==='2025/26'&&p.source.translation==='official'));
    for(const passage of passages)for(const h of passage.highlights){
      assert.ok(passage.text.includes(h));
      assert.ok(old.passages.find(p=>p.id===passage.id).highlights.some(before=>before.includes(h)));
    }
    assert.deepEqual(findLawReference(library,prepareQuestions([q(old.id)],1,()=>.67)[0]),passages);
  }
});

test('Substitution highlights distinguish entry conditions from eligibility to take the penalty',()=>{
  const highlights=id=>findLawReference(library,q(id)).find(p=>p.id==='substitute-entry').highlights.join(' ');
  for(const id of [18,22]){
    assert.ok(highlights(id).includes('după primirea semnalului de la arbitru'));
    assert.ok(!highlights(id).includes('poate repune mingea'));
  }
  for(const id of [17,24])assert.ok(highlights(id).includes('Procedura de înlocuire se încheie'));
});

test('The substitution check records the ten-second exception without certifying all legacy scenarios',()=>{
  const check=library.editionChecks.find(c=>c.id==='substitution-before-penalty-2026-27-review');
  assert.ok(check.additionalUrls.includes('https://www.theifab.com/laws/latest/time-limited-substitution-protocol/'));
  assert.ok(check.note.includes('interzice anularea/schimbarea'));
  const protocol=library.excerpts.find(p=>p.id==='sub-one-minute-2627');
  assert.ok(protocol.text.includes('înlocuirea nu poate fi anulată și nici jucătorul de rezervă schimbat'));
  assert.deepEqual(library.references.filter(r=>r.reviewedEdition==='2025/26').map(r=>r.seedId).sort((a,b)=>a-b),[45,50]);
  assert.equal(q(298).correctOption,'A');
});
