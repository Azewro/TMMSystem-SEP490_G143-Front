import React, { useState } from 'react';
import { changePassword } from '../../services/authApi';
import './ChangePass.css';
import { useNavigate } from 'react-router-dom';
const ChangePass = () => {
   
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
const navigate = useNavigate();
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await changePassword(email, currentPassword, newPassword);
      setMessage("✅ Mật khẩu đã được thay đổi thành công!");      
      setEmail("");
      setCurrentPassword("");
      setNewPassword("");
      navigate('/');
    } catch (error) {
      setMessage("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-box">
        <h2>Đổi mật khẩu</h2>
        <form onSubmit={handleChangePassword} className="change-password-form">
          <label>Email</label>
          <input
            type="email"
            placeholder="Nhập email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Mật khẩu hiện tại</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <label>Mật khẩu mới</label>
          <input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default ChangePass;
