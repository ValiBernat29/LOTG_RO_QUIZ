import { readFile, writeFile } from 'node:fs/promises';
const input = new URL('../lotg_ro_questions.json', import.meta.url);
const questions = JSON.parse((await readFile(input, 'utf8')).replace(/^\uFEFF/, ''));
const ids = new Set();
for (const q of questions) {
  if (!Number.isInteger(q.id) || ids.has(q.id) || !q.questionRo || !q.options ||
      Object.keys(q.options).join('') !== 'ABCD' || !q.options[q.correctOption] ||
      q.lawNumber < 1 || q.lawNumber > 17) throw new Error(`Întrebare invalidă: ${q.id}`);
  ids.add(q.id);
}
await writeFile(new URL('dist/questions.json', import.meta.url), JSON.stringify(questions), 'utf8');
console.log(`Pregătite ${questions.length} întrebări pentru quiz.`);
