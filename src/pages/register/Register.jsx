import React, { useState } from 'react';
import './Register.css';
import { registerUser } from '../../services/authApi';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigation = useNavigate();
    const [formData, setFormData] = useState({   
      email: "", 
    password: "",    
    
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Mật khẩu nhập lại không trùng khớp!");
      setLoading(false);
      return;
    }
    try {
      const data = {
        email: formData.email,
        password: formData.password,
      };

      const res = await registerUser(data);
      setMessage("Đăng ký thành công!");
      navigation('/');
      console.log("Kết quả:", res);
    } catch (error) {
      setMessage(error.message || "Có lỗi xảy ra khi đăng ký.");
    } finally {
      setLoading(false);
    }
  };
    return (
    <div className="signup-container">
      <div className="signup-box">
        <h2 className="signup-title">Đăng Ký</h2>
        <form className="signup-form" onSubmit={handleSubmit}>                   
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChange={handleChange}
          /> 
          <input
            type="password"
            name="confirmPassword"
            placeholder="Nhập lại mật khẩu"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />        
          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
        </form>
        {message && <p className="signup-message">{message}</p>}
        <p className="signup-login">
          Đã có tài khoản? <a href="/">Đăng nhập ngay</a>
        </p>
      </div>
    </div>
  );
};

export default Register;