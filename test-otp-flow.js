#!/usr/bin/env node

/**
 * ============================================================================
 * OTP EMAIL SYSTEM - COMPLETE TESTING SCRIPT
 * ============================================================================
 * 
 * This script tests the entire OTP email flow:
 * 1. Health check (Nodemailer configuration)
 * 2. Send OTP for signup
 * 3. Verify OTP code
 * 4. Send OTP for login
 * 5. Verify OTP for login
 * 
 * Usage:
 *   node test-otp-flow.js
 * 
 * Requirements:
 *   - Backend running on http://localhost:5000
 *   - MongoDB running
 *   - .env file configured with Gmail credentials
 */

import axios from 'axios';
import readline from 'readline';

const BASE_URL = 'http://localhost:5000/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  data: (msg) => console.log(`${colors.magenta}${msg}${colors.reset}`),
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisified question function
const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  log.title('🔍 TEST 1: Health Check (Email Configuration)');
  
  try {
    const response = await axios.get(`${BASE_URL}/health/email`);
    
    if (response.data.success) {
      log.success('Email configuration is working!');
      log.info(`Gmail User: ${response.data.details.gmailUser}`);
      log.info(`SMTP: ${response.data.details.smtp.host}:${response.data.details.smtp.port}`);
      log.success('Transporter verified: YES');
      return true;
    } else {
      log.error('Email configuration failed!');
      log.error(`Message: ${response.data.message}`);
      if (response.data.hints) {
        log.warning('Hints:');
        response.data.hints.forEach((hint) => console.log(`  • ${hint}`));
      }
      return false;
    }
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    if (error.response?.status === 500) {
      log.error(`Server Error: ${error.response.data?.message}`);
      if (error.response.data?.hints) {
        log.warning('Hints:');
        error.response.data.hints.forEach((hint) => console.log(`  • ${hint}`));
      }
    } else if (!error.response) {
      log.error('Cannot connect to backend. Is the server running on port 5000?');
    }
    return false;
  }
}

/**
 * Test 2: Send OTP for Signup
 */
async function testSendSignupOTP(email) {
  log.title(`📧 TEST 2: Send OTP for Signup`);
  log.info(`Email: ${email}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/otp/send-signup-otp`, {
      email: email,
    });
    
    if (response.status === 200) {
      log.success('OTP sent successfully!');
      log.info(`Message: ${response.data.message}`);
      log.info(`Expires at: ${response.data.expiresAt}`);
      return { success: true, response: response.data };
    } else {
      log.error(`Unexpected status: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    if (error.response?.status === 409) {
      log.warning('Email already registered. Try TEST 4 (Login) instead.');
      return { success: false, code: 'EMAIL_REGISTERED' };
    } else if (error.response?.status === 429) {
      log.warning('OTP already sent. Please wait 5 minutes.');
      return { success: false, code: 'OTP_ALREADY_SENT' };
    } else if (error.response?.status === 500) {
      log.error(`Server Error: ${error.response.data?.message}`);
      log.error(`Details: ${error.response.data?.error}`);
      return { success: false, code: 'SERVER_ERROR' };
    } else {
      log.error(`Request failed: ${error.message}`);
      return { success: false };
    }
  }
}

/**
 * Test 3: Verify OTP for Signup
 */
async function testVerifySignupOTP(email, otpCode, name) {
  log.title(`✅ TEST 3: Verify OTP for Signup`);
  log.info(`Email: ${email}`);
  log.info(`OTP Code: ${otpCode}`);
  log.info(`Name: ${name}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/otp/verify-signup-otp`, {
      email: email,
      otp: otpCode,
      name: name,
    });
    
    if (response.status === 201) {
      log.success('Account created successfully!');
      log.success(`JWT Token: ${response.data.token.substring(0, 20)}...`);
      log.info(`User ID: ${response.data.user._id}`);
      log.info(`Role: ${response.data.user.role}`);
      return { success: true, response: response.data };
    } else {
      log.error(`Unexpected status: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    if (error.response?.status === 400) {
      log.error(`Invalid OTP: ${error.response.data?.message}`);
      if (error.response.data?.attemptsRemaining !== undefined) {
        log.warning(`Attempts remaining: ${error.response.data.attemptsRemaining}`);
      }
      return { success: false, code: 'INVALID_OTP' };
    } else if (error.response?.status === 409) {
      log.error(`Email already registered`);
      return { success: false, code: 'EMAIL_REGISTERED' };
    } else {
      log.error(`Request failed: ${error.response?.data?.message || error.message}`);
      return { success: false };
    }
  }
}

/**
 * Test 4: Send OTP for Login
 */
async function testSendLoginOTP(email) {
  log.title(`📧 TEST 4: Send OTP for Login`);
  log.info(`Email: ${email}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/otp/send-login-otp`, {
      email: email,
    });
    
    if (response.status === 200) {
      log.success('OTP sent successfully!');
      log.info(`Message: ${response.data.message}`);
      return { success: true, response: response.data };
    } else {
      log.error(`Unexpected status: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    if (error.response?.status === 404) {
      log.error('User not found. Sign up first with TEST 2.');
      return { success: false, code: 'USER_NOT_FOUND' };
    } else if (error.response?.status === 429) {
      log.warning('OTP already sent. Please wait 5 minutes.');
      return { success: false, code: 'OTP_ALREADY_SENT' };
    } else if (error.response?.status === 500) {
      log.error(`Server Error: ${error.response.data?.message}`);
      return { success: false, code: 'SERVER_ERROR' };
    } else {
      log.error(`Request failed: ${error.message}`);
      return { success: false };
    }
  }
}

/**
 * Test 5: Verify OTP for Login
 */
async function testVerifyLoginOTP(email, otpCode) {
  log.title(`✅ TEST 5: Verify OTP for Login`);
  log.info(`Email: ${email}`);
  log.info(`OTP Code: ${otpCode}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/otp/verify-login-otp`, {
      email: email,
      otp: otpCode,
    });
    
    if (response.status === 200) {
      log.success('Login successful!');
      log.success(`JWT Token: ${response.data.token.substring(0, 20)}...`);
      log.info(`User: ${response.data.user.name}`);
      return { success: true, response: response.data };
    } else {
      log.error(`Unexpected status: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    if (error.response?.status === 400) {
      log.error(`Invalid OTP: ${error.response.data?.message}`);
      return { success: false, code: 'INVALID_OTP' };
    } else if (error.response?.status === 404) {
      log.error('User not found');
      return { success: false, code: 'USER_NOT_FOUND' };
    } else {
      log.error(`Request failed: ${error.response?.data?.message || error.message}`);
      return { success: false };
    }
  }
}

// ============================================================================
// MAIN TESTING FLOW
// ============================================================================

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     OTP EMAIL SYSTEM - COMPLETE TESTING SCRIPT                ║
║                                                                ║
║  This script will test the entire OTP email flow              ║
║  Make sure backend is running: npm start                      ║
╚════════════════════════════════════════════════════════════════╝
  `);

  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  
  if (!healthOk) {
    log.error('\nEmail configuration is not working. Fix the issues above first.');
    log.info('See OTP_EMAIL_SETUP_GUIDE.md for help');
    rl.close();
    return;
  }

  log.success('All prerequisites are ready!\n');

  // Ask user for test email
  const testEmail = await question(
    `${colors.cyan}Enter email for testing (must not be registered):${colors.reset} `
  );

  if (!testEmail.includes('@')) {
    log.error('Invalid email format');
    rl.close();
    return;
  }

  // Test 2: Send OTP for Signup
  const signup = await testSendSignupOTP(testEmail);
  
  if (!signup.success) {
    log.error('\nCannot proceed with signup test.');
    rl.close();
    return;
  }

  // Get OTP code from user
  const otpCode = await question(
    `${colors.cyan}Enter the OTP code you received via email:${colors.reset} `
  );

  if (!otpCode || otpCode.length !== 6) {
    log.error('Invalid OTP format (must be 6 digits)');
    rl.close();
    return;
  }

  // Get user name
  const userName = await question(
    `${colors.cyan}Enter name for the account:${colors.reset} `
  );

  // Test 3: Verify OTP for Signup
  const signupVerify = await testVerifySignupOTP(testEmail, otpCode, userName);
  
  if (signupVerify.success) {
    log.success('\n✨ Account successfully created via OTP!');
    
    // Test 4: Send OTP for Login
    const loginOtp = await testSendLoginOTP(testEmail);
    
    if (loginOtp.success) {
      // Get login OTP from user
      const loginOtpCode = await question(
        `${colors.cyan}Enter the OTP code for login:${colors.reset} `
      );

      // Test 5: Verify OTP for Login
      const loginVerify = await testVerifyLoginOTP(testEmail, loginOtpCode);
      
      if (loginVerify.success) {
        log.success('\n\n🎉 ALL TESTS PASSED! OTP EMAIL SYSTEM IS WORKING!\n');
      } else {
        log.error('\nLogin OTP verification failed.');
      }
    } else {
      log.error('\nLogin OTP send failed.');
    }
  } else {
    log.error('\nSignup OTP verification failed.');
  }

  rl.close();
}

main().catch((error) => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
