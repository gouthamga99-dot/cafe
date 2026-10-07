# Cafe Orders (Next.js)

1. `npm install`
2. Edit `.env.local` (script URL is already filled in; add `ADMIN_PIN` if you want a lock)
3. `npm run dev` and open http://localhost:3000

Pages: the **Order** tab is for customers, the **Admin** tab lists orders and updates payment status.
The browser only talks to `/api/*` routes in this app. Those routes call your Apps Script on the server,
so there are no CORS problems and the script URL and PIN stay private.

Deploy: push to Vercel and add `APPS_SCRIPT_URL` and `ADMIN_PIN` in Environment Variables.
Your Apps Script must be deployed as a web app with access set to **Anyone**.
