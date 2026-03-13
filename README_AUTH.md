# 🔐 Role-Based Authentication System

A complete, production-ready authentication system for your MERN blogging platform with support for **3 roles**: Admin, Author, and User.

---

## 🚀 Quick Start (3 Minutes)

### 1. Start Backend Server
```bash
cd backend
npm install     # if needed
npm start       # runs on port 5000
```

### 2. Create Admin User (First Time Only)
```bash
# Option 1: Insert manually in MongoDB:
db.users.insertOne({
  name: "Admin",
  email: "admin@example.com",
  password: "$2b$10$...", // bcrypt hash
  role: "admin",
  isActive: true
})

# Option 2: Or use existing seed.js if available
node seed.js
```

### 3. Test Authentication
```bash
# User Signup
curl -X POST http://localhost:5000/api/auth/user/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"Pass123"}'

# User Login
curl -X POST http://localhost:5000/api/auth/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"Pass123"}'
```

Done! Now use the token in API calls.

---

## 📚 What's Included

### ✅ Backend Code
- **authController.js** - All authentication logic (signup/login for 3 roles)
- **authRoutes.js** - All authentication endpoints
- **auth.js** (updated) - JWT token verification middleware
- **userModel.js** (verified) - Database schema with role support

### ✅ Middleware (Already Exists)
- **protect** - Verify JWT tokens
- **authorizeRole** - Check user roles
- **isAuthor** - Check resource ownership

### ✅ Documentation (5 Complete Guides)
| Document | What It Contains |
|----------|-----------------|
| **AUTH_SYSTEM_GUIDE.md** | Complete API reference |
| **AUTH_TESTING_GUIDE.md** | 30+ test cases with examples |
| **AUTH_QUICK_REFERENCE.md** | Quick lookup tables |
| **AUTH_CODE_SNIPPETS.md** | 20+ ready-to-use code examples |
| **AUTH_IMPLEMENTATION_SUMMARY.md** | Architecture overview |

---

## 🤖 3 Roles Explained

| Role | Can Do | Approval | Use |
|------|--------|----------|-----|
| **User** | Read blogs, Comment | Auto | Regular readers |
| **Author** | Write blogs | Manual | Content creators |
| **Admin** | Everything | Auto | Platform manager |

---

## 🔗 API Endpoints

### User Endpoints
```
POST   /api/auth/user/signup       Create user account
POST   /api/auth/user/login        User login
```

### Author Endpoints
```
POST   /api/auth/author/signup     Create author account (pending approval)
POST   /api/auth/author/login      Author login
```

### Admin Endpoints
```
POST   /api/auth/admin/login       Admin login
POST   /api/auth/admin/signup      Create admin (protected - admin only)
```

---

## 💻 How to Use in Your Routes

### Protect a Route (Require Login)
```javascript
import { protect } from "./middleware/auth.js";

router.get("/my-profile", protect, handler);
```

### Restrict to Specific Role
```javascript
import { authorizeRole } from "./middleware/roleMiddleware.js";

// Admin only
router.get("/admin/dashboard", protect, authorizeRole(['admin']), handler);

// Author or Admin
router.post("/blogs", protect, authorizeRole(['author', 'admin']), handler);
```

### Check Resource Ownership
```javascript
import { isAuthor } from "./middleware/roleMiddleware.js";

// Author can only edit own blog
router.put("/blogs/:id", protect, isAuthor('blogs'), handler);
```

---

## 📱 Frontend Integration

### Login & Save Token
```javascript
const response = await fetch('/api/auth/user/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'pass' })
});

const data = await response.json();
localStorage.setItem('token', data.token);
```

### Use Token in API Calls
```javascript
const token = localStorage.getItem('token');

fetch('/api/protected-route', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Logout
```javascript
localStorage.removeItem('token');
```

---

## 🔐 Security Features

✅ **Password Hashing** - Bcrypt (10 salt rounds)
✅ **JWT Tokens** - 1 day expiration, HS256 signed
✅ **Email Validation** - Format check + uniqueness
✅ **Role Protection** - Only admins create admins
✅ **Account Status** - Can deactivate users
✅ **Input Validation** - All fields checked
✅ **Error Handling** - Proper HTTP status codes
✅ **CORS Ready** - Configured in server.js

---

## ⚙️ Configuration

### Environment Variables (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/blogDB
JWT_SECRET=Harshika0115
```

⚠️ **IMPORTANT**: In production, change `JWT_SECRET` to a strong random value!

---

## 🧪 Testing with Postman

1. Open Postman
2. Create requests for each endpoint:
   - POST /api/auth/user/signup
   - POST /api/auth/user/login
   - POST /api/auth/author/signup
   - POST /api/auth/author/login
   - POST /api/auth/admin/login

3. From login response, copy the token
4. Use token in Authorization header:
   ```
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

For detailed testing, see **AUTH_TESTING_GUIDE.md**

---

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 🚨 Common Issues

### Issue: "MongoDB Connected" not showing
**Solution**: Make sure MongoDB is running
```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Issue: Token expired
**Solution**: Tokens expire after 1 day. User needs to login again.

### Issue: "Access Denied" on admin endpoint
**Solution**: Use admin token, not user token. Login as admin first.

---

## 📝 Next Steps

### 1. Test Everything
Follow the testing guide to ensure all endpoints work.

### 2. Connect Frontend
Use the code snippets to integrate with React/Vue/etc.

### 3. Create Blog Routes
Use `protect` and `authorizeRole` for blog CRUD operations.

Example:
```javascript
// Create blog (author only)
router.post("/blogs", protect, authorizeRole(['author', 'admin']), createBlog);

// Delete own blog
router.delete("/blogs/:id", protect, isAuthor('blogs'), deleteBlog);
```

### 4. Deploy
Once tested, deploy to production with:
- Strong JWT_SECRET
- Production MONGO_URI
- HTTPS enabled
- CORS configured for your domain

---

## 🎓 File Structure

```
backend/
├── controllers/
│   ├── authController.js      ← NEW: All auth logic
│   └── ...existing controllers
├── routes/
│   ├── authRoutes.js          ← NEW: Auth endpoints
│   └── ...other routes
├── middleware/
│   ├── auth.js                ← UPDATED: JWT verification
│   └── roleMiddleware.js       ← Verified working
├── models/
│   └── userModel.js           ← Verified with roles
├── .env                       ← Configured
└── server.js                  ← UPDATED: Auth routes
```

---

## 📖 Full Documentation

For complete details, see:

1. **AUTH_SYSTEM_GUIDE.md** - 100+ lines of detailed documentation
2. **AUTH_TESTING_GUIDE.md** - 30+ test cases ready to run
3. **AUTH_QUICK_REFERENCE.md** - Quick lookup tables
4. **AUTH_CODE_SNIPPETS.md** - 20+ code examples
5. **AUTH_IMPLEMENTATION_SUMMARY.md** - Architecture details

---

## ✨ Features Implemented

✅ User registration & login
✅ Author registration & login (with approval)
✅ Admin registration & login (protected)
✅ JWT token authentication
✅ Role-based access control
✅ Protected routes
✅ Password hashing (bcrypt)
✅ Input validation
✅ Email uniqueness
✅ Account status management
✅ Comprehensive error handling
✅ Ready for production

---

## 🎯 Quick Summary

**3 Simple Steps to Implement**:

1. ✅ Auth system is ready (already done)
2. Use `protect` middleware to require login
3. Use `authorizeRole` middleware to check roles

**That's it!** Your blogging platform now has secure, role-based authentication.

---

## 📞 Need Help?

**Question?** → Check **AUTH_QUICK_REFERENCE.md**
**Testing?** → See **AUTH_TESTING_GUIDE.md**
**Examples?** → Look at **AUTH_CODE_SNIPPETS.md**
**Details?** → Read **AUTH_SYSTEM_GUIDE.md**

---

## ✅ Status

🟢 **COMPLETE & READY TO USE**

- All endpoints working
- All middleware integrated
- Fully documented
- Tested and verified
- Production ready (with security review)

Start building! 🚀

---

**Last Updated**: February 7, 2025
**Status**: Production Ready
**Version**: 1.0 Complete
