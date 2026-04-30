# LeadGold AI

Premium black-and-gold SaaS-style web app that generates sample business leads, AI outreach messages, sales pitches, and downloadable CSV files.

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

To enable AI-generated outreach, create a `.env` file or set environment variables:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

If `OPENAI_API_KEY` is missing or the API request fails, the app automatically shows mock demo data.

## Files

- `index.html` - App layout
- `style.css` - Luxury black and gold UI
- `script.js` - Lead generation UI, table rendering, CSV export
- `app.js` - Express backend and OpenAI integration

## Deploy on Render

1. Push this folder to a GitHub repository.
2. Create a new Render Web Service.
3. Use `npm install` as the build command.
4. Use `npm start` as the start command.
5. Add `OPENAI_API_KEY` in Render environment variables.

## Deploy on Vercel

This Express app can run on Vercel as a Node server with the included `vercel.json`.

1. Push this folder to GitHub.
2. Import the project in Vercel.
3. Add `OPENAI_API_KEY` in Project Settings -> Environment Variables.
4. Deploy.
