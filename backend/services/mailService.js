const nodemailer = require('nodemailer');

// Create transporter with better configuration
const createTransporter = () => {
  // Check credentials
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL ERROR: Missing EMAIL_USER or EMAIL_PASS in .env');
    return null;
  }

  console.log(`📧 Configuring email with: ${process.env.EMAIL_USER}`);

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // These options help with deliverability
    tls: {
      rejectUnauthorized: false
    },
    // Connection timeout
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  });
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;
    
    await transporter.verify();
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
    const transporter = createTransporter();
    if (!transporter) {
      console.log('❌ Cannot send test email: Transporter not available');
      return false;
    }
    
    const info = await transporter.sendMail({
      from: `"${process.env.COMPANY_NAME || 'Billing System'}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Test Email from Billing System',
      text: 'If you receive this, your email configuration is working correctly!',
      html: '<h1>✅ Test Successful!</h1><p>Your billing system email is configured correctly.</p>'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 Check inbox/spam folder of: ${process.env.EMAIL_USER}`);
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

    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Failed to create email transporter. Check EMAIL_USER and EMAIL_PASS in .env');
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

    const mailOptions = {
      from: `"${companyName} - Billing" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `Your Invoice from ${companyName} - ${invoiceNumber}`,
      html: htmlContent,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ]
    };

    console.log('📧 Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully!`);
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 To: ${customer.email}`);
    
    return info;
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('Invalid login')) {
      console.error('🔧 Fix: Your App Password is incorrect. Generate a new one at:');
      console.error('   https://myaccount.google.com/apppasswords');
    } else if (error.message.includes('Username and Password not accepted')) {
      console.error('🔧 Fix: Enable 2-Step Verification on your Google Account');
      console.error('   Then generate a new App Password');
    } else if (error.message.includes('connect ETIMEDOUT')) {
      console.error('🔧 Fix: Check your internet connection');
    }
    
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

    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Failed to create email transporter. Check EMAIL_USER and EMAIL_PASS in .env');
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

    const mailOptions = {
      from: `"${companyName} - Purchasing" <${process.env.EMAIL_USER}>`,
      to: vendor.email,
      subject: `Purchase Order ${poNumber} from ${companyName}`,
      html: htmlContent,
      attachments: [
        {
          filename: `PO_${poNumber}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ]
    };

    console.log(`📧 Sending purchase order email to: ${vendor.email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Purchase order email sent successfully! Message ID: ${info.messageId}`);
    return info;
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

    const transporter = createTransporter();
    if (!transporter) {
      throw new Error('Failed to create email transporter. Check EMAIL_USER and EMAIL_PASS in .env');
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

    const mailOptions = {
      from: `"${companyName} - Billing" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `Reminder: Invoice ${invoiceNumber} Payment Due - ${companyName}`,
      html: htmlContent
    };

    console.log(`📧 Sending payment reminder to: ${customer.email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder email sent successfully! Message ID: ${info.messageId}`);
    return info;

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