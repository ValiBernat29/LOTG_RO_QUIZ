# Revizia variantelor de răspuns

Scanarea cu modificările oficiale românești a fost primită ulterior; integrarea
ei este documentată separat în `../laws/SCAN_REVIEW.md`. Această revizie este editorială:
nu schimbă ediția regulilor, cheia de răspuns sau pasajele citate.

Auditul măsoară toate cele 3.152 de variante din 788 de înregistrări (595 de
situații distincte). Au fost rescrise manual variantele pentru 79 de situații,
propagate în 110 înregistrări. Restul nu sunt declarate verificate semantic doar
pentru că au trecut auditul numeric.

Au fost eliminate repetițiile față de enunț și au fost armonizate structura și
nivelul de detaliu al distractorilor. Lungimea identică nu este un obiectiv:
condițiile, beneficiarul reluării și sancțiunea au prioritate. Lista rămasă de
răspunsuri corecte cele mai lungi este un semnal de analiză, nu o listă de erori.

`answer-revisions.json` păstrează variantele înainte/după pentru fiecare ID.
Build-ul verifică concordanța cu banca și generează modulul care actualizează
sesiunile salvate după text, independent de literele amestecate, fără să modifice
alegerile, scorul sau timpul disponibil. Formulările necunoscute nu sunt migrate
parțial. La o revizie ulterioară, aceste ancore trebuie actualizate deliberat.

După modificări:

```powershell
npm run build
npm run answers:audit
npm test
```

Raportul reproductibil este `answer-balance.json`. Lungimea se măsoară în
caractere, inclusiv spațiile. Auditul nu înlocuiește lectura întrebării și a
celor patru variante și nu verifică regulamentul aplicabil.
