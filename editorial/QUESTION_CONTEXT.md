# Completarea contextului — primul lot

32 de situații distincte au fost confruntate cu întrebarea și răspunsul din
snapshot-ul FAQ englez. Completările sunt propagate în 42 de înregistrări,
inclusiv duplicatele. Nu s-au schimbat variantele sau literele răspunsurilor.
Restul băncii nu este declarat verificat semantic printr-o verificare numerică.

`question-revisions.json` păstrează enunțurile înainte/după, decizia corectă,
originalul englez al întrebării și răspunsului și motivul completării.

Exemple de condiții restabilite:

- ID 30/453/702: apărătorul A ieșit pentru îngrijiri, atacantul B care șutează pe
  lângă portarul A, degajarea care împiedică golul în propria poartă.
- ID 574: intervenția asupra jocului sau a unui adversar B care împiedică ocazia
  clară de gol a lui B. Nu se inventează un tip de fault absent din sursă.
- ID 121: personalul medical stabilește că jucătorul nu mai trebuie să continue,
  înainte ca arbitrul să autorizeze intrarea brancardierilor.
- ID 217: niciun jucător nu mai poate atinge mingea înainte să iasă din teren.
- ID 559: atacant la patru metri de poarta goală, care nu mai joacă mingea de
  teama unei accidentări; nu doar eticheta abstractă DOGSO.
- ID 639: mingea nu atinge alt jucător între bară și a doua atingere a executantului.
- ID 90: întrebarea originală privește rămânerea pe teren după evaluare, nu
  obligația sau dorința jucătorului de a executa personal lovitura liberă.

Asocierile existente cu legile au fost confruntate cu enunțurile completate și
actualizate ca identitate; citatele, highlight-urile și edițiile au rămas aceleași.
Nu sunt adăugate automat surse noi și nu sunt certificate retroactiv alte ediții.

La încărcarea unei sesiuni salvate, întâi se aplică revizia variantelor deja
existentă, apoi completarea enunțului. Actualizarea este legată de ID, textul
vechi și decizia corectă, nu de litera amestecată. Răspunsurile, scorul, ordinea,
poziția curentă și termenul examenului se păstrează. Formulările necunoscute sau
deciziile diferite nu sunt rescrise prin presupunere.

`npm run questions:audit` verifică alinierea tuturor celor 788 de rânduri cu
snapshot-ul englez și produce o coadă de priorități în `question-context-audit.json`.
Semnalele de compresie și lipsa etichetelor de echipă indică locuri de citit,
nu dovedesc singure o eroare. Comanda necesită snapshot-ul local din folderul
părinte și nu rulează în build-ul Netlify.
