import {writeFile} from 'node:fs/promises';
import {cleanRomanianText, LAW_NAMES} from '../dist/quiz.js';
import {findLawReference, validateLawLibrary} from '../dist/laws-ro.js';

const compact = text => cleanRomanianText(text).replace(/\s+/gu,' ').trim();
const identity = (question,correct) => JSON.stringify([compact(question),compact(correct)]);

export function auditLawCoverage(questions, library, definitions) {
  validateLawLibrary(library);
  const issues = new Map();
  for(const issue of definitions.reviewIssues ?? []) {
    const q=questions.find(q=>q.id===issue.id);
    if(!q || q.questionRo!==issue.questionRo || q.options[q.correctOption]!==issue.correctText) throw new Error(`Reverifică neconcordanța ${issue.id}`);
    const key=identity(issue.questionRo,issue.correctText);
    if(issues.has(key))throw new Error(`Neconcordanță duplicată ${issue.id}`);
    if(findLawReference(library,q))throw new Error(`Întrebarea ${issue.id} este și verificată, și în conflict`);
    issues.set(key,issue);
  }
  const groups=new Map();
  for(const q of questions) {
    const key=identity(q.questionRo,q.options[q.correctOption]);
    const passages=findLawReference(library,q);
    const status=passages ? passages[0].reviewedEdition===library.targetEdition?'verified':'edition-review' : issues.has(key)?'needs-review':'unmapped';
    if(!groups.has(key))groups.set(key,{questionRo:q.questionRo,correctText:q.options[q.correctOption],ids:[],laws:[],status,reviewedEdition:passages?.[0].reviewedEdition ?? null,issue:issues.get(key) ?? null});
    const group=groups.get(key);group.ids.push(q.id);
    if(!group.laws.includes(q.lawNumber))group.laws.push(q.lawNumber);
  }
  const all=[...groups.values()];
  const perLaw=Object.entries(LAW_NAMES).map(([id,title])=>{
    const rows=questions.filter(q=>q.lawNumber===+id), counts={verified:0,'needs-review':0,'edition-review':0,unmapped:0};
    for(const q of rows)counts[groups.get(identity(q.questionRo,q.options[q.correctOption])).status]++;
    return {lawNumber:+id,title,total:rows.length,verified:counts.verified,legacy:counts['edition-review'],needsReview:counts['needs-review'],unmapped:counts.unmapped,complete:counts.verified===rows.length};
  });
  const summary={edition:library.targetEdition,pdfEdition:library.edition,revision:library.revisionLabel,totalRecords:questions.length,distinctScenarios:all.length,
    verifiedRecords:perLaw.reduce((n,law)=>n+law.verified,0),verifiedScenarios:all.filter(group=>group.status==='verified').length,
    legacyRecords:perLaw.reduce((n,law)=>n+law.legacy,0),legacyScenarios:all.filter(group=>group.status==='edition-review').length,
    associatedRecords:perLaw.reduce((n,law)=>n+law.verified+law.legacy,0),associatedScenarios:all.filter(group=>['verified','edition-review'].includes(group.status)).length,
    needsReviewRecords:perLaw.reduce((n,law)=>n+law.needsReview,0),needsReviewScenarios:all.filter(group=>group.status==='needs-review').length,
    unmappedScenarios:all.filter(group=>group.status==='unmapped').length,complete:all.every(group=>group.status==='verified'),perLaw};
  const queue=all.filter(group=>group.status!=='verified').sort((a,b)=>a.ids[0]-b.ids[0]);
  return {summary,queue};
}

export async function writeLawAudit(questions,library,definitions) {
  const report=auditLawCoverage(questions,library,definitions);
  const rows=report.summary.perLaw.map(law=>`| ${law.lawNumber} · ${law.title} | ${law.verified}/${law.total} | ${law.legacy} | ${law.needsReview} | ${law.unmapped} |`).join('\n');
  const issues=report.queue.filter(group=>group.status==='needs-review').map(group=>
    `- ID ${group.ids.join(', ')}: ${group.issue.reason} (Surse: ${group.issue.evidence.map(item=>Number.isInteger(item.page)?'p. '+item.page+(item.edition?' · '+item.edition:''):item.url ?? 'de verificat').join(', ')})`).join('\n');
  const markdown=`# Acoperirea explicațiilor în română\n\nRaport generat prin \`npm run laws:audit\`. Nu reprezintă o declarație de finalizare.\n\n`+
    `Ediția de referință: ${library.targetEdition}. PDF românesc integral: ${library.edition}. ${library.supplementalSources?.length?'Supliment: scanare românească 2026/27 cu protocoale și rezumatul modificărilor. ':''}${library.revisionLabel}.\n\n`+
    `- Înregistrări cu explicații: **${report.summary.associatedRecords}/${questions.length}** (${report.summary.associatedScenarios} situații distincte).\n`+
    `- Verificate pentru ${library.targetEdition}: **${report.summary.verifiedRecords} înregistrări / ${report.summary.verifiedScenarios} situații**.\n`+
    `- Verificate pe ${library.edition}, în curs de reverificare pentru ${library.targetEdition}: **${report.summary.legacyRecords} înregistrări / ${report.summary.legacyScenarios} situații**.\n`+
    `- Situații care necesită clarificare: **${report.summary.needsReviewScenarios}**.\n`+
    `- Situații încă neasociate: **${report.summary.unmappedScenarios}**.\n\n`+
    `| Lege de colectare | Verificate 2026/27 | De reverificat din 2025/26 | Necesită clarificare | Neasociate |\n| --- | ---: | ---: | ---: | ---: |\n${rows}\n\n`+
    `Legea de colectare nu este obligatoriu legea care justifică răspunsul. Duplicate identice beneficiază de aceeași asociere.\n\n`+
    `## Neconcordanțe de verificat\n\n${issues||'Nu sunt înregistrate neconcordanțe.'}\n\n`+
    `Răspunsurile și cheile nu sunt modificate de audit. Coada completă se află în \`review-queue.json\`.\n`;
  await Promise.all([
    writeFile(new URL('../laws/coverage.json',import.meta.url),JSON.stringify(report.summary,null,2)+'\n','utf8'),
    writeFile(new URL('../laws/review-queue.json',import.meta.url),JSON.stringify(report.queue,null,2)+'\n','utf8'),
    writeFile(new URL('../laws/COVERAGE.md',import.meta.url),markdown,'utf8')
  ]);
  return report;
}
