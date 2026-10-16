import {readFile,writeFile} from 'node:fs/promises';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const bank=await read('../dist/questions.json'), reviews=await read('../editorial/rule-reviews.json');
const corrections=await read('../editorial/rule-corrections.json');
const topics=[
  ['dogso-advantage',/DOGSO|avantaj|ocazie clară de gol/iu,'Avantaj, gol valid, gol nevalid sau ratat și existența altor motive de CG/CR.'],
  ['accidental-double-touch',/piciorul de sprijin|ambele picioare|atinge accidental piciorul|dublă atingere/iu,'Dublă atingere accidentală vs simulare/atingere deliberată; rezultat și abaterea portarului.'],
  ['countdown',/cinci secunde|opt secunde|șase secunde|[568] secunde/iu,'Controlul mingii de portar este distinct de întârzierea aruncării/loviturii de poartă.'],
  ['substitution-timing',/zece secunde|înlocuire.*minut|înlocuitor.*minut/iu,'Termenul înlocuirii și intrarea la prima oprire după minut; excepții.'],
  ['injury-treatment',/îngrijiri|brancard|accidentat|accidentării/iu,'Minutul în afara terenului, excepțiile și constatarea medicală.'],
  ['equipment',/cercei|colier|bijuterii|accesorii/iu,'Accesorii nepericuloase acoperite în siguranță vs obiecte periculoase.'],
  ['dropped-ball',/minge de arbitru|mingea de arbitru/iu,'Beneficiarul în funcție de posesia probabilă și locul interferenței.'],
  ['var-scope',/VAR|analiz[aă] video/iu,'Schimbarea sferei revizuirii: al doilea CG eronat, identitate, opțiunea privind colțurile.']
];
const byId=new Map();
const byIdentity=new Map();
for(const r of reviews.reviews){
  const q=bank.find(q=>q.id===r.id);
  if(!q||q.questionRo!==r.questionRo||q.options[q.correctOption]!==r.correctText||byId.has(r.id))throw new Error(`Rule review drift: ${r.id}`);
  byId.set(r.id,r);
  const identity=JSON.stringify([r.questionRo,r.correctText]);
  const existing=byIdentity.get(identity);
  if(existing&&existing.status!==r.status)throw new Error(`Conflicting duplicate rule reviews: ${existing.id}, ${r.id}`);
  byIdentity.set(identity,r);
}
const groups=new Map();
for(const q of bank){
  const key=JSON.stringify([q.questionRo,q.options[q.correctOption]]);
  const matched=topics.filter(([,pattern])=>pattern.test(q.questionRo+' '+q.options[q.correctOption])).map(([id,,check])=>({id,check}));
  // An earlier unreviewed duplicate must not hide a later explicit review.
  const manual=byId.get(q.id)??byIdentity.get(key);
  if(manual&&!matched.some(t=>t.id===manual.topic))matched.push({id:manual.topic,check:'Verificare individuală înregistrată, chiar dacă enunțul nu conține acronimul sau termenul folosit de detector.'});
  if(!matched.length)continue;
  if(!groups.has(key))groups.set(key,{ids:[],questionRo:q.questionRo,correctText:q.options[q.correctOption],topics:matched,status:manual?.status??'manual-review',reason:manual?.reason??'Semnal tematic, nu eroare confirmată; trebuie comparate situația și răspunsul cu ediția de referință.'});
  groups.get(key).ids.push(q.id);
}
const rows=[...groups.values()];
const report={edition:reviews.edition,note:'Audit tematic al tuturor înregistrărilor; nu certifică întreaga bancă și nu modifică răspunsurile.',totalRecords:bank.length,
  corrected:rows.filter(r=>r.status==='corrected'),checked:rows.filter(r=>r.status==='checked-current'),pending:rows.filter(r=>r.status==='manual-review')};
await writeFile(new URL('../laws/rule-change-review.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
const table=report.pending.map(r=>`| ${r.ids.join(', ')} | ${r.topics.map(t=>t.id).join(', ')} | ${r.correctText.replaceAll('|','/')} |`).join('\n');
await writeFile(new URL('../laws/RULE_CHANGES.md',import.meta.url),`# Reverificarea răspunsurilor după schimbări de regulament\n\nEdiție: ${reviews.edition}. ${report.totalRecords} de înregistrări scanate.\n\nCorecturi confirmate: ${report.corrected.length} situații. Verificate și păstrate: ${report.checked.length}. Semnale rămase pentru lectură: ${report.pending.length}. Aceste semnale nu sunt erori confirmate.\n\nRegistrul complet: \`rule-change-review.json\`. Corecturile înainte/după și sursele: \`../editorial/rule-corrections.json\`. Nu se elimină CG pentru imprudență sau CR pentru fault grosolan/comportament violent doar fiindcă s-a înscris un gol.\n\n| ID-uri | Teme de verificat | Răspuns existent, încă neverificat în acest audit |\n| --- | --- | --- |\n${table}\n`,'utf8');
console.log(JSON.stringify({records:bank.length,corrected:report.corrected.length,checked:report.checked.length,pending:report.pending.length,semanticCorrections:corrections.rows.length}));
