require('dotenv').config();
const { testEmailConfig, sendTestEmail } = require('./services/mailService');

async function test() {
  console.log('========================================');
  console.log('TESTING EMAIL CONFIGURATION (Resend)');
  console.log('========================================');
  console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM ? '✓ Set' : '✗ Missing'}`);
  console.log(`EMAIL_ENABLED: ${process.env.EMAIL_ENABLED || 'true'}`);
  console.log('========================================\n');

  const configValid = await testEmailConfig();

  if (configValid) {
    console.log('\n Sending test email...');
    await sendTestEmail();
  } else {
    console.log('\n Email configuration is invalid. Please check:');
    console.log('   1. RESEND_API_KEY is set');
    console.log('   2. EMAIL_FROM uses a verified Resend domain/sender');
    console.log('   3. EMAIL_ENABLED is not set to false');
  }
}

test();
