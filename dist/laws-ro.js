import { cleanRomanianText, prepareQuestions, safeSource } from './quiz.js';

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
    highlights: passage.highlights, justifies: passage.justifies, reviewedEdition:reference.reviewedEdition,
    ...(reference.editionCheckId ? {editionCheck: library.editionChecks?.find(check=>check.id===reference.editionCheckId)} : {})
  }));
}

export function preparePilotQuestions(library, questions, random = Math.random, edition = null) {
  const reviewed = questions.filter(question => {
    const passages=findLawReference(library,question);
    return passages && (!edition || passages[0].reviewedEdition===edition);
  });
  return prepareQuestions(reviewed, reviewed.length, random);
}

export function validateLawLibrary(library) {
  if (!library || library.schemaVersion !== 3 || library.edition !== '2025/26' || library.targetEdition !== '2026/27' ||
      typeof library.sourceTitle !== 'string' || typeof library.revisionLabel !== 'string' ||
      !library.revisionLabel.trim() || !/^[a-f0-9]{64}$/u.test(library.sourceSha256) ||
      !Array.isArray(library.excerpts) || !Array.isArray(library.references)) throw new Error('Invalid law library');
  const ids = new Set(), keys = new Set();
  const checks = new Map();
  for (const check of library.editionChecks ?? []) {
    if (!check.id || checks.has(check.id) || check.edition!==library.targetEdition || !safeSource(check.url) ||
        !/^\d{4}-\d{2}-\d{2}$/u.test(check.checkedAt) || !Array.isArray(check.laws) || !check.laws.length ||
        check.laws.some(law=>!Number.isInteger(law)||law<1||law>17) ||
        !Array.isArray(check.sections) || !check.sections.length ||
        check.sections.some(section=>typeof section!=='string'||!/^\d+\.(?:\d+|Introducere|Rezumat|Protocol|Instrucțiuni practice)$/u.test(section)||!check.laws.includes(Number(section.split('.')[0]))) ||
        typeof check.note!=='string' || !check.note.trim()) {
      throw new Error('Invalid edition verification');
    }
    checks.set(check.id,check);
  }
  for (const item of library.excerpts) {
    if (!item.id || ids.has(item.id) || !Number.isInteger(item.law) || item.law < 1 || item.law > 17 ||
        typeof item.article !== 'string' ||
        !(['Introducere','Instrucțiuni practice','Protocol','Rezumat'].includes(item.article) || item.article.startsWith(item.law + '.')) || typeof item.title !== 'string' ||
        typeof item.text !== 'string' || !item.text.trim()) throw new Error('Invalid source excerpt');
    const source=item.source;
    if (!source || typeof source.title!=='string') throw new Error('Missing source provenance');
    if (source.kind==='official-ro-pdf') {
      if (!Number.isInteger(item.page) || item.page<1 ||
          (item.endPage!=null&&(!Number.isInteger(item.endPage)||item.endPage!==item.page+1)) ||
          source.edition!=='2025/26' || source.language!=='ro' ||
          source.translation!=='official' || source.sha256!==library.sourceSha256) throw new Error('Invalid PDF provenance');
    } else if (source.kind==='official-ro-scan') {
      const registered=(library.supplementalSources ?? []).find(s=>s.sha256===source.sha256);
      if (!registered || registered.file!==source.file || registered.edition!==source.edition ||
          !/^[a-f0-9]{64}$/u.test(source.sha256) || source.edition!=='2026/27' ||
          source.language!=='ro' || source.translation!=='official' || source.transcription!=='manual-visual' ||
          !Number.isInteger(item.page) || item.page<1 || !Array.isArray(source.scanPages) ||
          !source.scanPages.length || source.scanPages.some(p=>!Number.isInteger(p)||p<1||p>10) ||
          new Set(source.scanPages).size!==source.scanPages.length ||
          !['protocol','summary'].includes(source.section) ||
          item.article!==(source.section==='protocol'?'Protocol':'Rezumat') ||
          !/^\d{4}-\d{2}-\d{2}$/u.test(source.checkedAt)) throw new Error('Invalid scanned source provenance');
    } else if (source.kind==='official-ro-photo') {
      const registered=(library.photoSources ?? []).find(s=>s.id===source.id);
      if (!registered || JSON.stringify(registered)!==JSON.stringify(source) ||
          source.edition!=='2026/27' || source.language!=='ro' || source.translation!=='official' ||
          source.transcription!=='manual-visual' || !source.title.trim() ||
          !Number.isInteger(item.page) || item.page<1 || source.printedPage!==item.page ||
          source.law!==item.law || source.article!==item.article ||
          typeof source.attachmentDescription!=='string' || !source.attachmentDescription.trim() ||
          source.sha256!=null || source.file!=null || source.url!=null ||
          !/^\d{4}-\d{2}-\d{2}$/u.test(source.providedAt)) throw new Error('Invalid photographed source provenance');
    } else if (source.kind==='ifab-web') {
      if (item.page != null || source.edition!=='2026/27' || source.language!=='en' ||
          source.translation!=='own-ro' || !safeSource(source.url) || !/^\d{4}-\d{2}-\d{2}$/u.test(source.checkedAt)) throw new Error('Invalid translated source provenance');
    } else throw new Error('Unknown source kind');
    ids.add(item.id);
  }
  for (const reference of library.references) {
    if (!Number.isInteger(reference.seedId) || !['2025/26','2026/27'].includes(reference.reviewedEdition) || typeof reference.questionRo !== 'string' ||
        typeof reference.correctText !== 'string' || !Array.isArray(reference.passages) ||
        !reference.passages.length) throw new Error('Invalid reference');
    const check=reference.editionCheckId ? checks.get(reference.editionCheckId) : null;
    if (reference.editionCheckId && (!check || check.edition!==reference.reviewedEdition)) throw new Error('Missing edition verification');
    for (const passage of reference.passages) {
      if (!passage || !ids.has(passage.id) || typeof passage.justifies !== 'string' ||
          !passage.justifies.trim()) throw new Error('Missing answer justification');
      const source = library.excerpts.find(item => item.id === passage.id);
      const section=['Introducere','Rezumat','Protocol','Instrucțiuni practice'].includes(source.article)?`${source.law}.${source.article}`:source.article;
      if (check && (!check.laws.includes(source.law)||!check.sections.includes(section))) throw new Error('Edition verification does not cover this article');
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

function citation(item) {
  const article=item.article==='Introducere'?'Prevederea introductivă':
    ['Instrucțiuni practice','Protocol','Rezumat'].includes(item.article)?escape(item.article):'Art. '+escape(item.article);
  return `Legea ${item.law} · ${article}`;
}

export function renderLawExplanation(library, question) {
  const excerpts = findLawReference(library, question);
  // Keep technical provenance in the validated library, not in the quiz UI.
  // An association not yet rechecked for the target edition retains its own edition.
  const source = `<p class="law-source">Ediția de referință: ${escape(excerpts?.[0].reviewedEdition ?? library.targetEdition)}</p>`;
  if (!excerpts) return `${source}
    <div class="law-pending"><strong>Pasaj încă neasociat</strong><p>Pentru această întrebare nu există încă o asociere verificată cu o sursă. Nu afișăm un pasaj ales automat.</p></div>`;
  return `${source}
    <div class="law-decision"><strong>Decizia justificată</strong><p>${escape(question.options[question.correctOption])}</p></div>
    ${excerpts.map(item => `<section class="law-excerpt"><p class="law-justifies">Justifică: ${escape(item.justifies)}</p><div class="law-citation">${citation(item)}</div>
      <h3>${escape(item.title)}</h3><blockquote>${sourceText(item)}</blockquote></section>`).join('')}`;
}
