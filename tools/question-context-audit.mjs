import {readFile,writeFile} from 'node:fs/promises';
const read=async url=>JSON.parse((await readFile(url,'utf8')).replace(/^\uFEFF/,''));
const bank=await read(new URL('../dist/questions.json',import.meta.url));
const reviewed=await read(new URL('../editorial/question-revisions.json',import.meta.url));
let english;
try { english=await read(new URL('../../ifab_faqs.cleaned.json',import.meta.url)); }
catch(error) { if(error.code==='ENOENT')throw new Error('Context audit requires the local English scraper snapshot.');throw error; }
if(english.length!==bank.length)throw new Error('Source row count changed: review ID alignment first.');
const groups=new Map();
for(const q of bank){
  const source=english[q.id-1];
  if(!source || source.SourceUrl!==q.sourceUrl || source.LawNumber!==q.lawNumber)throw new Error(`Source alignment mismatch: ${q.id}`);
  const identity=JSON.stringify([q.questionRo,q.options[q.correctOption]]);
  if(groups.has(identity)){groups.get(identity).ids.push(q.id);continue;}
  const flags=[];
  if(source.Question.length>=250&&q.questionRo.length<source.Question.length*.6)flags.push('strong-compression');
  if(/Team A/i.test(source.Question)&&/Team B/i.test(source.Question)&&!/(?:echip[aei]+|jucător)\s+[AB]/u.test(q.questionRo))flags.push('team-labels-omitted');
  if(/DOGSO/u.test(q.questionRo)&&!/gol|poart[ăae]/u.test(q.questionRo))flags.push('dogso-without-described-goal-context');
  if(/medical staff determines/i.test(source.Question)&&!/personalul medical.*stabilește/u.test(q.questionRo))flags.push('medical-assessment-condition');
  const revision=reviewed.rows.find(r=>r.id===q.id);
  groups.set(identity,{ids:[q.id],status:revision?'context-restored':'not-manually-certified',flags,
    questionRo:q.questionRo,correctText:q.options[q.correctOption],sourceQuestion:source.Question});
}
const queue=[...groups.values()].filter(g=>g.status!=='context-restored'&&g.flags.length);
const report={note:'Priority signals only; compression and omitted labels are not proof of an incomplete question. This audit does not certify the other stems or decide rules.',
  records:bank.length,options:bank.length*4,distinctScenarios:groups.size,
  manuallyRevisedScenarios:reviewed.scenarios,revisedRecords:reviewed.rows.length,priorityScenarios:queue.length,queue};
await writeFile(new URL('../editorial/question-context-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,queue:undefined},null,2));
