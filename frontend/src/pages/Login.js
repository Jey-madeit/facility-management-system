import React, { useState, useContext } from 'react';
import { Building2, Lock, User, Mail, ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { authService } from '../services/apiService';
import '../styles/Login.css';
import Logo from '../assets/WAGPCo_Logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [loginType, setLoginType] = useState('user'); // 'user' or 'admin'
  const [resetStep, setResetStep] = useState('request'); // 'request', 'otp-verify', or 'password-reset'
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      
      // Check if user's role matches the selected login type
      if (loginType === 'admin' && response.data.user.role !== 'admin') {
        setError('Access denied. Admin credentials required.');
        setLoading(false);
        return;
      }
      
      if (loginType === 'user' && response.data.user.role === 'admin') {
        setError('Please use Admin Login to access admin features.');
        setLoading(false);
        return;
      }
      
      login(response.data.user, response.data.token);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');

    if (!username.trim() && !email.trim()) {
      setError('Please enter your username or email');
      return;
    }

    setLoading(true);
    try {
      await authService.requestPasswordResetOTP(username.trim(), email.trim());
      setForgotSuccess('OTP has been sent to your email! Please enter it below.');
      setResetStep('otp-verify');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');

    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6 || isNaN(otp)) {
      setError('OTP must be a 6-digit number');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP with backend
      await authService.verifyOTP(username.trim(), otp, email.trim());
      
      // Only show password fields if OTP is valid
      setForgotSuccess('OTP verified! Now enter your new password.');
      setResetStep('password-reset');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAndResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyOTPAndResetPassword(username.trim(), otp, newPassword, email.trim());
      setForgotSuccess('Password reset successfully! Please log in with your new password.');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setResetStep('request');
      setTimeout(() => {
        setShowForgot(false);
        setUsername('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRequest = () => {
    if (resetStep === 'password-reset') {
      setResetStep('otp-verify');
    } else if (resetStep === 'otp-verify') {
      setResetStep('request');
      setOtp('');
    }
    setError('');
    setForgotSuccess('');
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <img src={Logo} alt='WAGPCo Logo' className='logo1' />
        <h2 className="login-tag">WAGPCo</h2>
      </div>
      <div className="login-container">
        <div className="login-box">
          <button
            type="button"
            className="back-link landing-back-link"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="login-brand">
            <h1>
             <Building2 size={36}/> Faci-Hub
            </h1>
            <p>{showForgot ? 'Reset Your Password' : 'Welcome Back! Please enter your credentials.'}</p>
          </div>

          {/* Login Type Toggle */}
          {!showForgot && (
            <div className="login-type-toggle">
              <button
                type="button"
                className={`toggle-btn ${loginType === 'user' ? 'active' : ''}`}
                onClick={() => { setLoginType('user'); setError(''); }}
              >
                <User size={16} style={{marginRight: '0', marginBottom: '4px',
                  verticalAlign: 'middle', horizontalAlign: 'middle'
                }} />
                Staff
              </button>
              <button
                type="button"
                className={`toggle-btn ${loginType === 'admin' ? 'active' : ''}`}
                onClick={() => { setLoginType('admin'); setError(''); }}
              >
                <Shield size={16} style={{marginRight: '0', marginBottom: '3px',
                  verticalAlign: 'middle', horizontalAlign: 'middle'
                }} />
                Admin
              </button>
            </div>
          )}

          {!showForgot ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group1">
                <label htmlFor="username">
                  <User size={16} style={{ marginRight: '4px',marginBottom: '3px', verticalAlign: 'middle',
                     horizontalAlign: 'middle' }} />
                  Username:
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  placeholder="Enter your username"
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete='off'
                  required
                  maxLength={30}
                />
              </div>

              <div className="form-group1">
                <label htmlFor="password">
                  <Lock size={16} style={{ marginRight: '4px',marginBottom: '3px',
                     verticalAlign: 'middle', horizontalAlign: 'middle' }} />
                  Password:
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={128}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
              {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}

              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="forgot-password-link">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => { setShowForgot(true); setResetStep('request'); setError(''); setForgotSuccess(''); }}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          ) : resetStep === 'request' ? (
            <form onSubmit={handleRequestOTP}>
              <button
                type="button"
                className="back-link"
                onClick={() => { setShowForgot(false); setError(''); setForgotSuccess(''); }}
              >
                <ArrowLeft size={16} /> Back to Login
              </button>

              <div className="form-group1">
                <label htmlFor="forgot-username">
                  <User size={16} style={{ marginRight: '6px', marginBottom: '4px',
                     verticalAlign: 'middle', horizontalAlign: 'middle' }} />
                  Username:
                </label>
                <input
                  type="text"
                  id="forgot-username"
                  value={username}
                  placeholder="Enter your username"
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  maxLength={30}
                  autoComplete="off"
                />
              </div>
              <div className="form-group1">
                <label htmlFor="email">
                  <Mail size={16} style={{ marginRight: '6px', marginBottom: '4px',
                     verticalAlign: 'middle', horizontalAlign: 'middle' }} />
                  Email:
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  placeholder="Enter your email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}

              <button type="submit" disabled={loading}>
                {loading ? 'Requesting OTP...' : 'Request OTP'}
              </button>
            </form>
          ) : resetStep === 'otp-verify' ? (
            <form onSubmit={handleVerifyOTP}>
              <button
                type="button"
                className="back-link"
                onClick={handleBackToRequest}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="form-group1">
                <label htmlFor="otp">
                  <Shield size={16} style={{ marginRight: '6px', marginBottom: '4px',
                     verticalAlign: 'middle', horizontalAlign: 'middle' }} />
                  One-Time Password (OTP):
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  placeholder="Enter 6-digit OTP"
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  autoComplete="off"
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}

              <button type="submit" disabled={loading}>
                {loading ? 'Checking OTP...' : 'Submit'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTPAndResetPassword}>
              <button
                type="button"
                className="back-link"
                onClick={handleBackToRequest}
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="form-group1">
                <label htmlFor="new-password">
                  <Lock size={16} style={{ marginRight: '6px',marginBottom: '3px',
                     verticalAlign: 'middle', horizontalAlign: 'middle' }} />
                  New Password:
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="new-password"
                    value={newPassword}
                    placeholder="Enter new password (min 6 chars)"
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    maxLength={128}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group1">
                <label htmlFor="confirm-password">
                  <Lock size={16} style={{ marginRight: '6px',marginBottom: '3px',
                     verticalAlign: 'middle', horizontalAlign: 'middle' }} />
                  Confirm Password:
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="confirm-password"
                  value={confirmPassword}
                  placeholder="Confirm new password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={128}
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}

              <button type="submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;
