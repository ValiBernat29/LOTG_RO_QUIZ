import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prepareQuestions, score, safeSource, validSession, uniqueQuestions, examDurationMs, repairSavedSession, cleanRomanianText } from '../dist/quiz.js';
import { showConfirmation, showInformation } from '../dist/modal.js';
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
test('Exam timing gives 30 minutes for 20 questions and scales with the real pool size',()=>{
  assert.equal(examDurationMs(20),30*60000);
  assert.equal(examDurationMs(10),15*60000);
  assert.equal(examDurationMs(40),60*60000);
  assert.equal(examDurationMs(2),3*60000);
  assert.throws(()=>examDurationMs(0),RangeError);
});
test('The complete bank contains no repeated diacritics or known gender errors',()=>{
  const invalid=/([ăâîșț])\1|comportament (?:violentă|nesportivă)|înlocuitorul este avertizată/u;
  for(const q of bank)for(const text of [q.questionRo,...Object.values(q.options)])assert.equal(invalid.test(text),false,`ID ${q.id}: ${text}`);
});
test('Previously saved shuffled sessions receive spelling fixes without losing answers',()=>{
  const q={...bank[0],questionRo:'Comportament nesportiv.',options:{A:'Lovitură de poartă acordatăă echipei B.',B:'Comportament violentă.',C:'CG.',D:'CR.'},correctOption:'A'};
  const saved={mode:'practice',questions:[q],answers:{[q.id]:'A'},index:0,startedAt:Date.now()};
  const repaired=repairSavedSession(saved);
  assert.equal(repaired.questions[0].options.A,'Lovitură de poartă acordată echipei B.');
  assert.equal(repaired.questions[0].options.B,'Comportament violent.');
  assert.deepEqual(repaired.answers,saved.answers);
  assert.equal(repaired.questions[0].correctOption,'A');
  assert.equal(saved.questions[0].options.A,'Lovitură de poartă acordatăă echipei B.');
});
test('Contextual wording fixes cover duplicate questions without deleting meaningful emphasis',()=>{
  const invalid=/Nicio sancțiune (?:suplimentară|individuală)|sancțiune disciplinară suplimentară|avantajul(?: așteptat)? nu s-a mai concretizat deloc|incidentul se menționează doar în raport/u;
  for(const q of bank)for(const text of [q.questionRo,...Object.values(q.options)])assert.equal(invalid.test(text),false,`ID ${q.id}: ${text}`);
  assert.equal(cleanRomanianText('Nicio sancțiune suplimentară; se execută LLD.'),'Nicio sancțiune disciplinară; se execută LLD.');
  assert.equal(cleanRomanianText('Minge de arbitru; avantajul așteptat nu s-a mai concretizat deloc.'),'Minge de arbitru; avantajul așteptat nu s-a mai concretizat.');
  assert.equal(cleanRomanianText('Nicio sancțiune individuală; incidentul se menționează doar în raport.'),'Nicio sancțiune disciplinară; incidentul se menționează în raport.');
  for(const text of ['Atacantul nu atinge deloc mingea.','Jucătorul nu poate participa deloc în prima repriză.'])assert.equal(cleanRomanianText(text),text);
});
test('Saved wording is repaired independently of shuffled letters, including the cached correct text',()=>{
  const q={...bank[0],options:{A:'CR.',B:'CG.',C:'LLI.',D:'LLD de la locul atacului; avantajul nu s-a mai concretizat deloc.'},correctOption:'D',correctText:'LLD de la locul atacului; avantajul nu s-a mai concretizat deloc.'};
  const saved={mode:'practice',questions:[q],answers:{[q.id]:'D'},flags:[q.id],index:0,startedAt:123};
  const repaired=repairSavedSession(saved);
  assert.equal(repaired.questions[0].options.D,'LLD de la locul atacului; avantajul nu s-a mai concretizat.');
  assert.equal(repaired.questions[0].correctText,repaired.questions[0].options.D);
  assert.deepEqual(repaired.answers,saved.answers);assert.deepEqual(repaired.flags,saved.flags);
  assert.equal(repaired.questions[0].correctOption,'D');assert.equal(repaired.startedAt,123);
  assert.deepEqual(repairSavedSession(repaired),repaired);
});
test('Referee decisions use the active voice in the bank and in saved shuffled sessions',()=>{
  for(const q of bank)for(const text of Object.values(q.options))assert.equal(/^Joc oprit\b/u.test(text),false);
  assert.equal(cleanRomanianText('Joc oprit; minge de arbitru pentru B.'),'Oprește jocul; minge de arbitru pentru B.');
  assert.equal(cleanRomanianText('Joc oprit imediat, apoi CG.'),'Oprește jocul imediat, apoi CG.');
  assert.equal(cleanRomanianText('Dacă jocul este oprit, se menține decizia.'),'Dacă jocul este oprit, se menține decizia.');
  const question={...bank[0],options:{A:'Joc oprit; minge de arbitru pentru B.',B:'Joc oprit; minge de arbitru pentru A.',C:'LLI.',D:'Jocul continuă.'},correctOption:'A',correctText:'Joc oprit; minge de arbitru pentru B.'};
  const saved={mode:'practice',questions:[question],answers:{[question.id]:'B'},index:0,startedAt:123};
  const repaired=repairSavedSession(saved);
  assert.equal(repaired.questions[0].options.A,'Oprește jocul; minge de arbitru pentru B.');
  assert.equal(repaired.questions[0].correctText,repaired.questions[0].options.A);
  assert.deepEqual(repaired.answers,saved.answers);assert.equal(repaired.questions[0].correctOption,'A');
});

// A small dialog host tests our event wiring; native focus/inert/layout behavior
// still requires browser QA and is not simulated here.
function modalHost(information=false) {
  const elements=new Map(), handlers=new Map();
  const before={isConnected:true,focus(){this.focused=true;}};
  const dialog={
    returnValue:'',open:false,removed:false,
    setAttribute(){},
    querySelector(selector){if(!elements.has(selector))elements.set(selector,{focus(){this.focused=true;}});return elements.get(selector);},
    addEventListener(type,handler){handlers.set(type,handler);},
    showModal(){this.open=true;},
    close(value=''){if(!this.open)return;this.returnValue=value;this.open=false;handlers.get('close')();},
    remove(){this.removed=true;},
    getBoundingClientRect(){return {left:20,top:20,right:300,bottom:200};}
  };
  const doc={activeElement:before,createElement(){return dialog;},body:{append(){}}};
  let confirmed=0,closed=0;
  if(information)showInformation({title:'Explicația din Legile Jocului',html:'<p>Pasaj în română.</p>',onClose(){closed++;}},doc);
  else showConfirmation({title:'Sesiune nouă?',text:'Se înlocuiește sesiunea.',confirmLabel:'Începe',onConfirm(){confirmed++;},onClose(){closed++;}},doc);
  return {dialog,before,handlers,counts:()=>({confirmed,closed})};
}
test('Dialog cancellation via button, close icon and Escape never confirms replacement',()=>{
  for(const selector of ['[data-modal="cancel"]','.modal-close','Escape']){
    const host=modalHost();assert.equal(host.dialog.open,true);
    if(selector==='Escape'){
      let prevented=false;host.handlers.get('cancel')({preventDefault(){prevented=true;}});assert.equal(prevented,true);
    }else host.dialog.querySelector(selector).onclick();
    assert.deepEqual(host.counts(),{confirmed:0,closed:1});
    assert.equal(host.dialog.removed,true);assert.equal(host.before.focused,true);
  }
});
test('Only an outside gesture dismisses the dialog; confirmation fires once',()=>{
  const host=modalHost(),inside={target:host.dialog,clientX:50,clientY:50},outside={target:host.dialog,clientX:0,clientY:0};
  host.handlers.get('pointerdown')(inside);host.handlers.get('click')(inside);assert.equal(host.dialog.open,true);
  host.handlers.get('pointerdown')(inside);host.handlers.get('click')(outside);assert.equal(host.dialog.open,true);
  host.handlers.get('pointerdown')(outside);host.handlers.get('click')(outside);
  assert.deepEqual(host.counts(),{confirmed:0,closed:1});
  const accepted=modalHost();accepted.dialog.querySelector('[data-modal="accept"]').onclick();
  accepted.dialog.querySelector('[data-modal="accept"]').onclick();
  assert.deepEqual(accepted.counts(),{confirmed:1,closed:1});
});
test('Programmatic dismissal does not replace the running session',()=>{
  const host=modalHost();host.dialog.close();assert.deepEqual(host.counts(),{confirmed:0,closed:1});
});
test('The information modal reuses dismissal and focus restoration without a confirmation action',()=>{
  const host=modalHost(true);
  assert.equal(host.dialog.className,'modal law-modal');
  assert.equal(host.dialog.querySelector('#modal-title').textContent,'Explicația din Legile Jocului');
  assert.equal(host.dialog.querySelector('.modal-body').innerHTML,'<p>Pasaj în română.</p>');
  host.dialog.querySelector('.modal-close').onclick();
  assert.deepEqual(host.counts(),{confirmed:0,closed:1});assert.equal(host.before.focused,true);
});
