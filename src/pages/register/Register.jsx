import React from 'react';
import './Register.css';
const Register = () => {
    return (
    <div className="signup-container">
      <div className="signup-box">
        <h2 className="signup-title">Tạo Tài Khoản</h2>
        <form className="signup-form">
          <input type="text" placeholder="Tên đăng nhập" />
          <input type="password" placeholder="Nhập mật khẩu" />
          <input type="password" placeholder="Nhập lại mật khẩu" />
          <input type="email" placeholder="Email" />
          <input type="text" placeholder="Số điện thoại" />
          <button type="submit" className="signup-button">Tạo tài khoản</button>
        </form>
        <p className="signup-login">
          Đã có tài khoản? <a href="/">Đăng nhập ngay</a>
        </p>
      </div>
    </div>
  );
};

export default Register;