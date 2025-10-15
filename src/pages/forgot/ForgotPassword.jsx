import React, { useState } from 'react';
import './ForgotPassword.css';
import { changePassword, forgotPassword, verifyResetCode } from '../../services/authApi';
import { useNavigate } from 'react-router-dom';
const ForgotPassword = () => {
    const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");  
  const [message, setMessage] = useState("");
  const navigate = useNavigate();  
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
      navigate('/');
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
    </div>
  );
};

export default ForgotPassword;
