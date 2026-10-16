# Extindere rev20

Au fost adăugate 295 de asocieri individuale între situație, decizie corectă și
pasaje oficiale românești. Trei asocieri existente (44, 217, 218) au fost
reverificate pentru 2026/27. La 44 s-a corectat și justificarea: schimbarea
locurilor cu portarul la pauză nu produce CG; incidentul este raportat.

## Acoperire după generare

- 788 de înregistrări, reprezentând 595 de situații distincte.
- 689 de înregistrări / 525 de situații verificate pentru 2026/27.
- 3 înregistrări / 2 situații cu asociere păstrată pe 2025/26 (45/503 și 50).
- 96 de înregistrări / 68 de situații încă fără asociere.

În total sunt disponibile explicații pentru 692 de înregistrări / 527 de
situații. Acoperirea nu este completă și nu înseamnă că întreaga bancă este
certificată pentru ediția actuală. Cheile răspunsurilor și banca românească
sursă nu au fost modificate în această extindere; corecția anterioară 298 rămâne.

## Citate și verificări

`expansion-rev20.json` păstrează cele 295 de asocieri, identitățile exacte și
motivul editorial pentru fiecare. `references.json` este configurația
reproductibilă; extractorul existent produce `dist/laws-ro.json` din PDF-ul
românesc verificat prin SHA-256 și din transcrierile oficiale înregistrate.

Au fost adăugate 80 de fragmente din PDF, păstrând cuvintele originale;
normalizarea elimină doar întreruperile de rând. Verificarea ediției actuale
nu schimbă ediția reală a sursei românești. Pasajele și highlight-urile au fost
alese pe componentele deciziei, nu prin asociere automată de cuvinte-cheie.
Modalul păstrează afișarea simplificată: ediție, lege și capitol, fără pagini
sau metadate tehnice.

## Restul situațiilor

`pending-rev20.json` documentează toate cele 70 de situații rămase pentru
revizuire, inclusiv duplicatele lor. Nu toate sunt blocaje și nu toate sunt
răspunsuri greșite:

- 22 necesită asocierea mai precisă a surselor pe toate componentele deciziei;
- 17 necesită verificarea interpretării specifice, nu o regulă generică;
- 6 au formulări de corectat;
- 12 au context incomplet sau insuficient de precis;
- 11 necesită pasajul românesc actual, în special pentru avantaj la reluări,
  VAR și localizarea mingii de arbitru după contactul cu arbitrul;
- 2 necesită reverificarea răspunsului față de noul protocol medical sau
  numărarea inversă la aruncare.

Exemple de urmărit prioritar: 50 (identitatea persoanei care intervine),
535/551 (poziția brațului), 523 (întârzierea aruncării), 241/463/592
(formulări corupte). Nu au fost schimbate tacit răspunsurile și nu au fost
inventate traduceri pentru a completa acoperirea. Lista editorială nu elimină
automat aceste întrebări din sesiunile obișnuite.

## Verificare locală

```powershell
python tools/extract-laws-ro.py "PATH_TO_ROMANIAN_PDF"
npm run build
npm test
```

Testele rev20 verifică identitățile, duplicatele, amestecarea variantelor,
highlight-urile literale, diferențierea actorilor și sancțiunilor, domeniul
explicit al verificărilor de protocol și păstrarea cazurilor încă nevalidate.
Nu s-a făcut commit, push sau publicare din această extindere.
