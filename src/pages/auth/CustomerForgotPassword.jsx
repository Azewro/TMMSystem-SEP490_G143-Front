import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../api/authService';
import '../../styles/LoginPage.css';

const CustomerForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('request'); // request | verify | done
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleRequest = async () => {
    resetMessages();

    // Validation
    if (!email || !email.trim()) {
      setError('Email không được để trống.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Vui lòng nhập đúng định dạng Email');
      return;
    }

    setLoading(true);
    try {
      await authService.customerForgotPassword(email);
      setSuccess('Đã gửi mã xác minh tới email. Vui lòng nhập mã để xác nhận.');
      setStep('verify');
    } catch (err) {
      const errorMessage = err.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.';
      if (errorMessage.toLowerCase().includes('customer not found') ||
          errorMessage.toLowerCase().includes('không tìm thấy') ||
          errorMessage.toLowerCase().includes('email not found')) {
        setError('Không tìm thấy email.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    resetMessages();
    setLoading(true);
    try {
      await authService.customerVerifyResetCode(email, code);
      setSuccess('Xác minh thành công. Mật khẩu mới đã được gửi tới email của bạn.');
      setStep('done');
      setCode('');
    } catch (err) {
      setError(err.message || 'Mã xác minh không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 'verify') {
      await handleVerify();
    } else if (step === 'request') {
      await handleRequest();
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">Quên mật khẩu</h2>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              required
              disabled={step === 'done'}
            />
          </div>

          {step !== 'request' && (
            <div className="form-group">
              <label htmlFor="code">Mã xác minh</label>
              <input
                type="text"
                id="code"
                name="code"
                className="form-control"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Nhập mã gồm 6 chữ số"
                required={step === 'verify'}
                disabled={step === 'done'}
              />
            </div>
          )}

          {step === 'done' ? (
            <Link to="/login" className="login-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
              Quay lại đăng nhập
            </Link>
          ) : (
            <button
              type="submit"
              className={`login-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading
                ? 'Đang xử lý...'
                : step === 'request'
                  ? 'Gửi mã xác minh'
                  : 'Xác nhận mã'}
            </button>
          )}
        </form>

        {step !== 'done' && (
          <div className="login-footer">
            <Link to="/login" className="register-link">
              Quay lại đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerForgotPassword;

