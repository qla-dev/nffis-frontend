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
2. Start the local Laravel API on `http://localhost:8080`. Vite proxies `/api` and `/sanctum` through `localhost:3000`, keeping the session and CSRF cookies same-origin. Set `VITE_LOCAL_API_ORIGIN` if the local API uses a different origin, or `VITE_API_BASE_URL` to route the proxy to the deployed API.
3. Configure `GEMINI_API_KEY` only in the backend environment; it must never be placed in frontend Vite variables.
4. Run the app:
   `npm run dev`

## cPanel frontend redeploy

`redeploy.php` updates a cPanel checkout from Git, installs the locked dependencies,
and builds `dist/` on the server.
Open this URL from any machine to start it:

```text
https://nffis.com/redeploy.php
```

The cPanel account needs Git, Node.js 20 or newer with npm, outbound Git access, and
permission to write the frontend checkout from its `main` branch. The script detects
standard cPanel and CloudLinux npm installations automatically. The endpoint is public
and intentionally has no authentication; anyone who knows the URL can trigger a deployment.
A lock prevents simultaneous deployments.

If the server still has an older `redeploy.php`, upload this file once through cPanel
File Manager, then open `https://nffis.com/redeploy.php`.

test change
