import React, { useState } from 'react';
import './ForgotPassword.css';
import { changePassword, forgotPassword, verifyResetCode } from '../../services/authApi';
const ForgotPassword = () => {
    const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  
  const handleSendEmail = async () => {
    try {
      const res = await forgotPassword(email);
      setMessage("Mã reset đã được gửi tới email của bạn");
      setStep(2);
    } catch (err) {
      setMessage(err.message);
    }
  };

  
  const handleVerifyCode = async () => {
    try {
      await verifyResetCode(email, code);
      setMessage("Mã hợp lệ, hãy nhập mật khẩu mới");
      setStep(3);
    } catch (err) {
      setMessage(err.message);
    }
  };

  
  const handleResetPassword = async () => {
    try {
      await changePassword(email, code, newPassword);
      setMessage("Đổi mật khẩu thành công! Hãy đăng nhập lại.");
      setStep(1);
      setEmail("");
      setCode("");
      setNewPassword("");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="forgot-container">
      {step === 1 && (
        <div className="forgot-box">
          <h3>Hãy nhập email của bạn</h3>
          <input
            type="email"
            placeholder="Nhập email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleSendEmail}>Gửi mã</button>
        </div>
      )}

      {step === 2 && (
        <div className="forgot-box">
          <h3>Mã reset</h3>
          <input
            type="text"
            placeholder="Nhập mã"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={handleVerifyCode}>Xác nhận</button>
        </div>
      )}

      {step === 3 && (
        <div className="forgot-box">
          <h3>Mật khẩu mới</h3>
          <input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="password-rules">
            <p>Yêu cầu mật khẩu:</p>
            <ul>
              <li>Có ít nhất 8 ký tự</li>
              <li>Có ít nhất 1 số</li>
              <li>Có ít nhất 1 ký tự thường và 1 ký tự in hoa</li>
              <li>Có ít nhất 1 ký tự đặc biệt (!@#$%^&*)</li>
            </ul>
          </div>
          <button onClick={handleResetPassword}>Reset mật khẩu</button>
        </div>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default ForgotPassword;
