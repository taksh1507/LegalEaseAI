# 🚨 SECURE DEPLOYMENT GUIDE - LegalEaseAI

## ⚠️ SECURITY NOTICE
**NEVER commit .env files to GitHub!** Your environment variables contain sensitive credentials.

## 🔐 Your Environment Variables (for deployment platforms)

Use these values when setting up environment variables in your deployment platform:

```
DATABASE_URL=postgresql://neondb_owner:npg_vD8orTxFnJX1@ep-purple-bar-adj2wp57-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET=D9f7x!qZ3vP#s8Lb@kRnW2eTmY6UcJ0HgF1oVzX$CjwEa4MdS5Iq7NyplRuOBt

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=takshgandhi4@gmail.com
SMTP_PASS=geehdeqajjsrykip

PORT=5000
```

## 🚀 DEPLOYMENT OPTIONS

### Option 1: Vercel (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. **Import Repository**: Choose `taksh1507/LegalEaseAI`
3. **Framework**: Select "Create React App"
4. **Root Directory**: Leave as "." (root)
5. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

6. **Environment Variables** (Add in Vercel Dashboard):
   ```
   DATABASE_URL → postgresql://neondb_owner:npg_vD8orTxFnJX1@ep-purple-bar-adj2wp57-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   JWT_SECRET → D9f7x!qZ3vP#s8Lb@kRnW2eTmY6UcJ0HgF1oVzX$CjwEa4MdS5Iq7NyplRuOBt
   SMTP_HOST → smtp.gmail.com
   SMTP_PORT → 587
   SMTP_USER → takshgandhi4@gmail.com
   SMTP_PASS → geehdeqajjsrykip
   PORT → 5000
   ```

7. **Deploy**: Click "Deploy"

### Option 2: Render (Using render.yaml - Easiest for Render)

1. Go to [render.com](https://render.com) → "New Blueprint"
2. Connect your GitHub repo: `taksh1507/LegalEaseAI`
3. Render will automatically detect the `render.yaml` file
4. Click "Apply" - it will deploy both frontend and backend automatically
5. **Environment variables are already included in render.yaml**

### Option 3: Netlify + Render (Manual Setup)

#### Frontend (Netlify):
1. Go to [netlify.com](https://netlify.com) → "New site from Git"
2. Choose your repo: `taksh1507/LegalEaseAI`
3. Build settings (auto-detected from netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `build`

#### Backend (Render):
1. Go to [render.com](https://render.com) → "New Web Service"
2. Connect repo: `taksh1507/LegalEaseAI`
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Use the same list as above

### Option 4: Railway

1. Go to [railway.app](https://railway.app)
2. "Deploy from GitHub repo" → `taksh1507/LegalEaseAI`
3. Railway will detect both frontend and backend
4. Add environment variables in Railway dashboard

## 📱 Post-Deployment Testing

1. **Visit your deployed URL**
2. **Test Sign Up**: Use your email for OTP
3. **Test Authentication**: Check login/logout
4. **Test File Upload**: Upload a sample document
5. **Check Database**: Verify user data is stored

## 🔧 Troubleshooting

- **"Cannot connect to database"**: Check DATABASE_URL
- **"Email not sending"**: Verify SMTP_PASS (Gmail app password)
- **"Invalid JWT"**: Ensure JWT_SECRET is set correctly
- **CORS errors**: Make sure your frontend URL is allowed

## 📝 Notes

- Your database is already set up on Neon
- Gmail app password is configured
- JWT secret is generated and secure
- All sensitive data is protected by .gitignore

**Which deployment platform would you like to use?**