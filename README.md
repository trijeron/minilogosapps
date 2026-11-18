# Logické Hry 6v1 (Sudoku · Tango · Queens · Minibridge · Mahjong · Zip)

Webová aplikace sdružující 6 logických a karetních her v češtině (React 19 + TypeScript + Tailwind CSS v4 + Vite), včetně plně samostatné offline HTML verze (`public/minisudoku.html`).

---

## Obsažené hry

1. **Mini Sudoku (6×6)** — 3 obtížnosti, tužkové poznámky, 3 nápovědy, stopky a osobní rekordy.
2. **Tango (6×6)** — Slunce a Měsíc s garantovaným unikátním řešením bez hádání.
3. **Queens (6×6 / 8×8 / 10×10)** — umisťování korun s automatickým křížkováním a kontrolou konfliktů.
4. **Minibridge** — výukový režim pro jednoho hráče (Jih vždy Vydražitel), 2 režimy zobrazení karet (`Vějíř` / `Po barvách`).
5. **Mahjong Solitaire** — 3 rozložení (*Pyramida*, *Most*, *Želva 144*), 3 vizuální styly kamenů (*Komiks*, *Pohádky*, *Klasika*), 10 nápověd, časomíra a posuvník přiblížení (`75 % – 250 %`).
6. **Zip (5×5 / 6×6 / 7×7)** — souvislá Hamiltonovská cesta od čísla 1 po poslední číslo se strategickými zdmi, unikátním řešením, návratem cesty tahem zpět a nápovědou.

---

## Požadavky

- **Node.js** `>= 20.x` (doporučeno LTS `20` nebo `22`)
- **npm** `>= 10.x` (případně `bun` díky přítomnosti `bun.lock`)

---

## 1. Instalace a lokální spuštění

```bash
# 1. Instalace závislostí
npm install

# 2. Spuštění vývojového serveru (běží na http://localhost:3000)
npm run dev
```

Vývojový server je nakonfigurován na portu `3000` (`--port=3000 --host=0.0.0.0`), takže je dostupný i z mobilního telefonu ve stejné lokální síti přes IP adresu počítače.

### Volitelné proměnné prostředí
Aplikace funguje čistě na straně prohlížeče (stav a rekordy ukládá do `localStorage`) a pro základní provoz nevyžaduje žádné API klíče. Pro případné hostované prostředí viz `.env.example`.

---

## 2. Testy, typová kontrola a produkční build

```bash
# Kontrola TypeScript typů
npm run lint

# Spuštění jednotkových testů (Tango, Minibridge, Mahjong, Zip + standalone HTML)
npm test

# Sestavení produkčního balíčku do složky dist/
npm run build

# Lokální náhled produkčního buildu
npm run preview
```

Výstup buildu se uloží do složky **`dist/`** (`dist/index.html`, statické JS/CSS assety a `dist/minisudoku.html`).

Pro čistý rebuild lze předem odstranit předchozí výstup:

```bash
npm run clean && npm run build
```

---

## 3. Nahrání do Gitu (GitHub / GitLab)

Pokud projekt ještě nemá inicializovaný Git repozitář:

```bash
git init
git add .
git commit -m "Initial commit: Logické Hry 6v1"
git branch -M main
git remote add origin <URL_VASEHO_REPOZITARE>
git push -u origin main
```

---

## 4. Nasazení (Deploy)

Protože jde o statickou SPA aplikaci (bez nutnosti backendového serveru), stačí po spuštění `npm run build` nasadit obsah složky `dist/`.

### A. Vercel / Netlify / Cloudflare Pages
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`
- **Node.js version:** `20` (nebo `22`)

### B. GitHub Pages
1. V `vite.config.ts` nastavte `base: '/<nazev-repozitare>/'` (pokud nenasazujete na vlastní kořenovou doménu).
2. Spusťte `npm run build` a publikujte obsah `dist/` (např. přes GitHub Actions `actions/upload-pages-artifact` + `actions/deploy-pages`).

### C. Vlastní server / Nginx / Apache
Zkopírujte obsah vygenerované složky `dist/` do kořenového adresáře webového serveru (např. `/var/www/logicke-hry/`).

Příklad konfigurace pro Nginx:

```nginx
server {
    listen 80;
    server_name vase-domena.cz;
    root /var/www/logicke-hry;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### D. Docker (statický Nginx obraz)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Sestavení a spuštění kontejneru:

```bash
docker build -t logicke-hry .
docker run -d -p 8080:80 logicke-hry
```

### E. Offline použití bez serveru
Soubor `public/minisudoku.html` (v produkčním buildu `dist/minisudoku.html`, případně ke stažení přímo přes ikonu stažení v hlavičce aplikace) funguje zcela samostatně po otevření v libovolném prohlížeči bez instalace a bez internetu.
