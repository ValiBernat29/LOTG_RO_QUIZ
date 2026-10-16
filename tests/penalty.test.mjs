import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {findLawReference,renderLawExplanation,validateLawLibrary} from '../dist/laws-ro.js';
import {prepareQuestions} from '../dist/quiz.js';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const bank=await read('../dist/questions.json'), library=await read('../dist/laws-ro.json');
const reviews=await read('../editorial/rule-reviews.json'),audit=await read('../laws/rule-change-review.json');
const q=id=>bank.find(q=>q.id===id),get=id=>findLawReference(library,q(id));

test('The 23 new penalty scenarios use literal official Romanian and survive shuffling',()=>{
  const references=library.references.filter(r=>r.editionCheckId==='penalty-procedure-2026-27-review');
  assert.equal(references.length,23);
  for(const r of references){
    const passages=get(r.seedId);
    assert.ok(passages.every(p=>p.source.translation==='official'&&p.reviewedEdition==='2026/27'));
    assert.deepEqual(findLawReference(library,prepareQuestions([q(r.seedId)],1,()=>.27)[0]),passages);
    assert.ok(!renderLawExplanation(library,q(r.seedId)).includes('traducere proprie'));
  }
});

test('Illegal feinting has its own caution and restart, not an obsolete automatic simultaneous-offence caution',()=>{
  for(const id of [664,677,682,729]){
    const source=get(id).find(p=>p.id==='penalty-illegal-feint');
    assert.ok(source.highlights.some(t=>t.includes('lovitură liberă indirectă')));
    assert.ok(source.highlights.some(t=>t.includes('arbitrul avertizează executantul')));
    assert.ok(!get(id).some(p=>p.text.includes('dacă portarul și executantul comit o abatere în același timp')));
  }
  for(const id of [677,682])assert.ok(get(id).some(p=>p.id==='penalty-both-teams'));
  assert.ok(get(231).some(p=>p.id==='shootout-kicker-offence'&&p.highlights.some(t=>t.includes('lovitura este înregistrată ca ratată'))));
  assert.ok(!get(231).some(p=>p.id==='penalty-illegal-feint')); // No IFK during a shoot-out.
});

test('Goalkeeper impact, saved kick and disciplinary history get distinct highlights',()=>{
  for(const id of [722,723]){
    const p=get(id).find(p=>p.id==='penalty-goalkeeper-offence');
    assert.ok(p.highlights.some(t=>t.includes('impact asupra executantului')));
    assert.ok(!p.highlights.some(t=>t.includes('împiedicată de către portar')));
  }
  assert.ok(get(724).some(p=>p.highlights.some(t=>t.includes('împiedicată de către portar'))));
  assert.ok(get(724).some(p=>p.highlights.some(t=>t.includes('prima abatere')&&t.includes('ulterioare'))));
  assert.ok(get(113).some(p=>p.id==='advantage'));
  assert.deepEqual(get(113),get(712));
  assert.ok(get(694).some(p=>p.id==='penalty-keeper-conduct'));
  assert.ok(get(242).some(p=>p.id==='shootout-goalkeeper-warning'));
});

test('No touch after feinting differs from voluntarily replaying a post rebound',()=>{
  assert.ok(get(732).some(p=>p.id==='penalty-before-kick'));
  assert.ok(get(732).some(p=>p.id==='penalty-feint-caution'));
  assert.ok(!get(732).some(p=>p.id==='penalty-second-touch-restart'));
  for(const id of [692,711])assert.ok(get(id).some(p=>p.id==='penalty-second-touch-restart'));
  for(const id of [731,733])assert.ok(get(id).some(p=>p.id==='penalty-no-second-touch'));
});

test('Accidental-double-touch explanations now use the complete Romanian book photographs',()=>{
  for(const id of [229,230,663,665]){
    assert.ok(reviews.reviews.some(r=>r.id===id&&r.status==='checked-current'&&r.explanationStatus==='associated-official-ro-photo'));
    assert.ok(get(id).some(p=>p.source.kind==='official-ro-photo'&&p.reviewedEdition==='2026/27'));
    assert.ok(!get(id).some(p=>p.article==='Rezumat'||p.id==='penalty-no-second-touch'));
    assert.deepEqual(findLawReference(library,prepareQuestions([q(id)],1,()=>.39)[0]),get(id));
  }
  assert.ok(audit.pending.some(r=>r.ids.includes(662)&&r.reason.includes('istoricul abaterilor portarului')));
  assert.equal(get(662),null);
});

test('Photograph transcriptions and source registrations exactly match the reviewed catalog',async()=>{
  const catalog=await read('../laws/official-ro-photos-2026-27.json'),defs=await read('../laws/references.json');
  assert.deepEqual(library.photoSources,catalog.sources);
  assert.deepEqual(defs.photoSources,catalog.sources);
  assert.equal(catalog.excerpts.length,2);
  for(const e of catalog.excerpts){
    assert.deepEqual(library.excerpts.find(p=>p.id===e.id),e);
    assert.deepEqual(defs.excerpts.find(p=>p.id===e.id),e);
    assert.ok(e.text.includes('mingea atinge piciorul ori piciorul de sprijin imediat după lovitură:'));
    assert.equal(e.source.sha256,undefined);
    assert.equal(e.source.file,undefined);
  }
});

test('Highlights select the goal or no-goal branch and keep shoot-out misses separate from IFKs',()=>{
  for(const id of [229,230,663,665]){
    const p=get(id).find(p=>p.source.kind==='official-ro-photo');
    assert.equal(p.highlights.length,2);
    assert.ok(p.highlights[0].includes('executantul lovește accidental'));
    assert.equal(p.page,id<300?110:142);
    assert.equal(p.article,id<300?'10.3':'14.2');
    if([230,665].includes(id))assert.equal(p.highlights[1],'dacă mingea intră în poartă în urma loviturii, lovitura se repetă.');
    else assert.ok(p.highlights[1].startsWith('dacă mingea nu intră în poartă'));
  }
  assert.ok(get(229)[0].highlights[1].includes('înregistrată ca ratată'));
  assert.ok(get(663)[0].highlights[1].includes('lovitură liberă indirectă'));
  assert.ok(!get(229)[0].text.includes('lovitură liberă indirectă'));
  assert.ok(get(663).some(p=>p.id==='advantage'&&p.source.edition==='2025/26'));
});

test('Photographs cannot masquerade as another page, article, edition, translation or archived file',()=>{
  for(const change of [
    p=>p.page=111,p=>p.article='10.2',p=>p.source.id='unknown',p=>p.source.edition='2025/26',
    p=>p.source.language='en',p=>p.source.translation='own-ro',p=>p.source.kind='official-ro-pdf',
    p=>p.source.file='invented.pdf',p=>p.source.sha256='0'.repeat(64),p=>p.source.providedAt='unknown'
  ]){
    const copy=structuredClone(library),p=copy.excerpts.find(p=>p.source.kind==='official-ro-photo');
    change(p);assert.throws(()=>validateLawLibrary(copy));
  }
});

test('The modal hides photographic metadata while preserving source records and safe highlights',()=>{
  for(const id of [229,230,663,665]){
    const html=renderLawExplanation(library,q(id));
    assert.ok(html.includes('Ediția de referință: 2026/27'));
    assert.ok(!html.includes('fotografie'));
    assert.ok(!html.includes('arhivată'));
    assert.ok(!html.includes('traducere proprie'));
    assert.ok(!html.includes('Citatele de mai jos sunt textul oficial românesc 2025/26'));
    assert.ok(!html.includes('Pagina undefined'));
  }
  assert.ok(!renderLawExplanation(library,q(663)).includes('PDF românesc'));
  assert.ok(get(663).some(p=>p.source.edition==='2025/26'));
  const copy=structuredClone(library),e=copy.excerpts.find(p=>p.source.kind==='official-ro-photo');
  e.text+='<script>alert(1)</script>';
  const html=renderLawExplanation(copy,q(229));
  assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
});

test('The new pilot justifies source decisions without changing the bank key or spreading the 298 correction',()=>{
  assert.equal(q(298).correctOption,'A');
  assert.ok(get(718).some(p=>p.id==='penalty-keeper-foot'));
  assert.ok(get(713).some(p=>p.id==='penalty-player-positions'));
  for(const id of [703,734])assert.ok(get(id).some(p=>p.id==='penalty-kicker-id'));
  assert.ok(get(730).some(p=>p.highlights.some(t=>t.includes('coechipier al executantului identificat'))));
});
