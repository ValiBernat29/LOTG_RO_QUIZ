# Decizii complete — rev12

12 situații noi sunt asociate, propagate la 21 de înregistrări cu duplicate:
152, 153, 154, 156, 157, 159, 637, 638, 641, 645, 650 și 652.
Nu sunt modificate enunțurile, variantele sau cheile răspunsurilor.

## Asocieri

- 152: sprijinul arbitrului asistent de rezervă, fără a folosi vechea sferă VAR.
- 153: protestul la asistent și păstrarea aruncării deja acordate.
- 154: înlocuirea arbitrului conform regulamentului competiției, nu o ordine
  universală presupusă între oficiali.
- 156: timpul pierdut cu manifestările de bucurie, cu evidențierea punctului relevant.
- 157: posibilitatea modificării pauzei cu permisiunea arbitrului, în contextul
  acordului ambelor echipe confirmat în FAQ.
- 159: validarea golului și încheierea reprizei prelungite numai pentru LP,
  fără a atașa regula obișnuită a loviturii de începere după gol.
- 637: locul corect al LLD și CG pentru îndepărtarea mingii după oprire.
- 638: LLD la contactul din afara suprafeței de pedeapsă și CR pentru DOGSO.
- 641: LLI pentru pasa deliberată către portar, locul pe linia suprafeței de poartă
  și absența sancțiunii disciplinare, fiecare cu justificarea sa.
- 645: încercarea de lovire a oficialului advers, CR pentru comportament violent
  și reluarea de pe linia terenului; nu se folosește regula despre propria echipă.
- 650: controlul mingii între mână și sol, interdicția atacării portarului, LLD,
  locul executării pentru apărare și sancțiunea în funcție de intensitate.
- 652: al doilea CG pentru protest, CR și menținerea LLD acordate inițial.

## Surse și verificare

Citatele sunt extrase literal din PDF-ul românesc 2025/26. Noile pagini relevante
au fost randate și confruntate vizual: 81, 83, 89, 90, 113, 117, 118, 122, 127;
se folosesc și pasajele de la 116 și 131 verificate în lotul anterior.
Nu sunt introduse traduceri proprii.

Compatibilitatea a fost verificată în ediția 2026/27, la 16 octombrie 2026:

- [Legea 6 și FAQ](https://www.theifab.com/laws/latest/the-other-match-officials/)
- [Legea 7 și FAQ](https://www.theifab.com/laws/latest/the-duration-of-the-match/)
- [Legea 13 și FAQ](https://www.theifab.com/laws/latest/free-kicks/)
- [Legea 12 și FAQ](https://www.theifab.com/laws/latest/fouls-and-misconduct/)
- [Legea 15](https://www.theifab.com/laws/latest/the-throw-in/)
- [Legea 10](https://www.theifab.com/laws/latest/determining-the-outcome-of-a-match/)

Registrul de verificare admite acum și introduceri delimitate pe lege, de exemplu
`6.Introducere`, fără a inventa un articol numeric. Validatorul respinge o
introducere din altă lege sau un capitol necunoscut.
Modalul păstrează afișarea simplificată: ediție, lege/articol și explicație.

## Limite păstrate

În `free-kicks-pending.json`, șase cazuri au trecut în `resolvedCases`.
Rămân opt cazuri: 626, 627, 631, 632, 635, 640, 649 și 654.
Nu se forțează o asociere pe baza unui pasaj care justifică doar o parte a deciziei.
ID 631 nu este declarat greșit: răspunsul rămâne confirmat de FAQ, dar asocierea
în română pentru situația cu atingerea portarului nu este încă finalizată.
Nu sunt certificate prin acest lot cazurile VAR 148–150 sau cazul de cronometrare 158.

## Stare

- 272/788 de înregistrări asociate, 203 situații distincte.
- 154 de înregistrări / 131 de situații reverificate pentru 2026/27.
- 118 de înregistrări / 72 de situații rămân verificate numai pe 2025/26.
- 81 de teste trecute; extractor și build reușite.
- Registrul tematic: o corectură, 76 de situații verificate și păstrate,
  161 de semnale pentru lectură, nu erori confirmate.
- Lucru local pe `development`; fără publicare și fără o nouă verificare în browser.
