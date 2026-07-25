const fs = require('fs');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const getEmailFrom = (label) => {
  const companyName = process.env.COMPANY_NAME || 'Billing System';
  const fromEmail = process.env.EMAIL_FROM;

  if (!fromEmail) {
    return null;
  }

  return `"${label || companyName}" <${fromEmail}>`;
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ EMAIL ERROR: Missing RESEND_API_KEY in .env');
      return false;
    }

    if (!process.env.EMAIL_FROM) {
      console.error('❌ EMAIL ERROR: Missing EMAIL_FROM in .env');
      return false;
    }

    console.log(`📧 Configuring email with Resend from: ${process.env.EMAIL_FROM}`);
    console.log('✅ Email configuration is VALID');
    return true;
  } catch (error) {
    console.error('❌ Email configuration ERROR:', error.message);
    return false;
  }
};

// Send test email
const sendTestEmail = async () => {
  try {
    const from = getEmailFrom(process.env.COMPANY_NAME || 'Billing System');
    if (!from) {
      console.log('❌ Cannot send test email: EMAIL_FROM not configured');
      return false;
    }

    if (!process.env.RESEND_API_KEY) {
      console.log('❌ Cannot send test email: RESEND_API_KEY not configured');
      return false;
    }

    const to = process.env.EMAIL_FROM;
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: 'Test Email from Billing System',
      text: 'If you receive this, your email configuration is working correctly!',
      html: '<h1>✅ Test Successful!</h1><p>Your billing system email is configured correctly.</p>'
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${data.id}`);
    console.log(`📧 Check inbox/spam folder of: ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    return false;
  }
};

// Send invoice email with PDF attachment
const sendInvoiceEmail = async (invoice, customer, pdfPath) => {
  try {
    const emailEnabled = (process.env.EMAIL_ENABLED || 'true').toString().toLowerCase() !== 'false';
    const companyName = process.env.COMPANY_NAME || 'Arshan UG';
    const currency = process.env.CURRENCY_SYMBOL || '₹';

    if (!emailEnabled) {
      console.log('⚠️ EMAIL_DISABLED - skipping sending email');
      return null;
    }

    // Validate customer email
    if (!customer || !customer.email) {
      console.error('❌ Customer email not available:', customer);
      throw new Error('Customer email not available');
    }

    console.log(`📧 Sending email to: ${customer.email}`);

    // Validate PDF path
    if (!pdfPath) {
      console.error('❌ PDF path not available');
      throw new Error('PDF path not available');
    }

    const from = getEmailFrom(`${companyName} - Billing`);
    if (!from) {
      throw new Error('Failed to create email sender. Check EMAIL_FROM in .env');
    }

    if (!process.env.RESEND_API_KEY) {
      throw new Error('Failed to send email. Check RESEND_API_KEY in .env');
    }

    const invoiceNumber = invoice.invoiceNumber || invoice._id || 'Unknown';
    const total = invoice.totalAmount !== undefined ? invoice.totalAmount : (invoice.total || 0);
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not specified';
    const status = invoice.status || 'UNPAID';

    // Create HTML email content with better formatting
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
              <p><strong>Total Amount:</strong> <span class="amount">${currency} ${total.toFixed(2)}</span></p>
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
    const pdfContent = fs.readFileSync(pdfPath);

    console.log('📧 Attempting to send email...');
    const { data, error } = await resend.emails.send({
      from,
      to: customer.email,
      subject: `Your Invoice from ${companyName} - ${invoiceNumber}`,
      html: htmlContent,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfContent
        }
      ]
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Email sent successfully!`);
    console.log(`📧 Message ID: ${data.id}`);
    console.log(`📧 To: ${customer.email}`);

    return data;

  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};

const sendPurchaseOrderEmail = async (purchaseOrder, vendor, pdfPath) => {
  try {
    const emailEnabled = (process.env.EMAIL_ENABLED || 'true').toString().toLowerCase() !== 'false';
    const companyName = process.env.COMPANY_NAME || 'Arshan UG';
    const currency = process.env.CURRENCY_SYMBOL || '₹';

    if (!emailEnabled) {
      console.log('⚠️ EMAIL_DISABLED - skipping purchase order email');
      return null;
    }

    if (!vendor || !vendor.email) {
      console.error('❌ Vendor email not available:', vendor);
      throw new Error('Vendor email not available');
    }

    if (!pdfPath) {
      console.error('❌ PDF path not available');
      throw new Error('PDF path not available');
    }

    const from = getEmailFrom(`${companyName} - Purchasing`);
    if (!from) {
      throw new Error('Failed to create email sender. Check EMAIL_FROM in .env');
    }

    if (!process.env.RESEND_API_KEY) {
      throw new Error('Failed to send email. Check RESEND_API_KEY in .env');
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
    const pdfContent = fs.readFileSync(pdfPath);

    console.log(`📧 Sending purchase order email to: ${vendor.email}`);
    const { data, error } = await resend.emails.send({
      from,
      to: vendor.email,
      subject: `Purchase Order ${poNumber} from ${companyName}`,
      html: htmlContent,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfContent
        }
      ]
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Purchase order email sent successfully! Message ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('❌ Purchase order email failed:', error.message);
    throw error;
  }
};

const sendReminderEmail = async (invoice, customer) => {
  try {
    const emailEnabled = (process.env.EMAIL_ENABLED || 'true').toString().toLowerCase() !== 'false';
    const companyName = process.env.COMPANY_NAME || 'Arshan UG';
    const currency = process.env.CURRENCY_SYMBOL || '₹';

    if (!emailEnabled) {
      console.log('⚠️ EMAIL_DISABLED - skipping reminder email');
      return null;
    }

    if (!customer || !customer.email) {
      console.error('❌ Customer email not available:', customer);
      throw new Error('Customer email not available');
    }

    const from = getEmailFrom(`${companyName} - Billing`);
    if (!from) {
      throw new Error('Failed to create email sender. Check EMAIL_FROM in .env');
    }

    if (!process.env.RESEND_API_KEY) {
      throw new Error('Failed to send email. Check RESEND_API_KEY in .env');
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
              <p><strong>Amount Due:</strong> <span class="amount">${currency} ${total.toFixed(2)}</span></p>
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

    console.log(`📧 Sending payment reminder to: ${customer.email}`);
    const { data, error } = await resend.emails.send({
      from,
      to: customer.email,
      subject: `Reminder: Invoice ${invoiceNumber} Payment Due - ${companyName}`,
      html: htmlContent
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Reminder email sent successfully! Message ID: ${data.id}`);
    return data;

  } catch (error) {
    console.error('❌ Reminder email failed:', error.message);
    throw error;
  }
};

module.exports = {
  sendInvoiceEmail,
  testEmailConfig,
  sendTestEmail,
  sendPurchaseOrderEmail,
  sendReminderEmail
};
