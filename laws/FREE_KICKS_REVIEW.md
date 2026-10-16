# Loviturile libere — rev11

22 de situații noi au explicații, propagate la 30 de înregistrări prin duplicate.
ID-uri reprezentative: 628, 629, 630, 633, 634, 636, 639, 642, 643, 644, 646,
647, 648, 651, 653, 655, 656, 657, 658, 659, 660 și 661.

## Verificare și surse interne

Textul românesc este extras literal din PDF-ul 2025/26: Legea 13, paginile
131–133, plus pasajele necesare despre înscrierea golului, tertipul pasei către
portar și avertismentul pentru nerespectarea distanței. Paginile noi au fost
randate și confruntate vizual cu extragerea. Nu s-au creat traduceri proprii.

Compatibilitatea asocierilor cu 2026/27 a fost verificată la 16 octombrie 2026:

- [Legea 13 și FAQ](https://www.theifab.com/laws/latest/free-kicks/)
- [Legea 12 și FAQ](https://www.theifab.com/laws/latest/fouls-and-misconduct/)
- [Înscrierea golului](https://www.theifab.com/laws/latest/determining-the-outcome-of-a-match/)
- [Lovitura de începere](https://www.theifab.com/laws/latest/the-start-and-restart-of-play/)

`editionChecks` consemnează această reverificare separat de ediția citatelor.
Modalul păstrează afișarea simplificată cerută: ediția verificată, legea/articolul,
titlul și explicația, fără pagini sau detalii de proveniență.

## Ce se diferențiază explicit

- A doua atingere a executantului: LLI, nu excepția loviturii trimise direct în
  propria poartă. Dacă sunt SPA/DOGSO, sancțiunea are pasaj separat.
- Atingerea portarului înaintea autogolului față de lovitura liberă trimisă direct
  în propria poartă; LLI trimisă direct în poarta adversă are altă evidențiere.
- Distanța de 1 m de zid la executare față de apropierea după intrarea mingii în joc.
- Interceptarea executării rapide față de împiedicarea deliberată a executării.
- Fenta permisă, tertipul pasei către portar și trimiterea regulamentară a mingii
  într-un adversar sunt situații diferite, nu justificări interschimbabile.
- Contactul imprudent în afara terenului are justificare pentru locul LLD și,
  separat, pentru CG.

## Ce nu s-a asociat automat

`free-kicks-pending.json` păstrează celelalte 14 situații ale Legii 13 și motivul
amânării. Nu sunt marcate ca erori doar pentru că explicația lipsește.
În particular, 626/627 necesită textul românesc complet al prevederii 5.3 despre
avantaj la o reluare executată incorect. La 631, 632 și 654, interpretarea FAQ
este mai specifică decât regula generală disponibilă în română; nu se afișează
un citat general ca și cum ar justifica integral răspunsul.

## Rezultat și teste

- 251/788 de înregistrări cu explicații, 191 de situații distincte.
- 133 de înregistrări / 119 situații reverificate pentru 2026/27.
- 118 de înregistrări / 72 de situații rămân verificate numai pe 2025/26.
- 74 de teste trecute; extractorul și build-ul reușite.
- Auditul schimbărilor propagă acum verificarea la duplicate indiferent de
  ordinea ID-urilor: o corectură, 64 de situații verificate și păstrate,
  162 de semnale tematice pentru lectură, nu erori confirmate.
- Banca, variantele și cheile nu au fost modificate în acest lot; ID 298 rămâne A.
- Lucru local pe `development`, fără publicare și fără o nouă verificare în browser.
