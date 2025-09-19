# 🔐 SECURE ENVIRONMENT VARIABLE ALTERNATIVES

## ⚠️ NEVER commit .env files to public repositories!

Your current .env contains sensitive data that should NEVER be in version control:
- Database credentials with passwords
- Email passwords  
- JWT secrets

## 🛡️ SECURE ALTERNATIVES

### Option 1: GitHub Secrets + Render/Railway (Recommended)

#### Frontend: GitHub Pages
- No backend secrets needed in frontend
- Only needs API endpoint URL (public)

#### Backend: Render.com (Free Tier)
1. Go to [render.com](https://render.com)
2. Create "Web Service" from GitHub repo
3. Use folder: `backend`
4. Add environment variables securely in Render dashboard:

```
DATABASE_URL=postgresql://neondb_owner:npg_vD8orTxFnJX1@ep-purple-bar-adj2wp57-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=D9f7x!qZ3vP#s8Lb@kRnW2eTmY6UcJ0HgF1oVzX$CjwEa4MdS5Iq7NyplRuOBt
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=takshgandhi4@gmail.com
SMTP_PASS=geehdeqajjsrykip
PORT=10000
```

### Option 2: Railway (Full Stack)
1. Go to [railway.app](https://railway.app)
2. Deploy from GitHub
3. Add environment variables in Railway dashboard
4. Automatic HTTPS and custom domains

### Option 3: Netlify + Supabase
1. **Frontend**: Netlify (free hosting)
2. **Database**: Supabase (managed PostgreSQL)
3. **Auth**: Supabase Auth (replaces your JWT system)
4. **Email**: Supabase Auth email templates

### Option 4: GitHub Codespaces (Development)
- Use GitHub Codespaces for development
- Store secrets in Codespace environment
- Never commit to repository

## 🏗️ PRODUCTION SETUP RECOMMENDATION

### Step 1: Deploy Backend on Render
```bash
# 1. Go to render.com
# 2. New Web Service
# 3. Connect GitHub repo: taksh1507/LegalEaseAI
# 4. Root Directory: backend
# 5. Build Command: npm install
# 6. Start Command: npm start
# 7. Add all environment variables above
```

### Step 2: Update Frontend API URL
```javascript
// In src/services/authAPI.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://legaleaseai-backend.onrender.com';
```

### Step 3: Deploy Frontend on GitHub Pages
```bash
# Automatic via GitHub Actions workflow (already created)
```

## 🔧 IMMEDIATE ACTIONS

1. **NEVER commit your .env file**
2. **Deploy backend on Render** with environment variables
3. **Use GitHub Pages** for frontend
4. **Update API URL** to point to Render backend

## 📋 Backend Deployment URLs

After deploying on Render, your backend will be at:
`https://your-app-name.onrender.com`

Update frontend to use this URL instead of localhost.

## 🚨 SECURITY CHECKLIST

- [ ] .env files in .gitignore ✅
- [ ] Secrets only in hosting platform dashboards ✅
- [ ] No hardcoded credentials in code ✅
- [ ] Environment variables for different environments ✅
- [ ] HTTPS only for production ✅