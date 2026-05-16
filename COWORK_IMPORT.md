# Campfire — Re-import všech PDF (v2)

Jsi v repozitáři Campfire songbook (Vite+React+TS, GitHub Pages).

**CÍLEM** je znovu zpracovat všechna PDF z `C:\Users\uzivatel\Downloads\České\`
a `C:\Users\uzivatel\Downloads\Anglické\` a nahradit záznamy v `src/data/songs.json`
kvalitnějšími verzemi. Stávající záznamy se **nahradí** (upsert dle slug z názvu souboru),
manuálně přidané písničky bez odpovídajícího PDF se zachovají.

---

## Datový formát (`src/data/songs.json`)

```json
{
  "folders": [
    { "id": "anglicke", "name": "Anglické" },
    { "id": "ceske", "name": "České" }
  ],
  "songs": [
    {
      "id": "artist-slug-title-slug",
      "title": "Název s diakritikou",
      "artist": "Interpret",
      "folderId": "ceske",
      "key": "Em",
      "content": "[Em]Text písničky [D]s akordy inline\n[G]Druhý řádek"
    }
  ]
}
```

---

## Workflow

### Fáze 1 — Inventura (proveď jako první, reportuj výsledek)

1. Přečti `src/data/songs.json` → ulož `folders` array; ulož songs jako `Map<id, song>`
2. Glob `C:\Users\uzivatel\Downloads\České\*.pdf`
3. Glob `C:\Users\uzivatel\Downloads\Anglické\*.pdf`
4. Pro každé PDF: z názvu souboru odvoď `artist`, `title`, `slug`, `folderId` (viz sekci "Slug z názvu souboru")
5. Reportuj: celkový počet PDF, kolik bude nahrazovat existující záznamy, kolik je nových

**Počkej na souhlas před Fází 2 pokud je PDF > 120.**

### Fáze 2 — Paralelní extrakce (batche po 8)

Spusť Task subagenty paralelně. Každý subagent dostane seznam 8 PDF + tato pravidla.
Každý vrátí JSON:
```json
{ "entries": [...], "skipped": [{ "path": "...", "reason": "..." }] }
```

### Fáze 3 — Merge (upsert)

Pro každou novou entry:
- Pokud existuje song se stejným `id` → **nahraď** ho
- Jinak → přidej
- Zachovej songs z existujícího songs.json, jejichž `id` neodpovídá žádnému PDF slug

### Fáze 4 — Commit & push po každém batchi

```
1. Zapiš src/data/songs.json (zachovat folders array, 2-space indent)
2. npx tsc --noEmit   (musí projít; pokud ne, odstraň problematický entry a opakuj)
3. git add src/data/songs.json
4. git commit -m "reimport: N songs (batch X/Y)"
5. git push
```

Po všech batchích: `npm run build`

---

## Pravidla extrakce pro subagenty

### 1. Čtení PDF

```
Read tool s parametrem pages: "1-6"
```

Pokud žádný text → skip s reason: `"scanned"`

### 2. Detekce formátu zdroje

| Co najdeš v textu | Formát |
|---|---|
| `"pisnicky-akordy.cz"` | **pisnicky-akordy** |
| `"YouSongs.cz"` | **yousongs** |
| `"ULTIMATE GUITAR COM"` | **ultimateguitar** |
| `"kytaristka."` | **kytaristka** |
| `"zpevnik.cz"` | **zpevnik** |
| nic z výše uvedeného | **generic** |

### 3. Ořez junk

**Přeskoč na začátku dokud nenarazíš na první akordový nebo textový řádek:**
- Řádky s URL (`https://`, `http://`, `www.`)
- Timestamp řádky (např. `1/31/22, 7:33 PM Kabát - Malá dáma…`)
- Čísla stránek samotná (`2/4`, `3/5`)
- UltimateGuitar navigace: `"Tabs Shots Courses Articles Forums"`, `"ULTIMATE GUITAR COM"`, `"MORE VERSIONS"`, `"Ver 1 XXX"`, `"Official XXX"`
- Metadata: `"Author …"`, `"views, added to favorites"`, `"last edit on"`, `"Difficulty:"`, `"Tuning:"`
- Kytaristka intro popis (odstavec popisující obtížnost a výčet akordů)
- Badge řádky: `"👍 Zkontrolováno"`, `"Zkontrolováno:"`

**Zastav zpracování jakmile narazíš na:**
- `"Akordy"` jako samostatný řádek (začátek sekce s vizuálními diagramy)
- `"Kytara"` nebo `"Video"` samostatně
- `"Vyšlo na albech"`, `"To se mi líbí"`, `"Sdílet"`, `"Zpět na začátek"`
- `"© "` (copyright)
- `"E A D G B E"` (popis strun u chord diagramů)
- Řádky s `"(/diskografie/"` nebo `"Ad"` jako reklamní text

**Zachovej zvlášť (nepiš do content, použij pro metadata):**
- `Key: Bm` → `key` field
- `Capo: 2nd fret` / `Capo: 2` / `KAPO 2` / `Capo 2. poloha` →
  zapiš jako `"Capo 2"` jako **první řádek content**

### 4. Česká normalizace akordů

Aplikuj na **každý** akordový token před zápisem do content:

```
Sufixy (na konci):
  mi   → m       (Ami→Am, Emi→Em, Hmi→Bm, Dmi→Dm, Fmi→Fm…)
  mi7  → m7

Kořenové noty (celý token):
  H    → B        česky H = mezinárodně B natural
  B    → Bb       česky B = mezinárodně Bb
  Es   → Eb
  As   → Ab
  Cis  → C#
  Dis  → D#
  Fis  → F#
  Gis  → G#
  His  → C
  Ais  → Bb
```

Příklady: `Hmi` → `Bm`, `Emi` → `Em`, `Es` → `Eb`, `Fis` → `F#`, `Dmi7` → `Dm7`

### 5. Detekce typů řádků

**Akordový řádek** — ≥ 65 % tokenů (split na mezery) jsou validní akordy:
```
/^[A-H][#b]?(mi|m|maj|min|aug|dim|sus|add|sus2|sus4|add9|maj7|m7|7)?[0-9]*(\/[A-H][#b]?)?$/
```
Platí i pro řádek s jediným akordem (`G`, `Am`, `F#m`…).

**Textový řádek** — vše ostatní (i když začíná `1.`, `2.`, `R:`, `Ref.`…)

**Prázdný řádek** — zachovej jako oddělovač slok (jeden prázdný řádek = konec sloky)

### 6. Sloučení akordy-nad-textem (chord-above-lyric)

```
Když najdeš AKORDOVÝ ŘÁDEK těsně nad TEXTOVÝM ŘÁDKEM:

  1. Extrahuj akordy s jejich sloupcovými pozicemi z akordového řádku
     (pozice = index prvního znaku tokenu v řádku)
  
  2. Zkontroluj textový řádek na sekční prefix (viz sekci 7):
     - Pokud prefix nalezen:
         a. Přidej "[SekčníLabel]" jako samostatný výstupní řádek
         b. Odstraň prefix z textu + trimni leading whitespace
         c. Odečti délku prefixu od každé sloupcové pozice akordu
            (pozice = max(0, chordCol - prefixLen))
  
  3. Vlož [Akord] markery do textu na odpovídajících pozicích:
     pos = min(chordCol, lyricText.length)
     result = lyric[0..pos] + "[Chord]" + lyric[pos..]
  
  4. Výsledný řádek: "[G]Ohořelou károu chtěl bych dojet ke [D]hvězdám,"

Když AKORDOVÝ ŘÁDEK nemá pod sebou textový řádek (chord-only annotation):
  → Výstup akordy jako "[C] [G] [Am]" na samostatném řádku

Když ŘÁDEK obsahuje JAK akordové tokeny TAK text (PDF artefakt — sloučené řádky):
  Příklad: "Ami Emi Ami R: Po tmě se toulá"
  → Odděl leading akordové tokeny od zbytku
  → Zbytek zpracuj jako textový řádek (včetně sekčního prefixu)
  → Akordy vlož přibližně rovnoměrně do textu (odhadni pozice)
```

### 7. Normalizace sekčních prefixů

Tyto vzory **na začátku textového řádku** převeď na header:

```
R:  / R.  / R.:  / Ref:  / Ref. / Ref.: / Refrén:     → [Refrén]
1.  / 1.: / Sloka 1: / Verse 1:                        → [Sloka 1]
2.  / 2.:                                               → [Sloka 2]
3.  / 3.:  (atd.)                                       → [Sloka 3]
Sbor:                                                   → [Sbor]
Bridge: / Mezihra:                                      → [Bridge]
Intro:                                                  → [Intro]
Outro:  / Závěr:                                        → [Outro]
Solo:                                                   → [Solo]
*:  (hvězdička s dvojtečkou)                            → [Outro]
```

Sekční řádky **bez textu za nimi** → také `[SekčníLabel]` header.

**UltimateGuitar brackety** — zachovej přesně tak jak jsou:
`[Verse]`, `[Verse 1]`, `[Chorus]`, `[Bridge]`, `[Intro]`, `[Outro]`,
`[Pre-Chorus]`, `[Interlude]`, `[Solo]` atd.

### 8. Slug z názvu souboru

```
Vstup: "Wanastowi Vjecy - Otevřená zlomenina srdečního svalu [text a akordy na YouSongs.cz].pdf"

1. Odstraň .pdf
2. Odstraň vše v hranatých závorkách: [...] → ""
3. Trimni
4. Rozděl na první " - " → artist + title
   (pokud " - " neexistuje: artist = "", title = celý název)
5. Pro každou část zvlášť:
     a. NFD normalize (String.normalize("NFD"))
     b. Odstraň combining diacritics (/[̀-ͯ]/g)
     c. Lowercase
     d. Nahraď mezery a speciální znaky za "-"
     e. Odstraň non-[a-z0-9-] znaky
     f. Nahraď více pomlček za jednu (-+  → -)
     g. Trimni pomlčky na krajích
6. Slug: "{artist-slug}-{title-slug}", max 70 znaků

Příklad:
  artist: "Wanastowi Vjecy" → "wanastowi-vjecy"
  title:  "Otevřená zlomenina srdečního svalu" → "otevrena-zlomenina-srdecniho-svalu"
  slug:   "wanastowi-vjecy-otevrena-zlomenina-srdecniho-svalu"
```

### 9. Klíč (key field)

Priorita:
1. `Key: Bm` z UltimateGuitar hlavičky (za capo, tj. jak je napsáno)
2. První akord v content (po normalizaci)
3. `""` pokud žádné akordy

---

## Příklad vstupu a výstupu

**Vstup (PDF text, YouSongs.cz formát):**
```
        G              D
Ref: Ohořelou károu chtěl bych dojet ke hvězdám,
         Ami              C
     který svítily z tvejch očí dřív než červotoči
         F         D
     se do tvýho srdce daj, hm hm
```

**Výstup (content v songs.json):**
```
[Refrén]
[G]Ohořelou károu chtěl bych dojet ke [D]hvězdám,
[Am]který svítily z tvejch očí dřív než červotoči
[F]se do tvýho srdce daj, [D]hm hm
```

**Vstup (UltimateGuitar formát):**
```
Key: Bm
Capo: 2nd fret

[Verse]
G Em
I found a love for me
C D
Darling, just dive right in
```

**Výstup:**
```json
{
  "key": "Bm",
  "content": "Capo 2\n\n[Verse]\n[G]I found a love for [Em]me\n[C]Darling, just dive right [D]in"
}
```

---

## Pravidla pro sestavení výsledné entry

```json
{
  "id": "<slug z názvu souboru>",
  "title": "<title z názvu souboru, s diakritikou, přesně>",
  "artist": "<artist z názvu souboru, s diakritikou, přesně>",
  "folderId": "ceske" nebo "anglicke",
  "key": "<viz sekci 9>",
  "content": "<celý text písničky s inline [Akord]markery>"
}
```

---

## Začni nyní

**Fáze 1:** Proveď inventory, reportuj počty. Čekej na souhlas pokud > 120 PDF.
