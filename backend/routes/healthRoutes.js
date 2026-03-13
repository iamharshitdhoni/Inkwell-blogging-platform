import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * ============================================================================
 * HEALTH CHECK ENDPOINT - Verify Email Configuration
 * ============================================================================
 * GET /api/health/email
 * 
 * Purpose: Verify that Nodemailer and Gmail configuration is working
 * 
 * Returns:
 * {
 *   "success": true/false,
 *   "message": "Status message",
 *   "details": {
 *     "nodemailerEnabled": true/false,
 *     "emailConfigured": true/false,
 *     "gmailUser": "email@gmail.com",
 *     "transporterVerified": true/false,
 *     "smtp": {
 *       "host": "smtp.gmail.com",
 *       "port": 587,
 *       "secure": false
 *     }
 *   }
 * }
 */
router.get('/email', async (req, res) => {
  try {
    console.log(`\n════════════════════════════════════════════════════════════════`);
    console.log(`🔍 [HEALTH CHECK] Email Configuration Verification`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    console.log(`════════════════════════════════════════════════════════════════`);

    // Check environment variables
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    console.log(`\n📋 [ENV VARIABLES]`);
    console.log(`   GMAIL_USER: ${gmailUser ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`   GMAIL_APP_PASSWORD: ${gmailAppPassword ? '✅ SET' : '❌ NOT SET'}`);

    if (!gmailUser || !gmailAppPassword) {
      console.log(`\n❌ [ERROR] Missing Gmail configuration`);
      return res.status(500).json({
        success: false,
        message: 'Gmail configuration incomplete',
        details: {
          nodemailerEnabled: true,
          emailConfigured: false,
          gmailUser: gmailUser || 'NOT SET',
          transporterVerified: false,
          missingFields: {
            gmailUser: !gmailUser,
            gmailAppPassword: !gmailAppPassword,
          },
        },
        hints: [
          '1. Set GMAIL_USER in .env file',
          '2. Set GMAIL_APP_PASSWORD in .env file (must be 16-character App Password, not account password)',
          '3. Ensure Gmail account has 2FA enabled',
          '4. Generate App Password: https://myaccount.google.com/u/0/apppasswords',
        ],
      });
    }

    console.log(`   Email: ${gmailUser}`);
    console.log(`   App Password Length: ${gmailAppPassword.length} characters`);

    // Test transporter
    console.log(`\n🔌 [TRANSPORTER] Creating Nodemailer transporter...`);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    console.log(`   ⏱️  [VERIFY] Testing transporter connection...`);
    const verifyResult = await transporter.verify();

    if (verifyResult) {
      console.log(`✅ [TRANSPORTER VERIFIED] Connection successful!`);
      console.log(`   SMTP: smtp.gmail.com:587`);
      console.log(`   Auth: OAuth2 with App Password`);
      console.log(`\n✨ [SUCCESS] Email configuration is working correctly`);
      console.log(`════════════════════════════════════════════════════════════════\n`);

      return res.status(200).json({
        success: true,
        message: 'Email configuration is working correctly',
        details: {
          nodemailerEnabled: true,
          emailConfigured: true,
          gmailUser: gmailUser,
          transporterVerified: true,
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            authentication: 'OAuth2 with App Password',
          },
        },
        hints: [
          '✅ All systems operational',
          '✅ Nodemailer can send emails',
          '✅ Gmail SMTP connection verified',
        ],
      });
    } else {
      console.log(`❌ [VERIFICATION FAILED] Connection test returned false`);
      return res.status(500).json({
        success: false,
        message: 'Email transporter verification failed',
        details: {
          nodemailerEnabled: true,
          emailConfigured: true,
          gmailUser: gmailUser,
          transporterVerified: false,
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
          },
        },
        hints: [
          'Probable causes:',
          '1. Gmail account password changed - regenerate App Password',
          '2. 2FA disabled - enable 2FA on Gmail account',
          '3. Internet/firewall blocking port 587',
          '4. App Password format incorrect',
        ],
      });
    }
  } catch (error) {
    console.error(`❌ [ERROR] ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.error(`════════════════════════════════════════════════════════════════\n`);

    return res.status(500).json({
      success: false,
      message: 'Error checking email configuration',
      error: error.message,
      errorCode: error.code || 'UNKNOWN',
      hints: [
        'Error might be due to:',
        `1. Incorrect App Password format (should be: XXXX XXXX XXXX XXXX with spaces)`,
        '2. Gmail account security: https://myaccount.google.com/apppasswords',
        '3. 2FA not enabled on Gmail account',
        '4. Network/firewall blocking SMTP server',
        '5. Check Gmail "Less secure app access" settings',
      ],
    });
  }
});

export default router;
