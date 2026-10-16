# Aruncări, lovituri de poartă și rejucare la colț — rev13

28 de situații noi primesc explicații, propagate la 36 de înregistrări cu duplicate.
ID-uri: 742, 743, 744, 746, 747, 749, 750, 751, 753, 754, 756, 757, 758,
759, 760, 761, 764, 765, 768, 770, 771, 773, 774, 776, 777, 778, 779 și 788.
Nu sunt schimbate întrebările, variantele sau cheile răspunsurilor.

## Ce justifică pasajele

- Poziția picioarelor și traseul mingii la aruncare, inclusiv deosebirea dintre
  execuția incorectă și atingerea solului înainte de intrarea mingii în teren.
- Golul direct nepermis din aruncare: lovitură de poartă sau de colț, după caz.
  Excepția de ofsaid nu permite înscrierea directă din aruncare.
- Distragerea sau împiedicarea executantului: CG și LLI după efectuarea aruncării.
- Rejucarea regulamentară după atingerea adversarului, distinctă de a doua
  atingere înaintea atingerii altui jucător; SPA este justificat separat.
- Atingerea arbitrului urmată de ieșirea mingii: aruncare, nu minge de arbitru.
  Nu se afișează punctul despre mingea care rămâne în teren drept justificare.
- Portarul care primește direct din aruncarea unui coechipier: LLI fără sancțiune
  disciplinară; separat, a doua atingere după lovitura de poartă care produce
  SPA sau DOGSO poate impune CG/CR, inclusiv când portarul folosește mâna.
- Lipsa reală de timp pentru ieșirea adversarului din suprafața de pedeapsă la
  o lovitură de poartă rapidă, distinctă de rămânerea deliberată.
- Intrarea adversarului după punerea mingii în joc și abaterea comisă înaintea
  acesteia primesc justificări diferite.
- La 764/765, golul înscris prin avantaj după DOGSO este justificat cu rezumatul
  oficial românesc 2026/27 furnizat anterior, nu cu vechea sancțiune CG.

## Surse interne și verificare

15 fragmente noi sunt extrase literal din cartea românească 2025/26. Paginile
141–142, 145–146 și 150 au fost randate și confruntate vizual. Se reutilizează și
pasaje verificate anterior, inclusiv de la 97, 109, 116, 120 și 122.
Textul despre DOGSO cu avantaj și gol provine din scanarea românească 2026/27
deja înregistrată, nu dintr-o traducere proprie.

Compatibilitatea a fost verificată la 16 octombrie 2026:

- [Legea 15 și FAQ](https://www.theifab.com/laws/latest/the-throw-in/)
- [Legea 16 și FAQ](https://www.theifab.com/laws/latest/the-goal-kick/)
- [Legea 17 și FAQ](https://www.theifab.com/laws/latest/the-corner-kick/)
- [Legea 12](https://www.theifab.com/laws/latest/fouls-and-misconduct/)
- [Legea 9](https://www.theifab.com/laws/latest/the-ball-in-and-out-of-play/)
- [Legea 11](https://www.theifab.com/laws/latest/offside/)
- [Legea 5](https://www.theifab.com/laws/latest/the-referee/)
- [Legea 10](https://www.theifab.com/laws/latest/determining-the-outcome-of-a-match/)

Validatorul permite acum delimitarea `12.Rezumat` în registrul reverificării,
distinct de un articol integral. Aceasta nu schimbă proveniența scanării și
nu permite substituirea unui rezumat cu articolul 12.4.
Modalul păstrează interfața simplificată cerută, fără pagini sau surse tehnice.

## Cazuri rămase

`boundary-restarts-pending.json` consemnează cele 18 înregistrări încă neasociate
din Legile de colectare 15–17. Nu sunt declarate greșite doar pentru că nu au
încă explicație. Cazurile de avantaj la aruncare executată incorect așteaptă
textul românesc complet al noii prevederi 5.3; rămânerea deliberată în suprafața
de pedeapsă nu este justificată prin excepția «nu au avut timp să o părăsească».

## Rezultat

- 308/788 de înregistrări asociate, 231 de situații distincte.
- 190 de înregistrări / 159 de situații reverificate pentru 2026/27.
- 118 înregistrări / 72 de situații rămân verificate numai pe 2025/26.
- 90 de teste trecute; extractorul și build-ul reușite.
- Audit tematic: o corectură, 102 de situații verificate și păstrate,
  158 de semnale de lectură, nu erori confirmate.
- Lucru local pe `development`, fără publicare și fără o nouă verificare în browser.
