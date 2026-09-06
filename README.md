# DueGrove V1.4

DueGrove is a calm, lightweight invoice generator for freelancers and small businesses.

## Public structure

- `/` — product landing page
- `/app/` — invoice generator

## Landing page

The public landing page includes:

- DueGrove brand introduction
- Primary "Create an invoice" CTA
- Feature overview
- How-it-works section
- Privacy explanation
- FAQ
- Feedback link
- SEO title and description
- Open Graph / social metadata
- Canonical URL
- SVG favicon

## Invoice app

The invoice generator keeps the existing V1.3 functionality:

- Live invoice preview
- Business and client details
- Business logo upload
- Save business details as default
- Saved clients
- Grove, Ledger and Minimal invoice styles
- Multiple currencies
- Line items, tax and discount calculations
- Local invoice drafts
- Reopen / duplicate / delete drafts
- PDF export
- Responsive mobile layout

V1.4 also adds:

- Link back to the main DueGrove landing page
- Feedback button
- Clear local-storage privacy note
- Asset cache-busting for the public release

## Privacy / storage

DueGrove V1.4 does not use user accounts or a cloud database.

Saved invoices, clients, business defaults, and logos are stored locally in browser `localStorage` on the current device.

Clearing browser site data may remove them, and they do not sync across devices.

## Deploying to GitHub Pages

Copy the contents of this folder into the existing `duegrove` Git repository, then:

```bash
git add .
git commit -m "Release DueGrove V1.4"
git push
```

GitHub Pages will serve the landing page from:

`https://aemi17.github.io/duegrove/`

and the invoice app from:

`https://aemi17.github.io/duegrove/app/`
