# Supply Velocity — NPS / Client Feedback Survey

A branded Net Promoter Score (NPS) survey that Supply Velocity can send to
clients. Responses land automatically in a Google Sheet.

## What's in this folder

| File | What it is |
|------|------------|
| `index.html` | The survey — a single, self-contained, branded web page. |
| `google-apps-script.gs` | The tiny backend that saves each response into a Google Sheet. |
| `README.md` | This guide. |

The form is styled to match **supplyvelocity.com** — navy + gold palette and
the real Supply Velocity logo (embedded, no external files).

---

## How it works

1. A client opens the survey link and picks a score **0–10**, optionally leaving
   a comment and their name/company/email.
2. On submit, the response is sent to a **Google Apps Script Web App**.
3. That script appends a **new row to a Google Sheet** — timestamp, score,
   category (Promoter / Passive / Detractor), the comment, and contact fields.

No third-party service, no monthly fee — everything lives in Supply Velocity's
own Google account.

---

## Setup (about 5 minutes)

### Step 1 — Create the responses spreadsheet
1. Go to <https://sheets.google.com> and create a **blank sheet**.
2. Name it e.g. *"Supply Velocity — NPS Responses"*.

### Step 2 — Add the backend script
1. In that sheet: **Extensions ▸ Apps Script**.
2. Delete any sample code in `Code.gs`.
3. Open `google-apps-script.gs` from this folder, copy **all** of it, and paste
   it in. Click the **Save** (💾) icon.
4. *(Optional)* To get an email whenever an unhappy client (score 0–6) responds,
   set `ALERT_EMAIL` near the top, e.g. `var ALERT_EMAIL = "team@supplyvelocity.com";`

### Step 3 — Deploy it as a Web App
1. Click **Deploy ▸ New deployment**.
2. Click the gear ⚙️ next to *Select type* → choose **Web app**.
3. Set:
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*
4. Click **Deploy**, then **Authorize access** and approve the permissions
   (Google may show an "unverified app" warning — click *Advanced ▸ Go to
   project ▸ Allow*; this is your own script).
5. **Copy the Web app URL** (looks like
   `https://script.google.com/macros/s/AKfy..../exec`).

> Tip: paste that URL into a browser — you should see
> `{"status":"Supply Velocity NPS endpoint is live."}`.

### Step 4 — Connect the form
1. Open `index.html` in a text editor.
2. Find this line near the bottom:
   ```js
   const ENDPOINT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
   ```
3. Replace the placeholder with the URL you copied. Save.

Done — submit a test response and watch a row appear in your sheet.

---

## Publishing the form (pick one)

The form is one HTML file, so hosting is easy and free:

- **Netlify Drop** — drag `index.html` onto <https://app.netlify.com/drop>. Instant public link.
- **GitHub Pages** — commit the file to a repo and enable Pages.
- **Cloudflare Pages / Vercel** — connect the repo, deploy.
- **Supply Velocity's own site** — upload it as a page (e.g.
  `supplyvelocity.com/feedback`) so the URL is fully on-brand.

Then share the link by email, in your signature, or via a QR code.

---

## Pre-filling client info (nice-to-have)

You can tag responses by adding parameters to the link, so you know who
answered even if they skip the fields:

```
https://your-link/index.html?company=Acme%20Corp&name=Jane%20Doe&email=jane@acme.com
```

Great for mail-merge / monthly send-outs.

---

## Updating the backend later

If you edit `google-apps-script.gs`, redeploy: **Deploy ▸ Manage deployments ▸
edit (✏️) ▸ Version: New version ▸ Deploy**. The URL stays the same, so you
don't need to touch `index.html`.

---

## NPS scoring reference

| Score | Category | Meaning |
|-------|----------|---------|
| 9–10 | **Promoter** | Loyal enthusiasts |
| 7–8 | **Passive** | Satisfied but unenthusiastic |
| 0–6 | **Detractor** | Unhappy; may churn |

**NPS = %Promoters − %Detractors** (ranges from −100 to +100). You can compute
this in the sheet once responses come in.
