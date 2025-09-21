# LegalEaseAI Deployment Guide

This guide covers deploying LegalEaseAI to Render.com with both frontend and backend services.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Environment Variables**: Prepare your production environment variables

## Deployment Steps

### 1. Prepare Environment Variables

Before deploying, you'll need these environment variables:

#### Backend Environment Variables:
- `DATABASE_URL`: PostgreSQL database connection string (use Render's PostgreSQL or external service like Neon)
- `JWT_SECRET`: Strong secret key for JWT tokens (generate a secure random string)
- `SMTP_HOST`: Email service host (e.g., smtp.gmail.com)
- `SMTP_PORT`: Email service port (e.g., 587)
- `SMTP_USER`: Your email address
- `SMTP_PASS`: Your email app password (not regular password)
- `OPENAI_ROUTER_KEY`: Your OpenAI API key
- `NODE_ENV`: Set to "production"
- `PORT`: Set to 10000 (Render default)

#### Frontend Environment Variables:
- `REACT_APP_API_URL`: Your backend service URL (will be provided by Render)

### 2. Deploy Backend Service

1. **Connect Repository**:
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your code

2. **Configure Backend Service**:
   - **Name**: `legalease-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Instance Type**: Choose based on your needs (Free tier available)

3. **Set Environment Variables**:
   - In the service settings, add all backend environment variables listed above
   - Make sure to use strong, secure values for production

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://your-backend-service.onrender.com`)

### 3. Deploy Frontend Service

1. **Create Frontend Service**:
   - Click "New +" → "Static Site"
   - Connect the same GitHub repository

2. **Configure Frontend Service**:
   - **Name**: `legalease-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

3. **Set Environment Variables**:
   - `REACT_APP_API_URL`: Use your backend service URL from step 2

4. **Deploy**:
   - Click "Create Static Site"
   - Wait for deployment to complete

### 4. Database Setup

#### Option A: Render PostgreSQL (Recommended)
1. Create a new PostgreSQL database on Render
2. Use the provided connection string as your `DATABASE_URL`

#### Option B: External Database (Neon, etc.)
1. Create a database on your preferred service
2. Use the connection string as your `DATABASE_URL`

### 5. Update Configuration

Update your `render.yaml` file with the correct values:

```yaml
services:
  - type: web
    name: legalease-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: legalease-db
          property: connectionString
      # Add other environment variables
```

### 6. Custom Domain (Optional)

1. In your frontend service settings, go to "Custom Domains"
2. Add your domain name
3. Configure DNS records as instructed by Render

## Environment-Specific Configuration

### Production Environment Variables

Create a `.env.production` file in your backend directory:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=your_production_database_url
JWT_SECRET=your_strong_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
OPENAI_ROUTER_KEY=your_openai_api_key
```

### Frontend Production Environment

Update `.env.production` in your root directory:

```env
REACT_APP_API_URL=https://your-backend-service.onrender.com
```

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are in `package.json`
   - Verify build commands are correct

2. **Environment Variables**:
   - Double-check all required variables are set
   - Ensure no typos in variable names
   - Use strong, secure values for production

3. **Database Connection**:
   - Verify DATABASE_URL is correct
   - Check database service is running
   - Ensure database allows connections from Render

4. **CORS Issues**:
   - Update CORS configuration in backend to allow your frontend domain
   - Add your frontend URL to allowed origins

### Monitoring:

- Use Render's built-in logs and metrics
- Set up health checks for your services
- Monitor database performance and connections

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **JWT Secret**: Use a strong, random secret key
3. **Database**: Use SSL connections for database
4. **HTTPS**: Render provides SSL certificates automatically
5. **CORS**: Configure properly to allow only your frontend domain

## Scaling

- Render offers auto-scaling options
- Monitor resource usage and upgrade plans as needed
- Consider using CDN for static assets
- Implement caching strategies for better performance

## Support

- Render Documentation: [render.com/docs](https://render.com/docs)
- Community Support: Render Community Forum
- Check service status: [status.render.com](https://status.render.com)