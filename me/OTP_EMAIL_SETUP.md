# OTP Email Configuration Guide

## Overview
The OTP verification system now sends One-Time Passwords directly to user emails. This guide will help you configure email delivery for your Facility Management system.

## Setup Steps

### 1. Install Nodemailer Package
Nodemailer has been added to `package.json`. Install it:

```bash
cd backend
npm install
```

### 2. Configure Email Credentials

Edit the `.env` file in the `backend` directory and add email configuration:

```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 3. Gmail Setup (Recommended)

If using Gmail:

#### Step 1: Enable 2-Factor Authentication
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click "Security" in the left sidebar
3. Enable "2-Step Verification"

#### Step 2: Generate App Password
1. After enabling 2FA, in Security settings, find "App passwords"
2. Select "Mail" and "Windows Computer" (or your device)
3. Google will generate a 16-character password
4. Copy this password to `.env` as `EMAIL_PASSWORD`

#### Step 3: Example Configuration
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

### 4. Other Email Services

You can use other email services by configuring the appropriate SMTP settings:

#### Outlook/Microsoft
```
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### Yahoo
```
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

#### Custom SMTP Server
For other services, you can modify `emailService.js` to use custom SMTP configuration:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.your-service.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## Testing Email Configuration

### 1. Start Backend Server
```bash
npm start
```

### 2. Test OTP Request
1. Open the frontend application
2. Go to Login page → "Forgot Password?"
3. Enter a username
4. Click "Request OTP"

### Expected Results:
- ✅ If email is configured: OTP email should arrive in the user's inbox within a few seconds
- ❌ If email not configured: You'll see a message: "Failed to send OTP email..."
- Console will show: "Email service not configured" (if credentials missing)

## Troubleshooting

### Issue: "Failed to send OTP email"
**Solutions:**
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correctly set in `.env`
- Check if Gmail 2FA and App Password are properly configured
- Ensure your email service allows SMTP connections
- Check firewall/network settings

### Issue: User email not in database
**Solutions:**
- User profile must have an email address
- Update user email in database via User Management panel
- Ensure email field is populated before requesting OTP

### Issue: OTP email goes to spam
**Solutions:**
- Add your sender email to recipient's contacts
- Check email provider's spam filters
- Consider whitelisting the sender domain
- Update email template branding in `emailService.js`

## Email Template

The OTP email includes:
- **Subject:** Password Reset OTP - Faci-Hub
- **Content:**
  - Greeting with username
  - 6-digit OTP prominently displayed
  - 10-minute expiration warning
  - Security warning if user didn't request reset
  - Professional formatting with branding

## Security Notes

✅ **Best Practices Implemented:**
- OTP is NOT sent in API response
- OTP is securely stored with 10-minute expiry
- Email service credentials use environment variables
- Failed email delivery clears OTP to prevent lockouts
- User email validation before sending

⚠️ **Important:**
- Never commit `.env` file with real credentials to version control
- Use App Passwords for Gmail, not your actual password
- Keep `EMAIL_USER` and `EMAIL_PASSWORD` confidential
- In production, monitor email service logs for issues

## Environment Variables Summary

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_SERVICE` | Email provider | `gmail`, `outlook`, `yahoo` |
| `EMAIL_USER` | Sender email address | `noreply@company.com` |
| `EMAIL_PASSWORD` | Email account password or app password | `xxxx xxxx xxxx xxxx` |

## Next Steps

After configuration:
1. Restart the backend server
2. Test OTP flow with a test user
3. Verify email delivery
4. Monitor email service for any errors
5. Set up user emails in the system if not already done
