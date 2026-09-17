# Silver Oak University AI Assistant

An intelligent, multilingual AI assistant grounded in official Silver Oak University (SOU) data, programs, syllabus, and examination timetables.

## 🚀 Local Development Setup

1. **Clone or Extract the Project**
   ```bash
   cd silver-oak-university-assistant
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🌐 Deployment Options

### Option 1: Render.com (Recommended for Full-Stack Express)
Because this app has a persistent backend server (`server.ts` to keep your Gemini API key secure), platforms like **Render** run it automatically with zero configuration:
1. Push your code to a GitHub repository.
2. Go to [render.com](https://render.com) and click **New Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key.
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**.

---

### Option 2: Railway.app (Fastest 1-Click Full-Stack)
1. Go to [railway.app](https://railway.app) and connect your GitHub repo.
2. Add `GEMINI_API_KEY` under the **Variables** tab.
3. Railway automatically detects `npm run build` and `npm start` from `package.json`.

---

### Option 3: Netlify
Netlify is primarily designed for static sites and serverless functions.
- If you deploy to Netlify as a standard static site, Netlify will build the frontend (`dist/`), but regular background Node Express servers require Netlify Functions.
- To deploy the frontend on Netlify while hosting the API on Render or Cloud Run, set the `VITE_API_URL` environment variable.
- Or use **Render** (Option 1) which provides both the frontend and backend in one place for free.

---

### Option 4: Google Cloud Run (1-Click in AI Studio)
In the Google AI Studio top menu, click **Deploy to Cloud Run** for fully managed hosting directly on Google Cloud.
