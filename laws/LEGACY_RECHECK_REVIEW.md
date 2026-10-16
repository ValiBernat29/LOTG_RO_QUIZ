# Reverificarea asocierilor existente — rev14

Publicarea solicitată anterior a fost anulată de utilizator. Cardul pilot,
butoanele și interfața rămân neschimbate; lucrul continuă local pe `development`.
Nu s-au făcut commit, push sau deploy în acest lot.

## Ce s-a verificat

16 asocieri existente au fost comparate individual cu ediția IFAB 2026/27:
9, 10, 96, 146, 201, 272, 221, 223, 224, 225, 1, 2, 5, 6, 7 și 23.
Acestea trec de la `reviewedEdition: 2025/26` la `2026/27`, cu o verificare
explicită în `legacy-compatibility-2026-27-review`. Pasajele, evidențierile,
enunțurile și răspunsurile sunt păstrate. Ediția sursei românești rămâne 2025/26.

Temele includ mingea deteriorată și beneficiarul mingii de arbitru, avantajul
neconcretizat, protestul, oficialul neidentificat, abaterea după ieșirea mingii,
linia suprafeței de pedeapsă, intrarea în RRA, bara ruptă și schimbarea locului
cu portarul fără permisiune. Nu se extinde verificarea asupra întrebărilor
despre atingerea accidentală, avantaj la o reluare incorectă sau noua sferă VAR.

ID 766 primește o asociere nouă, din pasaje existente: lovitura de poartă este
păstrată deoarece împingerea s-a produs după ieșirea mingii; CG pentru
imprudență este justificat separat. Lista `boundary-restarts-pending.json`
mută acest caz în `resolvedCases`, păstrând istoricul.

## Verificare online

Registrul citează paginile IFAB consultate la 16 octombrie 2026, în special:

- [Legea 1 și FAQ](https://www.theifab.com/laws/latest/the-field-of-play/)
- [Legea 2](https://www.theifab.com/laws/latest/the-ball/)
- [Legea 3](https://www.theifab.com/laws/latest/the-players/)
- [Legea 5](https://www.theifab.com/laws/latest/the-referee/)
- [Legea 8 și FAQ](https://www.theifab.com/laws/latest/the-start-and-restart-of-play/)
- [Legea 9](https://www.theifab.com/laws/latest/the-ball-in-and-out-of-play/)
- [Legea 12 și FAQ](https://www.theifab.com/laws/latest/fouls-and-misconduct/)
- [Legea 14](https://www.theifab.com/laws/latest/the-penalty-kick/)
- [Legea 16 și FAQ](https://www.theifab.com/laws/latest/the-goal-kick/)
- [Legea 17 și FAQ](https://www.theifab.com/laws/latest/the-corner-kick/)

Nu sunt extrase fragmente PDF noi sau create traduceri. Sunt reutilizate
citatele românești deja validate; biblioteca și definițiile rămân sincronizate.

## Rezultat

- 310/788 de înregistrări au explicații: 232 de situații distincte.
- 225 de înregistrări / 176 de situații sunt verificate pentru 2026/27.
- 85 de înregistrări / 56 de situații rămân verificate numai pe 2025/26.
- 35 de înregistrări beneficiază de noua verificare: 33 deja asociate și
  două înregistrări ale situației nou asociate.
- 93 de teste trecute și build reușit; fără o nouă verificare în browser.
- Audit tematic: o corectură anterioară, 119 situații verificate și păstrate,
  153 de semnale de lectură, nu erori confirmate.
- ID 631 rămâne în așteptarea justificării românești specifice. ID 298 rămâne A.
