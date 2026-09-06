# DueGrove V1.3

DueGrove is a warm, lightweight invoice generator for freelancers and small businesses.

## V1.3 features

### Invoice creation
- Live invoice preview
- Business and client information
- Invoice number, issue date and due date
- USD, EUR, GBP, MAD and CAD
- Add/remove line items
- Quantity × rate calculations
- Tax and discount percentages
- Notes
- Responsive interface

### PDF
- Reliable PDF export with `html2canvas` + `jsPDF`
- Browser print / Save as PDF fallback

### Local invoice drafts
- Save invoice drafts in `localStorage`
- Reopen saved invoices
- Duplicate invoices
- Delete invoices
- Saved/unsaved indicator
- Ctrl/Cmd + S shortcut

### New in V1.3
- Upload a business logo
- Logo is resized before local storage to reduce space usage
- Save business details as the default for future invoices
- Save reusable clients
- Fill client details from a saved-client picker
- Update/delete saved clients
- Three invoice styles:
  - Grove
  - Ledger
  - Minimal
- Invoice style and logo are stored with saved invoice drafts

## Run it

Open `index.html` or use VS Code + Live Server.

The PDF libraries are loaded from CDNs, so automatic PDF export requires internet access.

## Privacy / storage

There is still no backend.

Invoices, business defaults and saved clients are stored only in the browser's `localStorage` on that device. Clearing browser site data removes them.

## Suggested next phase

Before V2, collect user feedback on:
- default business profile
- saved clients
- invoice templates
- logo upload
- mobile usability

V2 can then introduce accounts, a cloud database, cross-device syncing, saved invoice statuses, and premium functionality.
