# Corecturi de regulament, distincte de revizia exprimării

Ediție de referință: 2026/27. Sursele, starea înainte/după și motivul sunt păstrate
în `rule-corrections.json`. ID 298 este prima corectură semantică explicită:
cheia B a devenit A, iar varianta A precizează lipsa sancțiunii disciplinare.

## ID 298

- Nu există abatere de ofsaid după jucarea deliberată a adversarului cu mâna:
  pasajul oficial românesc 11.2, pagina 108.
- Nu se acordă CG pentru DOGSO după avantaj și gol valid: rezumatul oficial
  românesc 2026/27, pagina tipărită 177 (pagina 9 a scanării corecte).
- Confirmare: [FAQ IFAB, Legea 11](https://www.theifab.com/laws/latest/offside/)
  și [Legea 12, avantaj](https://www.theifab.com/laws/latest/fouls-and-misconduct/),
  verificate la 16 octombrie 2026.

Problema a fost mutată din `reviewIssues` în `resolvedIssues`; explicația are
pasaje separate pentru validarea din perspectiva ofsaidului și pentru sancțiune.
Rezumatul nu este prezentat drept text integral al articolului 12.4.

## Sesiuni și istoricul scorurilor

Ordinea migrării: ortografie → variante editoriale → enunț complet → corectură
de regulament. Recunoașterea folosește ID-ul, enunțul și toate variantele vechi,
nu litera amestecată. Se păstrează alegerea utilizatorului, ordinea variantelor,
poziția curentă, marcajele și termenul examenului. Se actualizează cheia și copia
textului corect, cu un marcaj `ruleCorrection` pe întrebarea migrată.

Scorul unei sesiuni active sau al ultimei sesiuni complete, la revizuire, este
calculat cu cheia nouă. Dacă utilizatorul alesese vechiul distractor considerat
corect, acesta devine greșit; dacă alesese varianta fără sancțiune, devine corect.
Istoricul agregat fără întrebări și alegeri NU se recalculează prin presupunere:
păstrează scorul istoric. O versiune necunoscută a întrebării nu este rescrisă.

## Reverificare sistematică

`npm run rules:audit` citește toate cele 788 de înregistrări. Raportul
`../laws/RULE_CHANGES.md` și registrul `../laws/rule-change-review.json` separă:

- corecturi confirmate;
- cazuri verificate individual și păstrate;
- semnale tematice care necesită lectură, fără a fi declarate erori.

`rule-reviews.json` documentează primul lot individual privind DOGSO și avantajul.
Se păstrează CG pentru imprudență și CR pentru fault grosolan/comportament violent,
precum și CG pentru DOGSO când avantajul nu se concretizează printr-un gol valid.
Restul temelor (atingeri duble, cronometrare, îngrijiri, accesorii, minge de arbitru,
VAR) nu sunt certificate prin simpla prezență a unor termeni în enunț.

Pentru o corectură viitoare: verificați sursa și toate componentele deciziei,
înregistrați starea înainte/după, actualizați asocierile și ancora editorială
curentă, adăugați un test pentru variantele amestecate și regenerați biblioteca.
Nu se modifică o cheie global pe baza expresiei «avantaj» sau «gol».
