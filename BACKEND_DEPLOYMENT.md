# 🚀 BACKEND DEPLOYMENT GUIDE

## Option 1: Render.com (Manual Setup)

### Step-by-Step:
1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click "New +" → "Web Service" (NOT Blueprint)
4. Connect repository: `taksh1507/LegalEaseAI`
5. Configure these EXACT settings:

```
Name: legaleaseai-backend
Root Directory: backend
Environment: Node
Region: Oregon (US West)  
Branch: main
Build Command: npm install
Start Command: npm start
Auto-Deploy: Yes
```

6. Add Environment Variables (click "Add Environment Variable"):
```
DATABASE_URL = postgresql://neondb_owner:npg_vD8orTxFnJX1@ep-purple-bar-adj2wp57-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET = D9f7x!qZ3vP#s8Lb@kRnW2eTmY6UcJ0HgF1oVzX$CjwEa4MdS5Iq7NyplRuOBt
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = takshgandhi4@gmail.com
SMTP_PASS = geehdeqajjsrykip
PORT = 10000
NODE_ENV = production
```

7. Click "Create Web Service"

## Option 2: Railway (Alternative - Often Easier)

1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Select: `taksh1507/LegalEaseAI`
4. Choose "backend" folder
5. Add same environment variables in Variables tab
6. Deploy automatically!

## Option 3: Cyclic (Another Alternative)

1. Go to [cyclic.sh](https://cyclic.sh)
2. Connect GitHub repo
3. Select backend folder
4. Add environment variables
5. Deploy

## 🔧 Troubleshooting Render

If backend folder doesn't show:
- Make sure you're using "Web Service" not "Blueprint"
- Manually type "backend" in Root Directory field
- Check that package.json exists in backend folder
- Try refreshing the page

## 📋 Your Backend URLs After Deployment:

- **Render**: `https://legaleaseai-backend.onrender.com`
- **Railway**: `https://legaleaseai-backend.up.railway.app`  
- **Cyclic**: `https://legaleaseai-backend.cyclic.app`

## ✅ Test Your Backend:

Once deployed, test these endpoints:
- `GET /health` - Health check
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP

Your frontend is already configured to use the Render URL!