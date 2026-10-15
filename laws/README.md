# Pasaje din Legile Jocului în română — pilot

Lucrul este separat pe branch-ul `development`. Nu publicați pe `main` înainte
de verificarea vizuală și revizuirea asocierilor.

## Ce face versiunea inițială

- Înlocuiește linkurile IFAB din feedback și din revizuirea rezultatelor cu un modal.
- Folosește text extras literal din PDF-ul românesc 2025/26, cu articol și pagina
  numerotată din document. Ruperile de rând sunt reunite pentru lizibilitate.
- Include 19 scenarii asociate manual cu 13 pasaje; aceeași asociere se aplică
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
2. Adăugați în `references.json` pasajul (pagina, ancore de început/sfârșit,
   citat de evidențiat) și ID-ul întrebării verificate.
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
