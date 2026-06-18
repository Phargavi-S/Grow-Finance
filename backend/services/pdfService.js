const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = async (data) => {
  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    serviceDate,
    customerNumber,
    seller,
    customer,
    items,
    vatRate,
    logoPath,
    closingText
  } = data;

  let net = 0;
  items.forEach(i => net += (i.quantity || 0) * (i.rate || 0));
  const vat = net * (vatRate / 100);
  const total = net + vat;

  const format = (n) =>
  Number(n || 0).toFixed(2).replace('.', ',') + ' €';

  // ===== LOGO BASE64 =====
  let logoBase64 = '';

  if (logoPath && fs.existsSync(logoPath)) {
    const ext = path.extname(logoPath).toLowerCase();
    const buffer = fs.readFileSync(logoPath);

    let mime = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';

    logoBase64 = `data:${mime};base64,${buffer.toString('base64')}`;
  }

  // ===== HTML =====
  const html = `
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        margin: 40px;
        color: #000;
        position: relative;
        min-height: 1000px;
      }

      .top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 25px;
      }

      .company {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .company img {
        width: 80px;
      }

      .right {
        text-align: right;
        font-size: 12px;
        line-height: 1.6;
        margin-top: 70px;
      }

      .section {
        margin-top: 30px;
      }

      h2 {
        margin-bottom: 5px;
      }

      .title-row {
        white-space: nowrap;
        width: 100%;
      }

      .title-row > div {
        display: inline-block;
        white-space: nowrap;
        margin-right: 40px;
      }

      .title-row > div:last-child {
        margin-right: 0;
      }

      .line {
        border-bottom: 1px solid black;
        margin-top: 5px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }

      th, td {
        border: 1px solid black;
        padding: 6px;
        font-size: 11px;
      }

      th {
        background: #eee;
      }

      td.number {
        text-align: right;
      }

      td.text {
        text-align: left;
      }

      .bottom-section {
        margin-top: 30px;
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        line-height: 1.6;
      }

      .bottom-left {
        max-width: 55%;
      }

      .bottom-right {
        text-align: right;
        min-width: 200px;
      }

      .bottom-right .total-line {
        display: flex;
        justify-content: flex-end;
      }

      .total-label {
        min-width: 120px;
        text-align: left;
      }

      .total-value {
        min-width: 90px;
        text-align: right;
      }

      .total-amount {
        font-weight: bold;
      }

      /* ===== FIXED FOOTER ===== */
      .footer {
        position: absolute;
        bottom: 25px;
        left: 40px;
        right: 40px;
        border-top: 1px solid black;
        padding-top: 8px;
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        line-height: 1.4;
      }

      .footer div {
        flex: 1;
      }

      .footer div:nth-child(2) {
        text-align: center;
      }

      .footer div:nth-child(3) {
        text-align: right;
      }

    </style>
  </head>

  <body>

    <div class="top">
      <div class="company">
        ${logoBase64 ? `<img src="${logoBase64}" />` : ''}
      </div>

      <div class="right">
        ${seller.name}<br/>
        ${seller.street}<br/>
        ${seller.postalCode} ${seller.city}<br/><br/>
        Telefon: ${seller.phone}<br/>
        E-Mail: ${seller.email}<br/>
        Web: ${seller.website}
      </div>
    </div>

    <div class="section">
      <b>${customer.name}</b><br/>
      ${customer.street}<br/>
      ${customer.postalCode} ${customer.city}${customer.state ? ', ' + customer.state : ''}
    </div>

    <div class="section">
      <h2>Rechnung</h2>
      <div class="title-row">
        <div>Rechnung Nr.: ${invoiceNumber}</div>
        <div>Kunde Nr.: ${customerNumber}</div>
        <div>Datum: ${invoiceDate}</div>
      </div>
      <div class="line"></div>
    </div>

    <table>
      <tr>
        <th>Pos</th>
        <th>Beschreibung</th>
        <th>Einzelpreis</th>
        <th>Anzahl</th>
        <th>Gesamtpreis</th>
      </tr>

      ${items.map((item, i) => `
        <tr>
          <td class="number">${i + 1}</td>
          <td class="text">${item.description || item.name || ''}</td>
          <td class="number">${format(item.rate)}</td>
          <td class="number">${item.quantity}</td>
          <td class="number">${format((item.quantity || 0) * (item.rate || 0))}</td>
        </tr>
      `).join('')}
    </table>

    <div class="bottom-section">
      <div class="bottom-left">
        Der Gesamtbetrag ist bis zum ${dueDate} fällig.<br/>
        Leistungsdatum: ${serviceDate}
        ${closingText ? `<br/><br/>${closingText}` : ''}
      </div>

      <div class="bottom-right">
        <div class="total-line">
          <span class="total-label">Nettobetrag:</span>
          <span class="total-value">${format(net)}</span>
        </div>
        <div class="total-line">
          <span class="total-label">zzgl. ${vatRate}% MwSt:</span>
          <span class="total-value">${format(vat)}</span>
        </div>
        <div class="total-line total-amount">
          <span class="total-label">Gesamtbetrag:</span>
          <span class="total-value">${format(total)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>
        ${seller.name}<br/>
        ${seller.street}<br/>
        ${seller.postalCode} ${seller.city}
      </div>

      <div>
        USt-IdNr.: ${seller.vatId}<br/>
        Steuernummer: ${seller.taxNumber}<br/>
        Inhaber: ${seller.owner}
      </div>

      <div>
        ${seller.bank}<br/>
        IBAN: ${seller.iban}<br/>
        BIC: ${seller.bic}
      </div>
    </div>

  </body>
  </html>
  `;

  // ===== PDF =====
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true
  });

  await browser.close();

  return pdf;
};

// ===== PURCHASE ORDER PDF =====
const generatePurchaseOrderPDF = async (data) => {
  const { poNumber, poDate, deliveryDate, seller, vendor, items = [], subtotal = 0, tax = 0, total = 0, logoPath } = data;

  const format = (n) => (n || 0).toFixed(2).replace('.', ',') + ' €';

  // logo
  let logoBase64 = '';
  if (logoPath && fs.existsSync(logoPath)) {
    const ext = path.extname(logoPath).toLowerCase();
    const buffer = fs.readFileSync(logoPath);
    let mime = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
    logoBase64 = `data:${mime};base64,${buffer.toString('base64')}`;
  }

  const html = `
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; margin: 40px; color: #000; }
      .top { display:flex; justify-content:space-between; }
      .company { display:flex; flex-direction:column; gap:12px; align-items:center }
      .company img { width:70px }
      .right { text-align:right }
      table { width:100%; border-collapse:collapse; margin-top:18px }
      th, td { border:1px solid #ddd; padding:8px; font-size:12px }
      th { background:#f3f4f6 }
      .footer { margin-top:24px; font-size:11px }
      .status { font-weight:bold }
    </style>
  </head>
  <body>
    <div class="top">
      <div class="company">
        ${logoBase64 ? `<img src="${logoBase64}" />` : ''}
        <div>
          <h2 style="margin:0">${seller.name}</h2>
          <div style="font-size:11px; color:#444">${seller.street || ''}</div>
        </div>
      </div>
      <div class="right">
        <div>PO #: ${poNumber}</div>
        <div>Date: ${poDate || ''}</div>
        <div>Delivery: ${deliveryDate || ''}</div>
      </div>
    </div>

    <div style="margin-top:18px">
      <strong>Vendor</strong><br/>
      ${vendor.name || ''}<br/>
      ${vendor.street || ''}<br/>
      ${vendor.postalCode || ''} ${vendor.city || ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Unit Price</th>
          <th>Qty</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((it, i) => `
          <tr>
            <td>${i+1}</td>
            <td>${it.description || it.name || ''}</td>
            <td style="text-align:right">${format(it.rate)}</td>
            <td style="text-align:right">${it.quantity || 0}</td>
            <td style="text-align:right">${format(it.amount || (it.quantity * it.rate))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="display:flex; justify-content:flex-end; margin-top:12px">
      <div style="width:320px">
        <div style="display:flex; justify-content:space-between; padding:6px 0"> <span>Subtotal</span> <span>${format(subtotal)}</span></div>
        <div style="display:flex; justify-content:space-between; padding:6px 0"> <span>Tax</span> <span>${format(tax)}</span></div>
        <div style="display:flex; justify-content:space-between; padding:6px 0; font-weight:bold"> <span>Total</span> <span>${format(total)}</span></div>
      </div>
    </div>

    <div class="footer">
      ${seller.name} • ${seller.street} • ${seller.city}
    </div>
  </body>
  </html>
  `;

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  return pdf;
};

module.exports = { generateInvoicePDF, generatePurchaseOrderPDF };