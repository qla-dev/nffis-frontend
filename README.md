<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1m4-tsfYsevdEMjjAU6gq3FWPYfdH77rK

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `VITE_NFFIS_BACKEND_URL` in `.env` when the backend is not running at the default local address.
3. Configure `GEMINI_API_KEY` only in the backend environment; it must never be placed in frontend Vite variables.
4. Run the app:
   `npm run dev`

## cPanel frontend redeploy

`redeploy.php` updates a cPanel checkout from Git, runs `npm ci`, and builds `dist/`.
Open this URL from any machine to start it:

```text
https://nffis.com/redeploy.php
```

The cPanel account needs `git`, `npm`, outbound Git access, and permission to write the
frontend checkout from its `main` branch. The endpoint is public and intentionally has
no authentication; anyone who knows the URL can trigger a build. A lock prevents
simultaneous deployments.
