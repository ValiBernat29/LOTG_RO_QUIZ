# Pasaje din Legile Jocului în română — pilot

Lucrul este separat pe branch-ul `development`. Nu publicați pe `main` înainte
de verificarea vizuală și revizuirea asocierilor.

## Ce face versiunea inițială

- Înlocuiește linkurile IFAB din feedback și din revizuirea rezultatelor cu un modal.
- Folosește text extras literal din PDF-ul românesc 2025/26, cu articol și pagina
  numerotată din document. Ruperile de rând sunt reunite pentru lizibilitate.
- Include 19 scenarii asociate manual cu 20 de pasaje; aceeași asociere se aplică
  automat duplicatelor cu aceeași întrebare și aceeași decizie corectă.
- Nu folosește asemănarea cuvintelor-cheie ca dovadă. Pentru întrebări neacoperite,
  modalul afișează explicit „Pasaj încă neasociat”. Acoperirea nu este completă.
- În antrenament apare numai după verificare; în examen numai la rezultate.
- Nu modifică banca de întrebări sau sesiunile salvate.

Pentru probă: pe pagina principală apăsați „Testează întrebările pilot”. Pornește
un antrenament cu toate cele 19 situații distincte acoperite (38 de înregistrări
în bancă, înainte de eliminarea duplicatelor), indiferent de legile și numărul
de întrebări selectate în configurarea obișnuită. O sesiune existentă este
înlocuită numai după confirmare. După fiecare răspuns verificat puteți deschide
pasajul în română. Sunt incluse și cele trei situații raportate recent:
avantaj neconcretizat, protest gestual, oficial neidentificat.

## Adăugarea unor asocieri

1. Verificați întrebarea, decizia corectă și paginile integrale ale PDF-ului.
2. Adăugați în `references.json` pasajul (pagina, ancore de început/sfârșit)
   și ID-ul întrebării verificate. Pentru fiecare asociere, câmpul `passages`
   conține `id`, `justifies` și `highlights`: componenta deciziei justificată
   și citatele exacte de evidențiat pentru acea întrebare. Nu există evidențieri
   implicite comune tuturor utilizărilor aceluiași pasaj.
3. Din directorul proiectului web, rulați local:

   ```text
   python tools/extract-laws-ro.py "calea către PDF-ul românesc"
   npm run build
   npm test
   ```

4. Includeți în commit definițiile și `dist/laws-ro.json`. Fișierul generat conține
   amprenta SHA-256 a PDF-ului sursă, textul și identitatea întrebării/deciziei
   revizuite. PDF-ul și Python nu sunt necesare pe Netlify.

Build-ul respinge asocierile rămase neactualizate după schimbarea întrebării
sau a răspunsului corect. O nouă ediție a regulamentului necesită revizuire,
nu simpla schimbare a etichetei anului.

## Regula de relevanță

Selecția pornește prioritar de la componentele răspunsului corect, nu de la
cuvinte din întrebare. De exemplu, „lovitură de colț și CG” cere justificarea
reluării și a avertismentului: 12.5 păstrează reluarea deja stabilită, 12.4
justifică avertismentul pentru imprudență, iar prevederea introductivă a Legii 17
explică lovitura de colț. Paragraful despre mingea de arbitru sau acordarea unei
LLD pentru contact nu justifică această decizie și nu se include.

Contextul suplimentar apare numai dacă este necesar pentru a explica de ce
decizia se aplică (de exemplu, lipsa ofsaidului după primirea directă dintr-o
lovitură de poartă). Citatele sunt literale; etichetele „Justifică” sunt explicații
editoriale distincte de textul oficial. Schema datelor este versiunea 2.

În modal apare și eticheta revizuirii; versiunea curentă este „Revizuirea 3 ·
justificări pe răspuns”. Dacă vedeți încă paragrafele vechi, reîncărcați complet
pagina (Ctrl+F5). Sesiunile salvate se păstrează, iar formularea „Joc oprit” este
actualizată automat la „Oprește jocul” în variante și în copia deciziei corecte.
Pentru întrebările despre beneficiarul mingii de arbitru în afara suprafeței de
pedeapsă se evidențiază punctul complet (beneficiar, alternativa ultimei atingeri
și locul reluării); întrebarea care cere numai locul păstrează citatul punctual.
