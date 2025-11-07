import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import '../../styles/LoginPage.css';

const LoginPage = () => {
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    otp: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth(); // Directly use setUser from context after verification
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await authService.requestLoginOtp(formData.emailOrPhone);
      setMessage(`Mã OTP đã được gửi đến ${formData.emailOrPhone}. Vui lòng kiểm tra.`);
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Gửi mã OTP thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await authService.verifyLoginOtp(formData.emailOrPhone, formData.otp);
      setUser(userData); // Manually set user in context

      const returnTo = sessionStorage.getItem('returnTo');
      if (returnTo) {
        sessionStorage.removeItem('returnTo');
        navigate(returnTo);
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">
            {step === 'request' ? 'Đăng Nhập Khách Hàng' : 'Xác Thực OTP'}
          </h2>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && !error && <div className="success-message">{message}</div>}

        {step === 'request' ? (
          <form onSubmit={handleRequestOtp} className="login-form">
            <div className="form-group">
              <label htmlFor="emailOrPhone">Email hoặc Số điện thoại</label>
              <input
                type="text"
                id="emailOrPhone"
                name="emailOrPhone"
                className="form-control"
                value={formData.emailOrPhone}
                onChange={handleInputChange}
                placeholder="Nhập email hoặc số điện thoại"
                required
              />
            </div>
            <button
              type="submit"
              className={`login-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <div className="form-group">
              <label htmlFor="otp">Mã OTP</label>
              <input
                type="text"
                id="otp"
                name="otp"
                className="form-control"
                value={formData.otp}
                onChange={handleInputChange}
                placeholder="Nhập mã OTP bạn đã nhận"
                required
              />
            </div>
            <button
              type="submit"
              className={`login-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <Link to="/register" className="register-link">
            Chưa có tài khoản? Đăng Ký
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
