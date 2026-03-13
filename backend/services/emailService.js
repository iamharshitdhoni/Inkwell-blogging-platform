import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// EMAIL TRANSPORTER SETUP (Gmail SMTP - App Password)
// - Uses SMTP host: smtp.gmail.com
// - Port 587 with STARTTLS (secure: false)
// - Expects an App Password (16 chars) generated from Google account
// ============================================================================

// Prefer generic env names `EMAIL_USER`/`EMAIL_PASS`, fall back to legacy GMAIL_* names
const EMAIL_USER = process.env.EMAIL_USER || process.env.GMAIL_USER || '';
const EMAIL_PASS_RAW = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '';
const EMAIL_PASS = (EMAIL_PASS_RAW || '').toString().replace(/\s+/g, '');

const maskedUser = EMAIL_USER ? `${EMAIL_USER.replace(/(.{3}).+(@.+)$/, '$1***$2')}` : 'NOT SET';
console.log(`\n📧 [EMAIL SERVICE] Initializing Nodemailer (Gmail SMTP)`);
console.log(`   User: ${maskedUser}`);

// Basic environment validation
if (!EMAIL_USER || !EMAIL_PASS) {
  console.error(`\n❌ [EMAIL SERVICE] Missing email credentials in environment.`);
  console.error(`   Recommended variables in backend/.env:`);
  console.error(`     EMAIL_USER=yourgmail@gmail.com`);
  console.error(`     EMAIL_PASS=your_16_char_app_password`);
  console.error(`   No quotes or extra spaces. Restart server after changes.`);
} else if (EMAIL_PASS.length !== 16) {
  console.warn(`\n⚠️  [EMAIL SERVICE] App password length looks unexpected (${EMAIL_PASS.length} chars). Ensure this is a 16-character Gmail App Password.`);
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  // Keep logger/debug false in production; useful while debugging
  logger: process.env.NODE_ENV !== 'production',
  debug: process.env.NODE_ENV !== 'production',
  tls: {
    // Do not fail on invalid certs in dev environments behind certain proxies
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
});

// Verify transporter connection (runs on startup)
console.log(`\n🔍 [EMAIL SERVICE] Verifying Nodemailer transporter connection...`);
transporter.verify()
  .then(() => {
    console.log(`✅ [EMAIL SERVICE] Transporter verified - Ready to send emails`);
    console.log(`   SMTP Server: smtp.gmail.com:587 (STARTTLS)`);
    console.log(`   Auth: success for ${maskedUser}`);
  })
  .catch((error) => {
    console.error(`❌ [EMAIL SERVICE] Transporter verification failed!`);
    const errMsg = error && (error.message || error.response) ? (error.message || error.response) : String(error);
    console.error(`   Error: ${errMsg}`);
    // Try to map common Gmail errors to actionable messages
    if (/Authentication|Invalid login|535|534|534-5.7.9|5\.7\.8/.test(errMsg)) {
      console.error(`\n   Authentication failed:`);
      console.error(`   - Ensure 2-Step Verification is enabled for the Gmail account.`);
      console.error(`   - Generate an App Password (16 characters) and set it as EMAIL_PASS in backend/.env.`);
      console.error(`   - Do NOT use your regular Gmail password.`);
    } else if (/ENOTFOUND|ECONNECTION|ETIMEDOUT/.test(errMsg)) {
      console.error(`\n   Network / connection issue:`);
      console.error(`   - Check outbound SMTP access on port 587 and firewall/VPN settings.`);
    }
    console.error(`\n   Helpful tips:`);
    console.error(`   - Backend env variables: EMAIL_USER and EMAIL_PASS (or legacy GMAIL_USER/GMAIL_APP_PASSWORD).`);
    console.error(`   - No spaces or quotes in .env values. Restart the server after editing .env.`);
  });

export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: 'Email Verification - Blogging Bliss',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Blogging Bliss</h1>
            <p>Welcome to our community!</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-bottom: 15px;">Verify Your Email Address</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Thank you for registering with Blogging Bliss! To get started, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyLink}" style="
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                font-size: 16px;
              ">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #999; font-size: 13px; text-align: center; margin-top: 20px;">
              Or copy and paste this link in your browser:
            </p>
            
            <p style="color: #667eea; word-break: break-all; font-size: 12px; text-align: center;">
              ${verifyLink}
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              <strong>⏰ Important:</strong> This verification link expires in 15 minutes.<br>
              If you didn't register for this account, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error.message);
    throw new Error('Failed to send verification email');
  }
};

export const sendWelcomeEmail = async (email, userName) => {
  try {
    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: 'Welcome to Blogging Bliss!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Welcome to Blogging Bliss, ${userName}!</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 8px 8px;">
            <p style="color: #666; line-height: 1.6;">
              Your email has been verified successfully. Your account is now active and you can start exploring, writing, and sharing your thoughts.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/" style="
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
              ">
                Go to Blogging Bliss
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              If you have any questions, feel free to reach out to us.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error.message);
    // Don't throw - welcome email failure should not block user
    return false;
  }
};

/**
 * ============================================================================
 * SEND OTP EMAIL (ENHANCED WITH LOGGING)
 * ============================================================================
 * Sends OTP code via email for signup or login
 * 
 * IMPORTANT LOGS FOR DEBUGGING:
 * - Logs when OTP email generation STARTS
 * - Logs the actual OTP code being sent
 * - Logs when sendMail() is called and its response
 * - Logs any errors with full details
 * - Logs successful delivery
 */
export const sendOTPEmail = async (email, otpCode, purpose = 'signup') => {
  const startTime = Date.now();
  try {
    const timestamp = new Date().toISOString();
    
    console.log(`\n📧 [OTP EMAIL] Starting OTP email generation`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Recipient: ${email}`);
    console.log(`   Purpose: ${purpose}`);
    
    let subject, title, description;

    if (purpose === 'signup') {
      subject = 'Your Signup OTP - Blogging Bliss';
      title = 'Verify Your Email for Signup';
      description = 'Thank you for signing up! Use the OTP below to complete your registration.';
    } else if (purpose === 'login') {
      subject = 'Your Login OTP - Blogging Bliss';
      title = 'Your Login OTP';
      description = 'Use the OTP below to secure login to your account.';
    } else {
      subject = 'Your OTP - Blogging Bliss';
      title = 'Your Verification Code';
      description = 'Use the OTP below to proceed.';
    }

    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Blogging Bliss</h1>
            <p style="margin: 5px 0 0 0;">${title}</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 8px 8px;">
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              ${description}
            </p>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: white; border-radius: 8px; border: 2px dashed #667eea;">
              <p style="color: #999; margin: 0 0 10px 0; font-size: 14px;">Your Verification Code:</p>
              <p style="color: #667eea; font-size: 48px; font-weight: bold; margin: 0; letter-spacing: 5px;">
                ${otpCode.split('').join(' ')}
              </p>
              <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">Enter this code to proceed</p>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⏰ This OTP expires in 5 minutes.</strong><br>
                Do not share this code with anyone. Blogging Bliss staff will never ask for your OTP.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; margin: 0;">
              If you didn't request this OTP, please ignore this email or contact our support team immediately.
            </p>
          </div>
        </div>
      `,
    };

    console.log(`   📝 Email template prepared`);
    console.log(`      Subject: ${subject}`);
    console.log(`      From: ${mailOptions.from}`);
    console.log(`      To: ${mailOptions.to}`);

    // ============================================================================
    // ACTUAL EMAIL SENDING - THIS IS WHERE ERRORS USUALLY OCCUR
    // ============================================================================
    console.log(`   🌐 [EMAIL SEND] Attempting to send via Nodemailer...`);
    const sendResult = await transporter.sendMail(mailOptions);
    
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ [EMAIL SEND SUCCESS]`);
    console.log(`      Response ID: ${sendResult.response}`);
    console.log(`      Message ID: ${sendResult.messageId}`);
    console.log(`      Duration: ${duration}ms`);
    console.log(`\n✨ [OTP EMAIL] Successfully sent OTP email to ${email}\n`);
    
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`\n❌ [OTP EMAIL ERROR] Failed to send OTP email`);
    console.error(`   Timestamp: ${new Date().toISOString()}`);
    console.error(`   Recipient: ${email}`);
    console.error(`   Purpose: ${purpose}`);
    console.error(`   Error Code: ${error.code || 'UNKNOWN'}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Error Details: ${error.response || error.toString()}`);
    console.error(`   Duration: ${duration}ms`);
    console.error(`\n   🔧 Debugging Steps:`);
    console.error(`   1. Check .env file has EMAIL_USER set correctly (or GMAIL_USER legacy)`);
    console.error(`   2. Check .env file has EMAIL_PASS set to the 16-char App Password (no spaces)`);
    console.error(`   3. Verify Gmail account has 2FA enabled`);
    console.error(`   4. Generate new App Password in Gmail (Settings → Security → App Passwords)`);
    console.error(`   5. Check internet connection and SMTP port 587 access`);
    console.error(`\n   📧 SMTP Server: smtp.gmail.com:587`);
    console.error(`   🔓 Secure: false (TLS on port 587)`);
    console.error(`\n`);
    
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

export default { sendVerificationEmail, sendWelcomeEmail, sendOTPEmail };
