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

`redeploy.php` updates a cPanel checkout from Git. It does not require Node.js or npm
on cPanel: the built `dist/` files are committed with the frontend source.
Open this URL from any machine to start it:

```text
https://nffis.com/redeploy.php
```

Before deploying a frontend change, run `npm run build` on a development machine and
commit the resulting `dist/` changes with the source changes. The cPanel account only
needs `git`, outbound Git access, and permission to write the frontend checkout from
its `main` branch. The endpoint is public and intentionally has no authentication;
anyone who knows the URL can trigger a deployment. A lock prevents simultaneous deployments.

To check Git on the server without fetching or changing anything,
open `https://nffis.com/redeploy.php?check=1`.

If the server still has the older npm-based `redeploy.php`, first commit and push this
version, then upload only `redeploy.php` once through cPanel File Manager. Its one-file
manual change is accepted during the next deploy; any other uncommitted server change
still stops the deployment.

test change
