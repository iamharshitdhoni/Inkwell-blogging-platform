# 🚀 Blogging Bliss - OTP Authentication System

Welcome! Your MERN blogging platform now features a complete **Email OTP-Based Authentication System** with role selection and secure email verification.

---

## 📖 Documentation Index

| Document | Purpose |
|----------|---------|
| **[COMPLETE_OTP_SUMMARY.md](./COMPLETE_OTP_SUMMARY.md)** | 📦 Implementation overview & technical details |
| **[OTP_AUTHENTICATION_SYSTEM.md](./OTP_AUTHENTICATION_SYSTEM.md)** | 🔐 Complete system architecture & API docs |
| **[OTP_QUICK_START_TESTING.md](./OTP_QUICK_START_TESTING.md)** | 🧪 Quick start guide & 7 test scenarios |

---

## ⚡ Quick Start (2 minutes)

### 1️⃣ Setup Backend

```bash
cd backend

# Configure Gmail (IMPORTANT!)
# Copy .env.example to .env:
cp .env.example .env

# Edit .env and add:
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your 16char app password

# Install & start
npm install
npm run dev
```

**Expected output:**
```
✅ [EMAIL SERVICE] Transporter verified - Ready to send emails
📊 MongoDB Connected
🚀 Server running on port 5000
```

### 2️⃣ Setup Frontend

```bash
cd frontend

# Install & start
npm install
npm run dev
```

**Browser opens to:** `http://localhost:5173`

### 3️⃣ Start Using!

```
1. Navigate to: http://localhost:5173/auth
2. Click "Create New Account"
3. Fill in form:
   - Name: Your name
   - Email: your-email@gmail.com
   - Role: Reader or Writer
4. Click "Send OTP"
5. Check email for 6-digit code
6. Paste code into app
7. ✅ Account created!
```

---

## 🔧 Setup Guide

### Prerequisites

- Node.js 14+
- MongoDB (running on localhost:27017)
- Gmail account with 2FA enabled

### Gmail Setup (CRITICAL)

**Without this, email won't work!**

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Copy the 16-character password (includes spaces)
4. Paste into `.env` as `GMAIL_APP_PASSWORD`

Example `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/blogDB
JWT_SECRET=your-secret-key
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Verify Setup

```bash
# Backend should show on startup:
✅ [EMAIL SERVICE] Transporter verified - Ready to send emails

# If you see an error instead:
❌ [EMAIL SERVICE] Transporter verification failed!
   → Check GMAIL_USER is correct
   → Check GMAIL_APP_PASSWORD is 16 chars with spaces
   → Verify 2FA is enabled on Gmail account
```

---

## ✨ Features

### Authentication
- 🔐 **Passwordless login** - OTP via email, no passwords
- 📧 **Email verification** - Ownership confirmed via OTP
- ⏰ **6-digit codes** - 5-minute expiry for security
- 🔄 **Automatic cleanup** - Expired OTPs deleted automatically

### User Roles
- 👤 **Reader** - Browse & engage with blog posts
- ✍️ **Writer** - Create & publish blog posts
- 🔑 **Auto-redirect** - Reader → Home, Writer → Editor

### Security
- 🔒 **Gmail App Passwords** - Secure, not account password
- 🛡️ **Rate limiting** - Max 1 OTP per 5 minutes
- 📍 **Location verification** - Email ownership checked
- 🗑️ **Auto-cleanup** - No stored OTPs lingering
- 🔐 **JWT tokens** - Secure session management

### User Experience
- ⏱️ **Live countdown** - See OTP expiry in real-time
- 📱 **Mobile friendly** - Works on all devices
- 🎨 **Beautiful UI** - Dark mode support
- ✅ **Clear errors** - Helpful error messages
- 🔙 **Easy navigation** - Back buttons between screens

---

## 🧪 Testing

### Quick Test (5 minutes)

```bash
# 1. Start both servers (backend & frontend)

# 2. Open: http://localhost:5173/auth

# 3. Complete signup:
   - Name: Test User
   - Email: test@gmail.com
   - Role: Reader
   - Send OTP → Check email → Enter code

# 4. Expected:
   - ✅ Account created
   - ✅ Redirected to home
   - ✅ Logged in

# 5. Logout (if available) and login:
   - Email: test@gmail.com
   - Send OTP → Check email → Enter code
   - ✅ Logged in again
```

### Full Testing (30 minutes)

See **[OTP_QUICK_START_TESTING.md](./OTP_QUICK_START_TESTING.md)** for:
- 7 comprehensive test scenarios
- Edge case testing
- Debugging guide
- Troubleshooting checklist

---

## 📊 User Flows

### Signup Flow
```
┌─────────────────┐
│ Click "Sign Up" │
└────────┬────────┘
         │
    ┌────▼─────────────────────┐
    │ Enter: Name, Email, Role │
    │ Click "Send OTP"         │
    └────┬─────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ Receive OTP via Email     │
    │ Enter 6-digit code        │
    │ Click "Verify OTP"        │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ Account Created ✅        │
    │ Auto-redirect by Role:    │
    │ Reader → Home             │
    │ Writer → Editor           │
    └───────────────────────────┘
```

### Login Flow
```
┌──────────────────┐
│ Click "Sign In"  │
└────────┬─────────┘
         │
    ┌────▼──────────────────────┐
    │ Enter Email                │
    │ Click "Send OTP"          │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ Receive OTP via Email     │
    │ Enter 6-digit code        │
    │ Click "Sign In"           │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ Logged In ✅              │
    │ Auto-redirect by Role     │
    └───────────────────────────┘
```

---

## 🔍 How It Works

### 1. User Enters Email
- Email validated for format
- Email checked if already registered
- Rate limit checked (1 OTP per 5 min)

### 2. OTP Generated & Sent
- Random 6-digit code generated
- Stored in MongoDB with 5-min expiry
- Email sent via Gmail SMTP
- Countdown timer starts on frontend

### 3. User Enters OTP
- 6-digit validation
- Not expired check
- Correct code validation
- Attempt limit check (max 5)

### 4. OTP Verified, Account Created/Login
- User account created (signup) OR user fetched (login)
- OTP deleted from database
- JWT token generated
- User logged in
- Redirected to correct dashboard

---

## 🐛 Troubleshooting

### "Failed to send OTP email"
```
Check:
1. Is GMAIL_USER set in .env?
2. Is GMAIL_APP_PASSWORD exactly 16 chars with spaces?
3. Is 2FA enabled on Gmail account?
4. Try generating NEW app password (old ones expire)
5. Check internet connection
```

### "OTP not received"
```
Check:
1. Gmail spam/promotions folder
2. Backend console shows OTP code?
3. Email address spelled correctly?
4. Check email forwarding rules
```

### "User not logged in after verification"
```
Check:
1. DevTools → Application → localStorage
2. Should have: auth_token, auth_user
3. Try manual refresh
4. Check browser console for errors
```

### "Wrong redirect after login"
```
Check:
1. User role in localStorage → auth_user → role
2. Should be "user" (reader) or "author" (writer)
3. /write and / routes exist in app
```

**More help:** See [OTP_QUICK_START_TESTING.md - Debugging Checklist](./OTP_QUICK_START_TESTING.md)

---

## 📝 API Endpoints

### Send OTP (Signup)
```
POST /api/auth/otp/send-signup-otp
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "OTP sent successfully",
  "email": "user@example.com",
  "expiresAt": "2026-02-10T10:35:00Z"
}
```

### Verify OTP (Signup)
```
POST /api/auth/otp/verify-signup-otp
{
  "email": "user@example.com",
  "otp": "123456",
  "name": "John Doe",
  "username": "johndoe"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiI...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "isEmailVerified": true
  }
}
```

### Send OTP (Login)
```
POST /api/auth/otp/send-login-otp
{ "email": "user@example.com" }
```

### Verify OTP (Login)
```
POST /api/auth/otp/verify-login-otp
{
  "email": "user@example.com",
  "otp": "123456"
}
```

---

## 🎯 Common Use Cases

### For Development/Testing
1. Use test Gmail account to receive OTPs
2. Check backend console for OTP code (useful if email setup fails)
3. Use same email multiple times to test login
4. Wait for OTP expiry to test retry flow

### For Production
1. Use company Gmail or SendGrid
2. Set strong JWT_SECRET (not "Harshika0115")
3. Enable HTTPS
4. Set NODE_ENV=production
5. Use production MongoDB Atlas URL
6. Monitor OTP failure rates
7. Set up email service alerts

---

## 📚 Files You Should Know About

### Backend
- `backend/routes/authRoutes.js` - OTP routes
- `backend/controllers/otpAuthController.js` - OTP logic
- `backend/services/otpService.js` - OTP database ops
- `backend/services/emailService.js` - Gmail integration
- `backend/models/otp.js` - OTP schema
- `backend/models/userModel.js` - User schema with role

### Frontend
- `frontend/src/pages/AuthPageOTP.tsx` - Complete OTP UI
- `frontend/src/contexts/AuthContext.tsx` - Auth state & methods
- `frontend/src/lib/api.ts` - API functions
- `frontend/src/App.tsx` - Route definitions

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Backend starts without errors
- [ ] Gmail transporter verified on startup
- [ ] Frontend loads at http://localhost:5173
- [ ] Can navigate to /auth page
- [ ] Can click "Create Account"
- [ ] Form accepts input without errors
- [ ] OTP sends successfully
- [ ] Email received with 6-digit code
- [ ] OTP verification works
- [ ] Redirected after login success
- [ ] localStorage has auth_token

---

## 🚀 Next Steps

1. **Test thoroughly** - Follow test scenarios
2. **Customize emails** - Edit templates in emailService.js
3. **Add features** - Password reset, 2FA, social login
4. **Monitor** - Track OTP success rates
5. **Deploy** - Follow production checklist

---

## 📞 Need Help?

1. **Quick overview:** This file (README_OTP.md)
2. **Full details:** [COMPLETE_OTP_SUMMARY.md](./COMPLETE_OTP_SUMMARY.md)
3. **System architecture:** [OTP_AUTHENTICATION_SYSTEM.md](./OTP_AUTHENTICATION_SYSTEM.md)
4. **Testing guide:** [OTP_QUICK_START_TESTING.md](./OTP_QUICK_START_TESTING.md)
5. **Backend logs:** Check terminal output for errors
6. **Troubleshooting:** See "Troubleshooting" section above

---

## 🎉 You're All Set!

Your OTP authentication system is **ready to use**. Start testing by opening your auth page and creating your first account!

```
http://localhost:5173/auth
```

**Happy blogging! 📝**

---

## 📋 Quick Reference

| Task | Command |
|------|---------|
| Start backend | `cd backend && npm run dev` |
| Start frontend | `cd frontend && npm run dev` |
| Access app | http://localhost:5173 |
| Access auth | http://localhost:5173/auth |
| Check logs | Backend terminal console |
| Check database | MongoDB compass or `mongo` CLI |
| Check localStorage | DevTools → Application → Storage |

---

Generated: February 10, 2026
Status: ✅ Complete & Ready for Testing
