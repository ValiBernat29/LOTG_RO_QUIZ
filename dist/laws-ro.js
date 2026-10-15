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
  return reference.passages.map(passage => ({
    ...library.excerpts.find(item => item.id === passage.id),
    highlights: passage.highlights, justifies: passage.justifies
  }));
}

export function preparePilotQuestions(library, questions, random = Math.random) {
  const reviewed = questions.filter(question => findLawReference(library, question));
  return prepareQuestions(reviewed, reviewed.length, random);
}

export function validateLawLibrary(library) {
  if (!library || library.schemaVersion !== 2 || library.edition !== '2025/26' ||
      typeof library.sourceTitle !== 'string' || typeof library.revisionLabel !== 'string' ||
      !library.revisionLabel.trim() || !/^[a-f0-9]{64}$/u.test(library.sourceSha256) ||
      !Array.isArray(library.excerpts) || !Array.isArray(library.references)) throw new Error('Invalid law library');
  const ids = new Set(), keys = new Set();
  for (const item of library.excerpts) {
    if (!item.id || ids.has(item.id) || !Number.isInteger(item.law) || item.law < 1 || item.law > 17 ||
        !Number.isInteger(item.page) || item.page < 1 || typeof item.article !== 'string' ||
        !(item.article === 'Introducere' || item.article.startsWith(item.law + '.')) || typeof item.title !== 'string' ||
        typeof item.text !== 'string' || !item.text.trim()) throw new Error('Invalid source excerpt');
    ids.add(item.id);
  }
  for (const reference of library.references) {
    if (!Number.isInteger(reference.seedId) || typeof reference.questionRo !== 'string' ||
        typeof reference.correctText !== 'string' || !Array.isArray(reference.passages) ||
        !reference.passages.length) throw new Error('Invalid reference');
    for (const passage of reference.passages) {
      if (!passage || !ids.has(passage.id) || typeof passage.justifies !== 'string' ||
          !passage.justifies.trim()) throw new Error('Missing answer justification');
      const source = library.excerpts.find(item => item.id === passage.id);
      highlightRanges(source.text, passage.highlights);
    }
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
      const response = await fetcher('./laws-ro.json', {cache:'no-cache'});
      if (!response.ok) throw new Error('Law library unavailable');
      return validateLawLibrary(await response.json());
    })().catch(error => { pending = null; throw error; });
    return pending;
  };
}

function highlightRanges(text, highlights) {
  if (!Array.isArray(highlights) || !highlights.length) throw new Error('Missing question-specific highlights');
  const ranges = highlights.map(quote => {
    if (typeof quote !== 'string' || !quote.trim()) throw new Error('Invalid highlight');
    const start = text.indexOf(quote);
    if (start < 0 || text.indexOf(quote, start + 1) >= 0) throw new Error('Highlight must match one literal source passage');
    return {start, end: start + quote.length};
  }).sort((a,b) => a.start - b.start);
  if (ranges.some((range,index) => index > 0 && range.start < ranges[index-1].end)) throw new Error('Overlapping highlights');
  return ranges;
}

function sourceText(item) {
  // PDF soft line wraps were folded during extraction. Restore readable bullet
  // boundaries without changing any words from the source.
  const format = text => escape(text).replace(/ • /gu, '<br>• ');
  let cursor = 0, html = '';
  for (const range of highlightRanges(item.text, item.highlights)) {
    html += format(item.text.slice(cursor, range.start)) + '<mark>' + format(item.text.slice(range.start, range.end)) + '</mark>';
    cursor = range.end;
  }
  return html + format(item.text.slice(cursor));
}

export function renderLawExplanation(library, question) {
  const excerpts = findLawReference(library, question);
  const source = `<p class="law-source">${escape(library.sourceTitle)}<br>${escape(library.revisionLabel)}</p>`;
  if (!excerpts) return `${source}
    <div class="law-pending"><strong>Pasaj încă neasociat</strong><p>Pentru această întrebare nu există încă o asociere verificată cu un articol din ediția română. Nu afișăm un pasaj ales automat.</p></div>`;
  return `${source}
    <div class="law-decision"><strong>Decizia justificată</strong><p>${escape(question.options[question.correctOption])}</p></div>
    <p class="law-intro">Fiecare pasaj justifică o componentă a răspunsului corect. Evidențierile sunt alese pentru această situație.</p>
    ${excerpts.map(item => `<section class="law-excerpt"><p class="law-justifies">Justifică: ${escape(item.justifies)}</p><div class="law-citation">Legea ${item.law} · ${item.article === 'Introducere' ? 'Prevederea introductivă' : 'Art. ' + escape(item.article)} · Pagina ${item.page}</div>
      <h3>${escape(item.title)}</h3><blockquote>${sourceText(item)}</blockquote></section>`).join('')}`;
}
