# Integrarea scanării românești 2026/27 — primul lot

Sursă: `CamScanner 16-10-2026 11.31 (1).pdf`, 10 pagini, primită de la utilizator.
Amprentă SHA-256: `661c83943ad4e57445696c0e73cf46c3a27ec067b1c806695ceffa29baa3cd3a`.
Documentul anterior, fără `(1)`, nu este folosit.

Transcrierile din `official-ro-2026-27.json` au fost citite și confruntate vizual
cu paginile scanate. Sunt păstrate cuvintele și punctuația; numai rândurile sunt
reunite și marcatorii de listă uniformizați. Sunt selectate puncte complete din
protocoale, nu se pretinde transcrierea integrală a volumului.

| Pagini tipărite | Poziții în scanare | Utilizare |
| --- | --- | --- |
| 24–25 | 1–2 | Înlocuire în zece secunde, intrare după un minut, condiția CG |
| 27 | 4 | Revenire după îngrijiri și excepții |
| 28–29 | 5–6 | Numărătoare inversă, schimbarea reluării, condiția CG |
| 175 | 7 | Accesorii — numai rezumatul oficial |

În modal sunt afișate separat pagina tipărită și poziția în scanare. Protocoalele
nu primesc numere de articol inventate, iar rezumatul este etichetat explicit
ca rezumat, nu text integral al articolului.

## Asocieri

- ID 12 și 13 (inclusiv 350): înlocuite traducerile proprii cu protocolul românesc.
- ID 60 și 61: rezumat oficial pentru condițiile accesoriilor. Detaliul FAQ privind
  ieșirea jucătorului cu cercei rămâne sursă engleză cu traducere proprie explicită.
- ID 332/762, 333/738, 334/739 și 763: explicații noi cu reluarea corectă și,
  când răspunsul o cere, condiția distinctă a avertismentului.
- ID 83, 90 și 143: explicații noi pentru excepțiile privind îngrijirile.

Pilotul „Testează noutățile 2026/27” cuprinde acum 12 situații distincte (16
înregistrări în bancă). Totalul explicațiilor disponibile este 84 de situații /
134 de înregistrări; celelalte 72 de situații rămân reverificate doar pe 2025/26.

## Limite și următorul lot

- Inspecția terenului (ID 3) nu apare în scanare; traducerea proprie existentă
  rămâne identificată corect, nu este redenumită text oficial.
- Rezumatul accesoriilor nu este un substitut pentru articolul integral 4.1 și
  pentru răspunsul FAQ despre cercei. Nu se adaugă cuvinte din engleză în citatul
  oficial și nu se atribuie rezumatului procedura de ieșire de pe teren.
- Paginile tipărite 26 și 178 au rânduri tăiate; nu completăm cuvintele lipsă.
- ID 84 și 85/170 cer o analiză separată a diferenței dintre un jucător care
  **pare** grav accidentat și excepția unei accidentări grave efective. Nu sunt
  asociate automat cu obligația de un minut, ignorând excepțiile de la pagina 27.
- Rezumatul de la pagina 177 are un titlu inconsecvent pentru Legea 15. Pentru
  aruncări se citează protocolul detaliat de la 28–29, nu acel titlu.
- Rezumatele privind VAR, DOGSO, mingea de arbitru și dubla atingere nu certifică
  automat toate întrebările corespunzătoare. Asocierea urmează decizia concretă,
  nu simpla prezență a unui termen în document.

Nu s-au schimbat enunțuri, variante, chei, scoruri sau durata examenului în acest
lot. Nu s-a publicat nimic pe Netlify. Verificarea UI este prin teste ale HTML-ului
generat, nu o verificare vizuală a modalului în browser.

## Întreținere

`npm run build` compară fragmentele scanate cu catalogul verificat. Extractorul
PDF 2025/26 păstrează aceste transcrieri în loc să încerce extragerea textului
dintr-o scanare fără strat OCR. `npm test` verifică proveniența, evidențierile,
rezumatele, duplicatele și amestecarea variantelor.
