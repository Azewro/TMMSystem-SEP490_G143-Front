import React, { useState } from 'react';
import './Register.css';
import { registerUser } from '../../services/authApi';

const Register = () => {
    const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    email: "",
    phoneNumber: "",
    position: "",
    customerId: 0,
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

    if (formData.password !== formData.confirmPassword) {
      setMessage("Mật khẩu nhập lại không khớp!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        position: formData.position,
        customerId: formData.customerId,
      };

      const res = await registerUser(data);
      setMessage("Đăng ký thành công!");
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
        <h2 className="signup-title">Tạo Tài Khoản</h2>
        <form className="signup-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Tên"
            value={formData.name}
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
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="text"
            name="phoneNumber"
            placeholder="Số điện thoại"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
          <input
            type="text"
            name="position"
            placeholder="Chức vụ"
            value={formData.position}
            onChange={handleChange}
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