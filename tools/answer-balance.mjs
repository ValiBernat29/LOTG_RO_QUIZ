import {readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export function answerBalance(bank) {
  const unique = [...new Map(bank.map(q => [q.questionRo + '\0' + q.options[q.correctOption], q])).values()];
  const flagged = [];
  let uniqueLongest = 0, overTwiceWrongMean = 0;
  for (const q of unique) {
    const correct = q.options[q.correctOption].length;
    const wrong = Object.entries(q.options).filter(([k]) => k !== q.correctOption).map(([,text]) => text.length);
    const ratio = correct / (wrong.reduce((a,b) => a+b, 0) / 3);
    if (correct > Math.max(...wrong)) {
      uniqueLongest++;
      flagged.push({id:q.id, correctToWrongMean:Number(ratio.toFixed(2))});
    }
    if (ratio > 2) overTwiceWrongMean++;
  }
  return {records:bank.length, options:bank.length*4, scenarios:unique.length,
    uniqueLongest, overTwiceWrongMean, flagged:flagged.sort((a,b) => b.correctToWrongMean-a.correctToWrongMean)};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const bank = JSON.parse(await readFile(new URL('../dist/questions.json', import.meta.url),'utf8'));
  const revisions = JSON.parse(await readFile(new URL('../editorial/answer-revisions.json', import.meta.url),'utf8'));
  const original = bank.map(q => {
    const revision=revisions.rows.find(r=>r.id===q.id);
    return revision?{...q,options:revision.before,correctOption:revision.correctOption}:q;
  });
  const report = {metric:'Characters including spaces; a length flag is not evidence of an incorrect decision.',
    manuallyRevisedScenarios:revisions.scenarios, revisedRecords:revisions.rows.length,
    before:answerBalance(original), after:answerBalance(bank)};
  await writeFile(new URL('../editorial/answer-balance.json', import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,before:{...report.before,flagged:undefined},after:{...report.after,flagged:undefined}},null,2));
}
