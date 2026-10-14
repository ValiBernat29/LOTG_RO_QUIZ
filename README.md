# LOTG · Academia arbitrului

Interfață web în română, alimentată din `../lotg_ro_questions.json`.

- Antrenament cu corectare imediată sau simulare de examen cu corectare la final.
- Simulare: 30 de minute pentru 20 de întrebări (15 pentru 10; 60 pentru 40).
- Alegerea uneia sau mai multor legi; 10, 20, 40 sau toate situațiile disponibile.
- Ordine aleatorie pentru întrebări și variante; cheia corectă este recalculată.
- Situațiile identice apar o singură dată în fiecare sesiune.
- Navigare, marcare pentru revizuire, scor și reluarea întrebărilor greșite.
- Sesiunea activă și ultimele 50 de rezultate sunt salvate în browser, fără cont.

## Pornire locală

Din acest director, cu Node.js instalat:

```powershell
npm run build
npm run dev
```

Deschide `http://127.0.0.1:5173`. Fișierele nu se deschid direct prin dublu clic:
încărcarea băncii de întrebări necesită un server HTTP.

După modificarea întrebărilor românești, repetă `npm run build`. Acesta verifică
structura și actualizează `dist/questions.json`. Interfața este statică și poate
fi servită ulterior și de un proiect ASP.NET Core. Scraperul și seeding-ul
proiectului C# existent rămân fluxuri separate.

## Verificare

```powershell
npm test
```

## Publicare pe Netlify prin Git

Repository-ul începe în acest director (`quiz-web`). Fișierul `netlify.toml`
configurează automat construirea cu `node build.mjs` și publicarea folderului
`dist`. În setările Netlify, Base directory poate rămâne gol; Publish directory
este `dist`, nu `quiz-web/dist`.

Încarcă în Git atât configurația, cât și întregul folder `dist`, inclusiv
`questions.json`. La construirea pe Netlify, scriptul folosește banca din `dist`
dacă fișierul românesc din folderul părinte nu există. Pentru a actualiza
întrebările, rulează local `npm run build`, apoi include în commit fișierul
`dist/questions.json` actualizat.

Testele verifică păstrarea răspunsului corect la amestecarea variantelor,
filtrarea pe legi, eliminarea repetărilor din sesiune, scorul pentru întrebări
necompletate și restricționarea linkurilor către IFAB.

Banca folosește răspunsurile din snapshot-ul FAQ englez, care poate include
proceduri dintr-o ediție diferită de PDF-ul românesc 2025/26. Interfața nu
etichetează toate întrebările ca aparținând ediției 2025/26 și nu este un produs
oficial IFAB sau CCA.
