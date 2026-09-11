const fs = require('fs');
const { Resend } = require('resend');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error('RESEND_API_KEY is not configured');
    err.emailErrorType = 'config';
    throw err;
  }
  return new Resend(apiKey);
};

const extractEmailAddress = (value) => {
  if (!value) return '';
  const match = String(value).match(/<([^>]+)>/);
  return (match ? match[1] : value).trim();
};

const getEmailFrom = (label) => {
  const companyName = process.env.COMPANY_NAME || 'Billing System';
  const fromEmail = (process.env.EMAIL_FROM || '').trim();

  if (!fromEmail) {
    return null;
  }

  if (fromEmail.includes('<') && fromEmail.includes('>')) {
    return fromEmail;
  }

  return `${label || companyName} <${fromEmail}>`;
};

const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const classifyEmailError = (error, fallbackType = 'resend') => {
  const message = error?.message || String(error);
  const statusCode = error?.statusCode || error?.status || error?.status_code;
  const lower = message.toLowerCase();

  if (error?.emailErrorType) {
    return { type: error.emailErrorType, message, statusCode };
  }

  if (lower.includes('resend_api_key') || lower.includes('api key') || statusCode === 401) {
    return { type: 'config', message: 'Resend API key is missing or invalid', statusCode };
  }
  if (
    lower.includes('email_from') ||
    (lower.includes('from') && (lower.includes('invalid') || lower.includes('domain') || lower.includes('verified'))) ||
    statusCode === 403
  ) {
    return { type: 'invalid_sender', message, statusCode };
  }
  if (lower.includes('recipient') || lower.includes('to address') || lower.includes('invalid `to`')) {
    return { type: 'invalid_recipient', message, statusCode };
  }
  if (lower.includes('enoent') || lower.includes('pdf') && lower.includes('read')) {
    return { type: 'pdf_attachment', message, statusCode };
  }
  if (statusCode === 429 || (statusCode >= 500 && statusCode < 600) || lower.includes('timeout') || lower.includes('network') || lower.includes('econnreset') || lower.includes('fetch failed')) {
    return { type: 'resend', message, statusCode, retryable: true };
  }

  return { type: fallbackType, message, statusCode };
};

const logEmailFailure = (operation, classified, extra = {}) => {
  console.error(`❌ EMAIL FAILED [${operation}] type=${classified.type} status=${classified.statusCode || 'n/a'} message=${classified.message}`, extra);
};

const sendViaResend = async (payload, { operation }) => {
  const client = getResendClient();
  const maxAttempts = 2;
  let lastClassified;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await client.emails.send(payload);

      if (error) {
        const classified = classifyEmailError(error);
        if (classified.retryable && attempt < maxAttempts) {
          console.warn(`⚠️ EMAIL RETRY [${operation}] attempt=${attempt} type=${classified.type} message=${classified.message}`);
          await delay(800 * attempt);
          lastClassified = classified;
          continue;
        }
        const err = new Error(classified.message);
        err.emailErrorType = classified.type;
        err.statusCode = classified.statusCode;
        throw err;
      }

      if (!data || !data.id) {
        const err = new Error('Resend returned success without an email ID');
        err.emailErrorType = 'resend';
        throw err;
      }

      return data;
    } catch (error) {
      if (error?.emailErrorType) {
        throw error;
      }
      const classified = classifyEmailError(error);
      const err = new Error(classified.message);
      err.emailErrorType = classified.type;
      err.statusCode = classified.statusCode;
      throw err;
    }
  }

  const err = new Error(lastClassified?.message || 'Failed to send email');
  err.emailErrorType = lastClassified?.type || 'resend';
  throw err;
};

const readPdfAttachment = (pdfPath) => {
  if (!pdfPath) {
    const err = new Error('PDF path not available');
    err.emailErrorType = 'pdf_attachment';
    throw err;
  }
  try {
    const pdfContent = fs.readFileSync(pdfPath);
    if (!pdfContent || !pdfContent.length) {
      const err = new Error('PDF attachment is empty');
      err.emailErrorType = 'pdf_attachment';
      throw err;
    }
    return Buffer.from(pdfContent);
  } catch (error) {
    if (error.emailErrorType) throw error;
    const err = new Error(`Failed to read PDF attachment: ${error.message}`);
    err.emailErrorType = 'pdf_attachment';
    throw err;
  }
};

const isEmailDisabled = () => (process.env.EMAIL_ENABLED || 'true').toString().toLowerCase() === 'false';

const assertEmailReady = (recipientEmail) => {
  if (!process.env.EMAIL_FROM) {
    const err = new Error('EMAIL_FROM is not configured');
    err.emailErrorType = 'invalid_sender';
    throw err;
  }
  if (!process.env.RESEND_API_KEY) {
    const err = new Error('RESEND_API_KEY is not configured');
    err.emailErrorType = 'config';
    throw err;
  }
  if (!isValidEmail(recipientEmail)) {
    const err = new Error('Recipient email is missing or invalid');
    err.emailErrorType = 'invalid_recipient';
    throw err;
  }
};

const testEmailConfig = async () => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ EMAIL ERROR: Missing RESEND_API_KEY in environment');
      return false;
    }

    if (!process.env.EMAIL_FROM) {
      console.error('❌ EMAIL ERROR: Missing EMAIL_FROM in environment');
      return false;
    }

    const fromAddress = extractEmailAddress(process.env.EMAIL_FROM);
    const fromDomain = fromAddress.includes('@') ? fromAddress.split('@')[1] : 'unknown';
    console.log(`📧 Email provider: Resend`);
    console.log(`📧 EMAIL_FROM configured: yes (domain: ${fromDomain})`);
    console.log(`📧 RESEND_API_KEY configured: yes (length: ${process.env.RESEND_API_KEY.length})`);
    console.log('✅ Email configuration is VALID');
    return true;
  } catch (error) {
    console.error('❌ Email configuration ERROR:', error.message);
    return false;
  }
};

const sendTestEmail = async () => {
  try {
    const from = getEmailFrom(process.env.COMPANY_NAME || 'Billing System');
    if (!from) {
      console.log('❌ Cannot send test email: EMAIL_FROM not configured');
      return false;
    }

    const to = extractEmailAddress(process.env.EMAIL_FROM);
    const data = await sendViaResend({
      from,
      to,
      subject: 'Test Email from Billing System',
      text: 'If you receive this, your email configuration is working correctly!',
      html: '<h1>✅ Test Successful!</h1><p>Your billing system email is configured correctly.</p>'
    }, { operation: 'test-email' });

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${data.id}`);
    console.log('📧 Check inbox/spam folder of the configured EMAIL_FROM address');
    return true;
  } catch (error) {
    const classified = classifyEmailError(error);
    logEmailFailure('test-email', classified);
    return false;
  }
};

const sendInvoiceEmail = async (invoice, customer, pdfPath) => {
  try {
    const companyName = process.env.COMPANY_NAME || 'Arshan UG';
    const currency = process.env.CURRENCY_SYMBOL || '₹';

    if (isEmailDisabled()) {
      console.log('⚠️ EMAIL_DISABLED - skipping sending invoice email');
      return { skipped: true };
    }

    if (!customer || !customer.email) {
      const err = new Error('Customer email not available');
      err.emailErrorType = 'invalid_recipient';
      throw err;
    }

    assertEmailReady(customer.email);

    console.log(`📧 Sending invoice email to recipient domain: ${String(customer.email).split('@')[1] || 'unknown'}`);

    const from = getEmailFrom(`${companyName} - Billing`);
    if (!from) {
      const err = new Error('Failed to create email sender. Check EMAIL_FROM in environment');
      err.emailErrorType = 'invalid_sender';
      throw err;
    }

    const invoiceNumber = invoice.invoiceNumber || invoice._id || 'Unknown';
    const total = invoice.totalAmount !== undefined ? invoice.totalAmount : (invoice.total || 0);
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not specified';
    const status = invoice.status || 'UNPAID';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
          }
          .header {
            background: #4F46E5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
            margin: -20px -20px 0 -20px;
          }
          .content {
            padding: 20px;
          }
          .invoice-details {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${companyName}</h2>
            <p>Official Invoice</p>
          </div>
          <div class="content">
            <h3>Dear ${customer.name || 'Customer'},</h3>
            <p>Thank you for your business! Please find attached your invoice.</p>
            
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Invoice Date:</strong> ${new Date(invoice.date || Date.now()).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
              <p><strong>Status:</strong> ${status}</p>
              <p><strong>Total Amount:</strong> <span class="amount">${currency} ${Number(total).toFixed(2)}</span></p>
            </div>
            
            <p>Your invoice is attached as a PDF file. Please review the details.</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply directly.</p>
            <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const pdfFilename = `Invoice_${invoiceNumber}.pdf`;
    const pdfContent = readPdfAttachment(pdfPath);

    console.log('📧 Attempting to send invoice email via Resend...');
    const data = await sendViaResend({
      from,
      to: customer.email.trim(),
      subject: `Your Invoice from ${companyName} - ${invoiceNumber}`,
      html: htmlContent,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfContent.toString('base64'),
          contentType: 'application/pdf'
        }
      ]
    }, {
      operation: 'invoice-email'
    });

    console.log(`✅ Invoice email sent successfully! Message ID: ${data.id}`);
    return data;
  } catch (error) {
    const classified = classifyEmailError(error);
    logEmailFailure('invoice-email', classified, { invoiceNumber: invoice?.invoiceNumber });
    const err = new Error(classified.message);
    err.emailErrorType = classified.type;
    throw err;
  }
};

const sendPurchaseOrderEmail = async (purchaseOrder, vendor, pdfPath) => {
  try {
    const companyName = process.env.COMPANY_NAME || 'Arshan UG';
    const currency = process.env.CURRENCY_SYMBOL || '₹';

    if (isEmailDisabled()) {
      console.log('⚠️ EMAIL_DISABLED - skipping purchase order email');
      return { skipped: true };
    }

    if (!vendor || !vendor.email) {
      const err = new Error('Vendor email not available');
      err.emailErrorType = 'invalid_recipient';
      throw err;
    }

    assertEmailReady(vendor.email);

    const from = getEmailFrom(`${companyName} - Purchasing`);
    if (!from) {
      const err = new Error('Failed to create email sender. Check EMAIL_FROM in environment');
      err.emailErrorType = 'invalid_sender';
      throw err;
    }

    const poNumber = purchaseOrder.poNumber || purchaseOrder._id || 'Unknown';
    const total = purchaseOrder.total !== undefined ? purchaseOrder.total : 0;
    const date = purchaseOrder.date ? new Date(purchaseOrder.date).toLocaleDateString() : 'Not specified';
    const deliveryDate = purchaseOrder.deliveryDate ? new Date(purchaseOrder.deliveryDate).toLocaleDateString() : 'Not specified';
    const status = purchaseOrder.status || 'DRAFT';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Purchase Order ${poNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .details { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .amount { font-size: 22px; font-weight: bold; color: #2563eb; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #ddd; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${companyName}</h2>
            <p>Purchase Order</p>
          </div>
          <div class="content">
            <h3>Dear ${vendor.name || 'Vendor'},</h3>
            <p>Please find attached the purchase order we created for you.</p>
            <div class="details">
              <p><strong>PO Number:</strong> ${poNumber}</p>
              <p><strong>Order Date:</strong> ${date}</p>
              <p><strong>Delivery Date:</strong> ${deliveryDate}</p>
              <p><strong>Status:</strong> ${status}</p>
              <p><strong>Total Amount:</strong> <span class="amount">${currency} ${Number(total).toFixed(2)}</span></p>
            </div>
            <p>The purchase order is attached as a PDF. Please review and contact us if there are any questions.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${companyName}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const pdfFilename = `PO_${poNumber}.pdf`;
    const pdfContent = readPdfAttachment(pdfPath);

    console.log(`📧 Sending purchase order email to vendor domain: ${String(vendor.email).split('@')[1] || 'unknown'}`);
    const data = await sendViaResend({
      from,
      to: vendor.email.trim(),
      subject: `Purchase Order ${poNumber} from ${companyName}`,
      html: htmlContent,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfContent.toString('base64'),
          contentType: 'application/pdf'
        }
      ]
    }, { operation: 'purchase-order-email' });

    console.log(`✅ Purchase order email sent successfully! Message ID: ${data.id}`);
    return data;
  } catch (error) {
    const classified = classifyEmailError(error);
    logEmailFailure('purchase-order-email', classified, { poNumber: purchaseOrder?.poNumber });
    const err = new Error(classified.message);
    err.emailErrorType = classified.type;
    throw err;
  }
};

const sendReminderEmail = async (invoice, customer) => {
  try {
    const companyName = process.env.COMPANY_NAME || 'Arshan UG';
    const currency = process.env.CURRENCY_SYMBOL || '₹';

    if (isEmailDisabled()) {
      console.log('⚠️ EMAIL_DISABLED - skipping reminder email');
      return { skipped: true };
    }

    if (!customer || !customer.email) {
      const err = new Error('Customer email not available');
      err.emailErrorType = 'invalid_recipient';
      throw err;
    }

    assertEmailReady(customer.email);

    const from = getEmailFrom(`${companyName} - Billing`);
    if (!from) {
      const err = new Error('Failed to create email sender. Check EMAIL_FROM in environment');
      err.emailErrorType = 'invalid_sender';
      throw err;
    }

    const invoiceNumber = invoice.invoiceNumber || invoice._id || 'Unknown';
    const total = invoice.total !== undefined ? invoice.total : 0;
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not specified';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice Reminder - ${invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ffc107;
            border-radius: 10px;
            background: #fffbf0;
          }
          .header {
            background: #ff9800;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
            margin: -20px -20px 0 -20px;
          }
          .content {
            padding: 20px;
          }
          .invoice-details {
            background: #fff;
            padding: 15px;
            border-left: 4px solid #ff9800;
            margin: 15px 0;
          }
          .amount {
            font-size: 24px;
            font-weight: bold;
            color: #ff9800;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⏰ Invoice Reminder</h2>
            <p>Payment Due Soon</p>
          </div>
          <div class="content">
            <h3>Dear ${customer.name || 'Customer'},</h3>
            <p>This is a friendly reminder that payment for the following invoice is now due:</p>
            
            <div class="invoice-details">
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
              <p><strong>Amount Due:</strong> <span class="amount">${currency} ${Number(total).toFixed(2)}</span></p>
            </div>
            
            <p>Please process the payment at your earliest convenience. If you have already sent the payment, please disregard this reminder.</p>
            <p>If you have any questions or need assistance, feel free to reach out to us.</p>
          </div>
          <div class="footer">
            <p>This is an automated reminder. Please do not reply directly.</p>
            <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`📧 Sending payment reminder for ${invoiceNumber}`);
    const data = await sendViaResend({
      from,
      to: customer.email.trim(),
      subject: `Reminder: Invoice ${invoiceNumber} Payment Due - ${companyName}`,
      html: htmlContent
    }, {
      operation: 'reminder-email'
    });

    console.log(`✅ Reminder email sent successfully! Message ID: ${data.id}`);
    return data;
  } catch (error) {
    const classified = classifyEmailError(error);
    logEmailFailure('reminder-email', classified, { invoiceNumber: invoice?.invoiceNumber });
    const err = new Error(classified.message);
    err.emailErrorType = classified.type;
    throw err;
  }
};

module.exports = {
  sendInvoiceEmail,
  testEmailConfig,
  sendTestEmail,
  sendPurchaseOrderEmail,
  sendReminderEmail,
  getResendClient
};
