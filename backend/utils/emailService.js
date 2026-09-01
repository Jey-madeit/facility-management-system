const nodemailer = require('nodemailer');

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send OTP via email
const sendOTPEmail = async (email, username, otp) => {
  try {
    // Check if test mode is enabled (development environment without credentials)
    const isTestMode = process.env.NODE_ENV !== 'production' 
        || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD;
    
    if (isTestMode) {
      console.log('\n' + '='.repeat(60));
      console.log('TEST MODE: OTP Email');
      console.log('='.repeat(60));
      console.log(`To: ${email}`);
      console.log(`Username: ${username}`);
      console.log(`OTP: ${otp} (Valid for 10 minutes)`);
      console.log('='.repeat(60) + '\n');
      return { success: true, testMode: true, otp };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - Faci-Hub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            
            <p style="color: #666; font-size: 16px;">Hi <strong>${username}</strong>,</p>
            
            <p style="color: #666; font-size: 16px;">
              You requested a password reset for your Faci-Hub account. 
              Please use the following One-Time Password (OTP) to complete the process:
            </p>
            
            <div style="background-color: #fff; border: 2px dashed #007bff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h3 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 4px;">${otp}</h3>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Important:</strong> This OTP will expire in 10 minutes. Do not share this code with anyone.
            </p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                ⚠️ If you didn't request this password reset, please ignore this email and ensure your account is secure.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">
              This is an automated email. Please do not reply to this message.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              &copy; 2026 WAGPCO. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent successfully to ${email}`);
    return { success: true, testMode: false };
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    throw error;
  }
};

module.exports = {
  sendOTPEmail
};
