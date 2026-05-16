# Campfire — Batch Song Import Instructions

You are working in the Campfire songbook repo (Vite+React+TS PWA, deployed to GitHub Pages).

**GOAL:** Import all PDF songs from `C:\Users\uzivatel\Downloads\` into `src/data/songs.json`, commit and push in batches. The relevant subfolders are `České` and `Anglické`.

---

## Data Format (`src/data/songs.json`)

```json
{
  "folders": [
    { "id": "anglicke", "name": "Anglické" },
    { "id": "ceske", "name": "České" }
  ],
  "songs": [
    {
      "id": "kebab-case-slug",
      "title": "Original Title with accents",
      "artist": "Artist Name",
      "folderId": "ceske",
      "key": "Em",
      "content": "[Em]Lyric line with [D]chords inline\n[G]Next line..."
    }
  ]
}
```

---

## Conversion Rules

1. **ID:** ASCII kebab-case slug from title, max 60 chars. Strip accents via NFD normalization.
   Example: `"Dívka s perlami"` → `"divka-s-perlami"`

2. **folderId:** derived from subfolder name.
   - `"Anglické"` → `"anglicke"`
   - `"České"` → `"ceske"`

3. **key:** detect from first chord in content, or leave `""` if unclear.

4. **content:** lyrics + chords in INLINE `[Chord]text` format.
   - **Chord-above-lyric lines:** align chord X-position to nearest character in the lyrics line below. Insert `[Chord]` at that character position.
   - **Czech chord normalization:**
     - `Emi` → `Em`, `Ami` → `Am`, `Hmi` → `Bm`
     - Czech `H` → international `B` (Czech H is B in international notation)
     - Czech `B` stays as `B`
   - **Section markers** like `[Chorus]`, `[Verse]`, `[Refrén]`, `[Bridge]`, `[Intro]`, `[Outro]`: KEEP them as literal text in content. The app renders them as orange section headers (they are NOT chords).
   - **Empty lines:** keep as separators between verses.
   - **Strip junk:** copyright notices, URLs, page footers, ads from PDF.

### Chord Validation Regex (used by app's parser)

```
/^[A-H][#b]?(mi|m|maj|min|aug|dim|sus|add)?[0-9]*(\/[A-H][#b]?)?$/
```

If a token in `[]` doesn't match this, it's treated as a section marker, not a chord.

---

## Workflow

### Phase 1 — Inventory

1. Read `src/data/songs.json` → collect existing song IDs into a Set.
2. Glob `C:\Users\uzivatel\Downloads\Anglické\*.pdf`
3. Glob `C:\Users\uzivatel\Downloads\České\*.pdf`
4. For each PDF: compute candidate slug from filename (strip `.pdf`, normalize NFD, lowercase, kebab-case).
   If candidate ID is already in the existing set → **SKIP** (don't queue it).
5. Build a queue of `{ pdfPath, subfolder }` for new songs only.
6. **Report:** total PDFs found, how many skipped as duplicates, how many to process.
7. **Wait for user approval** before launching Phase 2 if more than 80 songs queued.

### Phase 2 — Parallel Extraction

- Split the queue into batches of ~10 songs each.
- For each batch, spawn **one Task subagent** (`subagent_type=general-purpose`) **in parallel**.
- Each subagent receives: list of PDF paths + the conversion rules above + the existing IDs set.
- Each subagent returns JSON: `{ entries: SongEntry[], skipped: { path: string, reason: string }[] }`

Each subagent must:
- Read each PDF via the Read tool.
- If Read returns no extractable text (scanned image PDF): add to `skipped` with `reason: "scanned"`. **Do NOT OCR.** Continue with next file.
- Extract title (usually first line), artist (often subtitle or second line), key (from first chord or chord chart header).
- Convert chord notation to inline `[Chord]text` format using column-position alignment.
- Generate kebab-case ID. If it would collide with an existing ID → skip with `reason: "duplicate-id-collision"`.
- Return entries as valid JSON.

### Phase 3 — Merge & Validate

- Collect all subagent results.
- Final duplicate check across new batch (slug collision within new entries → skip second occurrence, log it).
- Validate each entry: `id` present, `title` present, `folderId` in `{ceske, anglicke}`, `content` non-empty.
- Drop invalid entries, log them.

### Phase 4 — Commit & Push per Batch

For each batch:

1. Append entries to `src/data/songs.json`'s `"songs"` array (preserve the `"folders"` array). Use 2-space indent.
2. Run: `npx tsc --noEmit` — must succeed. If not, drop the broken entry and retry without it.
3. `git add src/data/songs.json`
4. `git commit -m "add: N songs from <folder> folder (batch X/Y)"`
5. `git push`

Do NOT wait for a full build between batches — TypeScript check is enough. Run `npm run build` only after ALL batches are done.

**Final report:**
- Total processed: N
- Total skipped (scans): M — with file list
- Total skipped (duplicates): K
- Commits pushed: P

---

## Example Entry (model your output after this)

```json
{
  "id": "divka-s-perlami-ve-vlasech",
  "title": "Dívka s perlami ve vlasech",
  "artist": "Aleš Brichta",
  "folderId": "ceske",
  "key": "Em",
  "content": "[Em]Zas mě tu [D]máš, [Am]nějak se [Em]mračíš\n[Em]vybledlej [D]smích už ve [Am]dveřích.[Em]\n\nR: [G]No tak lásko, [D]co chceš mi říct\n[Am]máš už perly možná i [Em]víc"
}
```

---

## Start Now

Begin with **Phase 1** (inventory) and report the counts before launching subagents.
