# PaymentsIQ — Supplier Claim Validation

Supplier payment claim validation — a 10-claim / $28.0M queue with AI benchmark analysis and
aberration detection to catch over-billing before the payment run.

Client-neutral prototype. The demo context is a **US consumer-packaged-goods / retail**
organisation validating freight, co-manufacturing, packaging and trade claims. All currency is
**USD**. Every vendor, program, purchase order and figure is synthetic.

Built strictly to the **Tiger Analytics** design system — colour scales and typographic
hierarchy are defined once in [assets/theme.css](assets/theme.css) and nothing in the app
introduces a colour outside those scales.

## Structure

```
index.html         Landing page
app.html           Application shell (markup only)
assets/theme.css   Tiger Analytics design system — colour tokens, type scale, components
assets/data.js     Synthetic demo data (claims, benchmarks, checks, trends)
assets/app.js      Views, interaction and charts
```

No build step, no dependencies, no framework. Plain browser JS.

## The app

| View | What it does |
|---|---|
| **Home** | Payment-run readiness — briefing, KPI tiles, exceptions ranked by exposure, queue composition, agent run trace, connected sources |
| **Payments** | The validation queue — filter by AI verdict, search, open any claim |
| **Claim detail** | Four tabs: AI analysis (findings + line items vs benchmark + comparables), the 12-point check suite, PO & financials, documents & vendor correspondence. Decide from the footer: certify, part-certify and withhold, raise a query, or reject |
| **Reports** | Weekly cleared vs flagged value, rate variance by spend category, value at risk, recovery ledger, vendor risk register |
| **Settings** | 14 maintained benchmark norms (editable), the approval delegation matrix, agent configuration |

## Design system

**Colour** — the Gray, Brand (orange), Success, Warning and Error scales are declared as CSS
custom properties in `:root`. Semantic aliases (`--text-primary`, `--border-subtle`,
`--surface-page`, …) all resolve back to a scale step, so the palette can be swapped in one
place. `#FFFFFF` is used only as the card/canvas base beneath the gray scale.

**Typography** — `h2`–`h6`, `subtitle1/2`, `body1/2`, `caption` and `overline` are defined once;
element selectors (`h4`) and utility classes (`.t-h4`) share identical declarations so semantic
and utility markup cannot drift. Type family is Inter, with JetBrains Mono for references and
identifiers.

**Spacing** — standard 4px grid (`--sp-1` … `--sp-16`).

**Charts** read their colours from the same tokens — no hard-coded hex in chart code. The
categorical pairs used (success/brand, success/error) were validated for colourblind separation,
lightness band, chroma and contrast; every series also carries a legend and direct value labels,
and the weekly chart has a table view.

## Run locally

Any static file server works.

```
python -m http.server 3000
```

Then open http://localhost:3000 — the landing page links straight into the app.

## Deploy

Static site. Enable **GitHub Pages → Deploy from branch → `main` / root**; `index.html` is
served as the landing page.
