import { readFile, writeFile } from 'node:fs/promises';
import { findLawReference, validateLawLibrary } from './dist/laws-ro.js';
const input = new URL('../lotg_ro_questions.json', import.meta.url);
const output = new URL('dist/questions.json', import.meta.url);
// Locally use the scraper's Romanian bank. On Netlify the repository starts
// at quiz-web, so use the validated question bank already committed in dist.
let json;
try {
  json = await readFile(input, 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  json = await readFile(output, 'utf8');
}
const questions = JSON.parse(json.replace(/^\uFEFF/, ''));
const ids = new Set();
for (const q of questions) {
  if (!Number.isInteger(q.id) || ids.has(q.id) || !q.questionRo || !q.options ||
      Object.keys(q.options).join('') !== 'ABCD' || !q.options[q.correctOption] ||
      q.lawNumber < 1 || q.lawNumber > 17) throw new Error(`Întrebare invalidă: ${q.id}`);
  ids.add(q.id);
}
const library = validateLawLibrary(JSON.parse(await readFile(new URL('dist/laws-ro.json', import.meta.url), 'utf8')));
for (const reference of library.references) {
  const seed = questions.find(q => q.id === reference.seedId);
  if (!seed || !findLawReference({...library, references:[reference]}, seed)) {
    throw new Error(`Referință de reverificat după modificarea întrebării ${reference.seedId}`);
  }
}
await writeFile(output, JSON.stringify(questions), 'utf8');
console.log(`Pregătite ${questions.length} întrebări pentru quiz.`);
console.log(`Pasaje în română: ${questions.filter(q => findLawReference(library, q)).length}/${questions.length} întrebări cu asociere verificată.`);
