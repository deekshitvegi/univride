# UniRide 🎓🚖

A smart social ridesharing platform designed specifically for university students. UniRide helps students coordinate safe, affordable carpools using trust scores, real-time routing, and AI-powered matchmaking.

## 🚀 Features

*   **Smart Ride Matching:** Toggle between "Driver" (Offer) and "Passenger" (Request) modes.
*   **Trust & Safety:** Reputation system with Trust Scores. Anti-cheat verification using secure 4-digit PINs at drop-off.
*   **Interactive Map:** Visualizes routes with realistic curves and traffic simulation using OSRM.
*   **Live Chat:** Real-time negotiation with automated booking confirmations and role-based actions.
*   **Profile System:** Track ride history, verification status, and recent messages.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Tailwind CSS
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

## ☁️ Deployment Guide (Fixing the White Page)

If you see a white screen after deploying to GitHub Pages, it is likely a pathing issue. Because your repository is named **`deekshitvegi.github.io`**, this is a **User Site**, which behaves slightly differently than standard repositories.

### Step 1: Update `package.json`
Open your `package.json` file in your code editor. Add the `homepage` field at the top level. 

**Use this exact URL:**

```json
{
  "name": "uniride",
  "version": "1.0.0",
  "homepage": "https://deekshitvegi.github.io", 
  // ... rest of file
}
```

### Step 2: Build & Deploy
In your terminal, run:

```bash
npm run build
npm run deploy
```

*(Note: Ensure you have `gh-pages` installed: `npm install gh-pages --save-dev`)*

### Step 3: API Keys
Since this is a client-side demo, ensure your `API_KEY` for Google GenAI is correctly set in your environment variables. If the map or AI features don't load, check the browser console (F12) for errors.