require('dotenv').config();
const { testEmailConfig, sendTestEmail } = require('./services/mailService');

async function test() {
  console.log('========================================');
  console.log('TESTING EMAIL CONFIGURATION');
  console.log('========================================');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✓ Set (length: ' + process.env.EMAIL_PASS.length + ')' : '✗ Missing'}`);
  console.log(`EMAIL_ENABLED: ${process.env.EMAIL_ENABLED}`);
  console.log('========================================\n');
  
  // Test configuration
  const configValid = await testEmailConfig();
  
  if (configValid) {
    console.log('\n Sending test email...');
    await sendTestEmail();
    console.log('\n Check your inbox/spam folder at:', process.env.EMAIL_USER);
  } else {
    console.log('\n Email configuration is invalid. Please check:');
    console.log('   1. EMAIL_USER is correct');
    console.log('   2. EMAIL_PASS is the 16-character App Password (no spaces)');
    console.log('   3. 2-Step Verification is enabled on your Google Account');
    console.log('   4. Generate a new App Password at: https://myaccount.google.com/apppasswords');
  }
}

test();