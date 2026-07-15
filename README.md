# PaymentsIQ — IPC Certificate Validation

Interim payment certificate validation — a 10-IPC / AED 28M queue with AI benchmark analysis and aberration detection to catch over-certification before payment.

Part of the **DAMAC Finance AI Platform** (Powered by Tiger Analytics). This repository
is the standalone build of **PaymentsIQ**, split out from the consolidated Finance
Transformation platform.

## Structure

```
index.html      Landing page
app.html        The PaymentsIQ application
```

## Run locally

Any static file server works — the app is self-contained.

```
python -m http.server 3000
```

Then open http://localhost:3000 — the landing page links straight into the app.

## Deploy

Static site. Enable **GitHub Pages → Deploy from branch → `main` / root**; `index.html`
is served as the landing page.
