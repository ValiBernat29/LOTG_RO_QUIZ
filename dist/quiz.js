export const LETTERS = ['A', 'B', 'C', 'D'];
export function examDurationMs(questionCount) {
  if (!Number.isInteger(questionCount) || questionCount < 1) throw new RangeError('Număr invalid de întrebări.');
  return questionCount * 90000; // 20 de întrebări = 30 de minute.
}
export const LAW_NAMES = {
  1: 'Terenul de joc', 2: 'Mingea', 3: 'Jucătorii', 4: 'Echipamentul jucătorilor',
  5: 'Arbitrul', 6: 'Alți oficiali de meci', 7: 'Durata meciului', 8: 'Începerea și reluarea jocului',
  9: 'Mingea în joc și afară din joc', 10: 'Stabilirea rezultatului meciului', 11: 'Ofsaidul',
  12: 'Faulturi și comportament nesportiv', 13: 'Loviturile libere', 14: 'Lovitura de pedeapsă',
  15: 'Aruncarea de la margine', 16: 'Lovitura de poartă', 17: 'Lovitura de colț'
};
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function uniqueQuestions(questions) {
  const seen = new Set();
  return questions.filter(q => {
    const key = `${q.questionRo.trim()}|${q.options[q.correctOption].trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
// Shuffle both the question order and the options: the source answer letters
// follow a predictable A-B-C-D cycle, which must not leak into the quiz.
export function prepareQuestions(questions, count, random = Math.random) {
  return shuffle(uniqueQuestions(questions), random).slice(0, count).map(q => {
    const original = shuffle(LETTERS, random);
    const correct = q.options[q.correctOption];
    return { ...q, options: Object.fromEntries(LETTERS.map((key, i) => [key, q.options[original[i]]])),
      correctOption: LETTERS[original.indexOf(q.correctOption)], correctText: correct };
  });
}
export function score(session) {
  const correct = session.questions.filter(q => session.answers[q.id] === q.correctOption).length;
  const answered = session.questions.filter(q => LETTERS.includes(session.answers[q.id])).length;
  return { correct, answered, total: session.questions.length, percent: Math.round(correct / session.questions.length * 100) };
}
export function safeSource(url) {
  try { const value = new URL(url); return value.protocol === 'https:' && value.hostname === 'www.theifab.com' ? value.href : null; }
  catch { return null; }
}
export function validSession(value) {
  return !!value && ['practice', 'exam'].includes(value.mode) && Array.isArray(value.questions) &&
    value.questions.length > 0 && value.questions.length <= 788 && value.questions.every(q =>
      Number.isInteger(q.id) && typeof q.questionRo === 'string' && q.options &&
      LETTERS.every(k => typeof q.options[k] === 'string') && LETTERS.includes(q.correctOption)) &&
    Number.isInteger(value.index) && value.index >= 0 && value.index < value.questions.length &&
    value.answers && typeof value.answers === 'object' && Number.isFinite(value.startedAt) &&
    (value.mode !== 'exam' || Number.isFinite(value.deadline));
}
export function repairSavedSession(value) {
  if (!validSession(value)) return value;
  const repair = text => text.replace(/acordatăă/giu, word => word.slice(0, -1))
    .replace(/(comportament) violentă/giu, '$1 violent')
    .replace(/(comportament) nesportivă/giu, '$1 nesportiv')
    .replace(/(înlocuitorul este) avertizată/giu, '$1 avertizat');
  return { ...value, questions: value.questions.map(q => ({ ...q,
    questionRo: repair(q.questionRo),
    options: Object.fromEntries(LETTERS.map(letter => [letter, repair(q.options[letter])]))
  })) };
}
