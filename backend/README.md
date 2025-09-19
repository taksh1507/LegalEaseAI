# LegalEase AI - Authentication API

A Node.js + Express API for authentication using mobile number or email with OTP verification.

## Features

- OTP-based authentication via mobile number or email
- PostgreSQL database with users and OTPs tables
- SMS sending via Twilio
- Email sending via Nodemailer
- JWT token generation for authenticated users
- Comprehensive error handling and validation
- Environment-based configuration

## Project Structure

```
backend/
├── config/
│   └── database.js          # PostgreSQL connection setup
├── database/
│   ├── init.js             # Database initialization
│   └── schema.sql          # Database schema (users & otps tables)
├── routes/

│   └── auth.js             # Authentication endpoints (send-otp, verify-otp, profile)
├── services/
│   ├── emailService.js     # Email sending via Nodemailer
│   └── smsService.js       # SMS sending via Twilio
├── utils/
│   └── otpUtils.js         # OTP generation and validation utilities
├── .env.example            # Environment variables template
├── .gitignore             # Git ignore file
├── index.js               # Main Express application
└── package.json           # NPM dependencies and scripts
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` file with your actual values:

```env
# Database Configuration
DATABASE_URL=your_neon_postgresql_url_here

# JWT Secret (generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Email Configuration (Gmail SMTP example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Server Configuration
PORT=5000
```

### 3. Database Setup

The API uses **Neon PostgreSQL**. The database schema will be automatically created when you start the server.

**Tables Created:**
- `users`: Stores user information (id, name, mobile_number, email, created_at)
- `otps`: Stores OTP codes (id, user_identifier, otp_code, expires_at, verified)

### 4. External Service Setup

#### Twilio (for SMS)
1. Create a Twilio account at [twilio.com](https://www.twilio.com)
2. Get your Account SID, Auth Token, and Phone Number
3. Add them to your `.env` file

#### Email SMTP (for emails)
For Gmail:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password for your application
3. Use your Gmail address and the app password in `.env`

### 5. Start the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-09-19T16:45:00.000Z"
}
```

### Send OTP
```
POST /api/auth/send-otp
```

**Request Body (Mobile):**
```json
{
  "mobile_number": "+1234567890"
}
```

**Request Body (Email):**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your mobile",
  "data": {
    "identifier": "+1234567890",
    "method": "mobile",
    "expiresIn": "5 minutes"
  }
}
```

### Verify OTP
```
POST /api/auth/verify-otp
```

**Request Body (Mobile):**
```json
{
  "mobile_number": "+1234567890",
  "otp_code": "123456",
  "name": "John Doe"
}
```

**Request Body (Email):**
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "mobile_number": "+1234567890",
      "email": null,
      "created_at": "2025-09-19T16:45:00.000Z"
    }
  }
}
```

## Usage Examples

### Using cURL

1. **Send OTP to mobile:**
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile_number": "+1234567890"}'
```

2. **Send OTP to email:**
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

3. **Verify OTP:**
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile_number": "+1234567890", "otp_code": "123456", "name": "John Doe"}'
```

### Frontend Integration

The JWT token returned from `/verify-otp` should be stored securely (e.g., in localStorage or httpOnly cookies) and included in subsequent API requests:

```javascript
// Store token after successful verification
localStorage.setItem('authToken', response.data.token);

// Use token in API requests
const token = localStorage.getItem('authToken');
fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Security Features

- **Input Validation**: Email and mobile number format validation
- **OTP Expiration**: OTPs expire after 5 minutes
- **One-time Use**: OTPs can only be used once
- **JWT Tokens**: Secure token-based authentication
- **Environment Variables**: Sensitive data stored in environment variables
- **CORS Protection**: Configurable CORS settings
- **Error Handling**: Comprehensive error responses

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    mobile_number VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_mobile_or_email CHECK (
        (mobile_number IS NOT NULL AND mobile_number != '') OR 
        (email IS NOT NULL AND email != '')
    )
);
```

### OTPs Table
```sql
CREATE TABLE otps (
    id SERIAL PRIMARY KEY,
    user_identifier VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Dependencies

- **express**: Web framework
- **pg**: PostgreSQL client
- **twilio**: SMS service
- **nodemailer**: Email service
- **jsonwebtoken**: JWT token generation
- **bcrypt**: Password hashing (if needed for future features)
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## License

ISC