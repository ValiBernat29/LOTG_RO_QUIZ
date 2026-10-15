import { cleanRomanianText, prepareQuestions } from './quiz.js';

const compact = text => cleanRomanianText(text).replace(/\s+/gu, ' ').trim();
const key = (question, correct) => JSON.stringify([compact(question), compact(correct)]);
const escape = text => String(text).replace(/[&<>"']/gu, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function explainableQuestion(view, session, result, id) {
  if (view === 'result') return result?.questions.find(q => q.id === id) ?? null;
  if (view !== 'quiz' || session?.mode !== 'practice') return null;
  const q = session.questions[session.index];
  return q?.id === id && session.answers[q.id] ? q : null;
}

// Match the actual question and correct decision, never the shuffled letter,
// source law, or a keyword score. Unreviewed scenarios deliberately have no match.
export function findLawReference(library, question) {
  const wanted = key(question.questionRo, question.options[question.correctOption]);
  const reference = library.references.find(item => key(item.questionRo, item.correctText) === wanted);
  if (!reference) return null;
  return reference.excerpts.map(id => library.excerpts.find(item => item.id === id));
}

export function preparePilotQuestions(library, questions, random = Math.random) {
  const reviewed = questions.filter(question => findLawReference(library, question));
  return prepareQuestions(reviewed, reviewed.length, random);
}

export function validateLawLibrary(library) {
  if (!library || library.schemaVersion !== 1 || library.edition !== '2025/26' ||
      typeof library.sourceTitle !== 'string' || !/^[a-f0-9]{64}$/u.test(library.sourceSha256) ||
      !Array.isArray(library.excerpts) || !Array.isArray(library.references)) throw new Error('Invalid law library');
  const ids = new Set(), keys = new Set();
  for (const item of library.excerpts) {
    if (!item.id || ids.has(item.id) || !Number.isInteger(item.law) || item.law < 1 || item.law > 17 ||
        !Number.isInteger(item.page) || item.page < 1 || typeof item.article !== 'string' ||
        !item.article.startsWith(item.law + '.') || typeof item.title !== 'string' ||
        typeof item.text !== 'string' || !item.text.trim() || typeof item.highlight !== 'string' ||
        !item.highlight || !item.text.includes(item.highlight)) throw new Error('Invalid source excerpt');
    ids.add(item.id);
  }
  for (const reference of library.references) {
    if (!Number.isInteger(reference.seedId) || typeof reference.questionRo !== 'string' ||
        typeof reference.correctText !== 'string' || !Array.isArray(reference.excerpts) ||
        !reference.excerpts.length || reference.excerpts.some(id => !ids.has(id))) throw new Error('Invalid reference');
    const identity = key(reference.questionRo, reference.correctText);
    if (keys.has(identity)) throw new Error('Duplicate reference');
    keys.add(identity);
  }
  return library;
}

export function createLawLoader(fetcher = (...args) => fetch(...args)) {
  let pending;
  return () => {
    if (!pending) pending = (async () => {
      const response = await fetcher('./laws-ro.json');
      if (!response.ok) throw new Error('Law library unavailable');
      return validateLawLibrary(await response.json());
    })().catch(error => { pending = null; throw error; });
    return pending;
  };
}

function sourceText(item) {
  const index = item.text.indexOf(item.highlight);
  const before = item.text.slice(0, index), after = item.text.slice(index + item.highlight.length);
  // PDF soft line wraps were folded during extraction. Restore readable bullet
  // boundaries without changing any words from the source.
  const format = text => escape(text).replace(/ • /gu, '<br>• ');
  return `${format(before)}<mark>${format(item.highlight)}</mark>${format(after)}`;
}

export function renderLawExplanation(library, question) {
  const excerpts = findLawReference(library, question);
  if (!excerpts) return `<p class="law-source">${escape(library.sourceTitle)}</p>
    <div class="law-pending"><strong>Pasaj încă neasociat</strong><p>Pentru această întrebare nu există încă o asociere verificată cu un articol din ediția română. Nu afișăm un pasaj ales automat.</p></div>`;
  return `<p class="law-source">${escape(library.sourceTitle)}</p>
    <p class="law-intro">Prevederi relevante pentru decizia corectă. Textul evidențiat este extras din regulament.</p>
    ${excerpts.map(item => `<section class="law-excerpt"><div class="law-citation">Legea ${item.law} · Art. ${escape(item.article)} · Pagina ${item.page}</div>
      <h3>${escape(item.title)}</h3><blockquote>${sourceText(item)}</blockquote></section>`).join('')}`;
}
