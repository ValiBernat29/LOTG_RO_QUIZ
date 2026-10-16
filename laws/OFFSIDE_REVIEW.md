# Lotul ofsaid — rev7

Actualizare rev8: neconcordanța ID 298 descrisă mai jos a fost rezolvată, cu
acordul utilizatorului. Vezi `../editorial/RULE_CORRECTIONS.md`; starea curentă
este în `COVERAGE.md`. Restul acestui raport documentează lotul rev7.

57 de situații distincte au primit explicații noi, aplicate la 58 de înregistrări
din bancă. Nu s-au schimbat întrebările, variantele, cheia sau scorurile salvate.
Nu este declarată finalizată revizia tuturor întrebărilor despre ofsaid.

## Surse și ediții

- Citate în română: PDF-ul oficial `Laws of the Game 2025_26_Romanian.pdf`,
  paginile tipărite 107–110, confruntate vizual și extrase prin ancore literale.
  Amprenta rămâne cea verificată a volumului 2025/26.
- Compatibilitate: [Legea 11 și FAQ IFAB 2026/27](https://www.theifab.com/laws/latest/offside/),
  consultate la 16 octombrie 2026. Înregistrarea `offside-2026-27-review` din
  `editionChecks` leagă explicit asocierile de secțiunile 11.1–11.4 verificate.
- Nu s-a tradus text nou și nu s-a redenumit PDF-ul 2025/26 ca ediție 2026/27.
  Modalul arată separat textul oficial românesc, pagina și reverificarea IFAB.

## Selecția pasajelor

- Poziția, momentul atingerii coechipierului și participarea activă sunt tratate
  separat; poziția de ofsaid singură nu justifică o sancțiune.
- Reprinderea sau blocarea unui șut care merge în poartă folosește prevederea
  respingerii pentru evitarea golului, nu jucarea deliberată obișnuită.
- Devierea, atingerea instinctivă și controlul limitat folosesc criteriile relevante;
  o pasă ori degajare deliberată nereușită păstrează prevederea distinctă aferentă.
- LLI și locul ei au pasaj propriu, inclusiv în propria jumătate a atacantului.
- Primirea directă din colț/aruncare/lovitură de poartă este distinctă de o pasă
  ulterioară sau primirea dintr-o lovitură liberă.
- Câmpul vizual, încercarea de a juca mingea, disputa cu adversarul și ordinea
  fault/ofsaid au evidențieri diferite, alese după decizia justificată.

Întrebările care combină ofsaidul cu LP, CG, CR ori altă reluare rămân în coadă
atunci când lipsește verificarea celorlalte componente ale răspunsului. Nu se
certifică o întreagă decizie printr-un singur pasaj despre ofsaid.

## Neconcordanță identificată

ID 298 păstrează momentan cheia B (gol și CG), dar FAQ IFAB 2026/27 pentru aceeași
situație precizează validarea golului fără sancțiune disciplinară. Varianta A din
bancă exprimă această decizie. Este înregistrată o problemă în `reviewIssues`,
fără asociere și fără includere în pilotul explicațiilor. Corectarea cheii și
migrarea controlată a sesiunilor afectate rămân de făcut; lotul nu rescrie
retroactiv scorurile. Acesta nu este un caz lipsit doar de o explicație.

## Verificare

Extractorul a regenerat cu succes biblioteca: 94 de pasaje și 141 de asocieri.
Total: 192/788 de înregistrări au explicații, 74 dintre ele (69 de situații
distincte) reverificate pentru 2026/27. Alte 118 înregistrări rămân la nivelul
verificării 2025/26. Pilotul ediției curente include cele 69 de situații.

52 de teste verifică inclusiv citatele, proveniența, lipsa certificării pentru
ID 298, cazurile-limită de ofsaid, duplicatele și amestecarea variantelor.
Nu s-a efectuat o nouă verificare vizuală în browser; testele verifică și HTML-ul
generat de modal. Modificările rămân locale pe `development`, fără publicare.
