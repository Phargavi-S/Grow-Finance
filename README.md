# Billing System (Fullstack)

This repository contains a Node/Express backend and a React frontend for a billing/invoicing system.

## Backend quick setup

1. Copy `.env.example` to `.env` and fill in values (especially `MONGO_URI`, `EMAIL_USER`, `EMAIL_PASS`).

2. Install dependencies and seed sample items:

```bash
cd backend
npm install
npm run seed:items
```

3. Start backend:

```bash
npm run dev
```

4. Optional: run the quick invoice script to create a test customer + invoice, generate PDF, and (optionally) send email:

```bash
# Generates invoice and attempts to email if EMAIL_ENABLED=true in .env
npm run quick:invoice

# or explicitly disable email while testing
EMAIL_ENABLED=false npm run quick:invoice
```

PDF files are written to the `invoices/` directory.

## Frontend quick setup

```bash
cd frontend
npm install
npm start
```

The frontend expects the backend API at `http://localhost:5000/api` (this is set in `frontend/src/App.js`).

## Notes

- Email sending uses Gmail by default via `nodemailer`. Use an app password for `EMAIL_PASS` if you have 2FA enabled.
- Invoice numbers are generated sequentially using a `Counter` model to ensure orderwise numbering.
- Use `EMAIL_ENABLED=false` to disable actual email sends during local testing.

Files to review:
- Backend: [backend/services/mailService.js](backend/services/mailService.js)
- Backend: [backend/services/pdfService.js](backend/services/pdfService.js)
- Backend: [backend/controllers/invoiceController.js](backend/controllers/invoiceController.js)
- Backend seed script: [backend/tools/seedSectionsAndItems.js](backend/tools/seedSectionsAndItems.js)
- Quick test script: [backend/tools/quickCreateInvoice.js](backend/tools/quickCreateInvoice.js)
