# DueGrove V1.2

A calm, privacy-friendly invoice generator for freelancers and small businesses, with local draft saving.

## Features

- Live invoice preview
- Business + client information
- Invoice number, issue date and due date
- USD, EUR, GBP, MAD and CAD support
- Add/remove line items
- Quantity and rate calculations
- Tax and discount percentages
- Notes
- Responsive interface
- Reliable PDF export using html2canvas + jsPDF
- Browser print / Save as PDF fallback
- Save invoice drafts locally in the browser
- Reopen saved invoices
- Duplicate saved invoices
- Delete saved invoices
- Saved/unsaved change indicator
- Ctrl/Cmd + S shortcut

## Run it

Open `index.html` in a browser, or use VS Code + Live Server.

## Important: local saving

Saved invoices use `localStorage`.

That means drafts are stored only:
- in the same browser
- on the same device
- until browser storage is cleared

V1.2 still has no account or cloud database, so drafts do not sync across devices.

## PDF export

The automatic PDF button uses `html2canvas` and `jsPDF` from CDNs, so it needs an internet connection.

If the export libraries cannot load, the app falls back to the browser print dialog.

## Future V2 ideas

- Accounts
- Cloud database
- Saved clients
- Saved business profile
- Invoice status (draft/sent/paid/overdue)
- Premium invoice templates
- Cross-device invoice history


## Brand

DueGrove uses a warm cream and deep green visual system inspired by premium stationery.
