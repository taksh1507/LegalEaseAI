# LegalEaseAI Deployment Guide

## Deployment Options

### Option 1: Vercel (Recommended - Full Stack)

Vercel can host both your React frontend and Node.js backend.

#### Steps:
1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Environment Variables**:
   Set these in Vercel dashboard (vercel.com → Your Project → Settings → Environment Variables):
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `EMAIL_USER` - Your Gmail address for sending OTPs
   - `EMAIL_PASS` - Your Gmail app password
   - `JWT_SECRET` - A random secret string
   - `TWILIO_ACCOUNT_SID` - Your Twilio Account SID (optional)
   - `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token (optional)
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number (optional)

### Option 2: Netlify (Frontend) + Render (Backend)

#### Frontend on Netlify:
1. Go to [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `build`

#### Backend on Render:
1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Settings:
   - Build command: `cd backend && npm install`
   - Start command: `cd backend && npm start`
   - Environment variables: Same as Vercel list above

### Option 3: Railway (Full Stack Alternative)

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Railway will auto-detect and deploy both frontend and backend
4. Add environment variables in Railway dashboard

## Database Setup

### Option 1: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Use it as your `DATABASE_URL` environment variable

### Option 2: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get PostgreSQL connection details
4. Run the SQL schema from `backend/database/schema.sql`

## Post-Deployment Steps

1. **Test Authentication**: Try signing up with your email
2. **Verify Database**: Check if user data is being stored
3. **Test File Upload**: Upload a sample document
4. **Check Logs**: Monitor deployment logs for any errors

## Troubleshooting

- **Database Connection Issues**: Ensure your DATABASE_URL is correct
- **Email OTP Issues**: Verify Gmail credentials and app password
- **CORS Issues**: Make sure frontend URL is allowed in backend CORS settings
- **Build Failures**: Check Node.js version compatibility (use Node 16+)

## Environment Variables Template

Create a `.env` file in the backend directory for local development:

```env
DATABASE_URL=your_postgresql_connection_string
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
JWT_SECRET=your_random_jwt_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```