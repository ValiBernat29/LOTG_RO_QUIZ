import {readFile} from 'node:fs/promises';
import {writeLawAudit} from './law-audit.mjs';
const read = async path => JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const report=await writeLawAudit(await read('../dist/questions.json'),await read('../dist/laws-ro.json'),await read('../laws/references.json'));
console.log(JSON.stringify(report.summary,null,2));
