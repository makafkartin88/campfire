# Campfire

Osobní zpěvník s kytarovými akordy — PWA instalovatelná na telefon i desktop.

## Funkce
- Text písní s akordy (`[C]Amazing [G]grace`) zobrazenými nad textem
- SVG diagramy akordů na začátku každé písně
- Transpozice (posun o N půltónů)
- Autoscroll s nastavitelnou rychlostí
- Organizace do složek (synchronizace s Google Drive)
- Přidávání písní: vložit text nebo nahrát PDF (best-effort extrakce akordů)
- PWA — funguje offline, instalovatelná přes Chrome

## Spuštění

### 1. Závislosti
```bash
npm install
```

### 2. Google Cloud Console (jednorázové nastavení)

1. Jdi na https://console.cloud.google.com/ → vytvoř nový projekt **Campfire**
2. **APIs & Services → Library** → vyhledej a povol **Google Drive API**
3. **APIs & Services → OAuth consent screen**
   - User Type: **External**
   - App name: `Campfire`, support email: tvůj email
   - Scope: `https://www.googleapis.com/auth/drive.file`
   - Test Users: přidej svůj Google účet
4. **Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:5174`
     - `https://TVOJE_USERNAME.github.io`
   - Zkopíruj **Client ID**
5. **Credentials → Create Credentials → API key**
   - Omez na HTTP referrers: `localhost:5174/*` a `TVOJE_USERNAME.github.io/*`
   - Omez na Google Drive API

### 3. Env proměnné
```bash
cp .env.example .env.local
# Vyplň VITE_GOOGLE_CLIENT_ID a VITE_GOOGLE_API_KEY
```

### 4. Vývoj
```bash
npm run dev
```
Otevři http://localhost:5174/campfire/

## Deploy na GitHub Pages

### Jednorázové nastavení repozitáře
1. Vytvoř GitHub repo `campfire`
2. Jdi na **Settings → Secrets and variables → Actions** a přidej:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_API_KEY`
3. Jdi na **Settings → Pages → Source** → vyber **GitHub Actions**

### Deploy
```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/TVOJE_USERNAME/campfire.git
git push -u origin main
```
GitHub Actions automaticky buildí a nasadí aplikaci po každém push na `main`.

Výsledná URL: `https://TVOJE_USERNAME.github.io/campfire/`

## Formát písní

Akordy se píší do hranatých závorek **před** slabiku, ke které patří:

```
[C]Tři [Am]čuníci [F]vykuká[G]vali
z [C]okénka [Am]malého [F]domečku [G]svého
```

## Struktura projektu

```
src/
  lib/
    chords/   parser, transposer, diagram lookup
    drive/    Google Drive auth + REST client + sync
    pdf/      pdfjs extractor + chord detector
  store/      Zustand stores (auth, songs, folders, ui)
  components/ layout, songs, chord-diagram, editor, pdf, autoscroll
  pages/      HomePage, SongPage, EditSongPage
```
