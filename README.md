# UniRide 🎓🚖

A smart social ridesharing platform designed specifically for university students. UniRide helps students coordinate safe, affordable carpools using trust scores, real-time routing, and AI-powered matchmaking.

## 🚀 Features

*   **Smart Ride Matching:** Toggle between "Driver" (Offer) and "Passenger" (Request) modes.
*   **Trust & Safety:** Reputation system with Trust Scores. Anti-cheat verification using secure 4-digit PINs at drop-off.
*   **Interactive Map:** Visualizes routes with realistic curves and traffic simulation using OSRM.
*   **Live Chat:** Real-time negotiation with automated booking confirmations and role-based actions.
*   **Profile System:** Track ride history, verification status, and recent messages.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Tailwind CSS (compiled at build time)
*   **Mapping:** Leaflet.js, OSRM (Open Source Routing Machine)
*   **AI:** Google Gemini API (for parsing requests and smart replies)
*   **State:** LocalStorage persistence (No backend required for demo)

## 📦 How to Run Locally

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the server:**
    ```bash
    npm start
    ```

3.  **Open in Browser:**
    Navigate to `http://localhost:3000`

---

## 🌐 Deploying as a Website

UniRide is a static site, so it runs on GitHub Pages with no server.

1. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds the app and publishes it to
   `https://deekshitvegi.github.io/univride/`.

You can also run it by hand from the **Actions** tab ("Deploy to GitHub Pages" → Run workflow).
`vite.config.ts` uses `base: './'`, so the same build works at any URL path.

## 📱 Installing as an App

The site ships a web app manifest, so phones and desktop browsers can install it:

* **iPhone (Safari):** Share → *Add to Home Screen*
* **Android / desktop Chrome:** menu → *Install app*

## 🔑 AI Features (optional)

Smart ride parsing and suggested replies use the Gemini API. Without a key the app still works and
falls back to built-in parsing. To enable them locally, create `.env.local`:

```bash
VITE_API_KEY=your-gemini-key
```

Do not add the key to the GitHub Pages build: anything bundled into a static site is visible to every visitor.
