import React, { useState } from "react";
import "./Login.css";
import { login } from "../../services/authApi";
import { useNavigate } from "react-router-dom";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const navigate = useNavigate();
  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem("user", JSON.stringify({
      token: data.accessToken,
      userId: data.userId
    })); 
      alert("Login successful!");
      console.log("User data:", data);
      navigate('/dashbroad');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="logo">SEP490</h2>
        <h1 className="login-title">Login</h1>
        <p className="login-subtitle">Welcome to log in.</p>

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault(); 
            handleLogin();
          }}
        >
          <label>Email</label>
          <input
            type="email"
            placeholder="Please enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Please enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="eye-icon"
                onClick={() => setShowPassword(!showPassword)} 
              style={{ cursor: "pointer", userSelect: "none" }}
            >
              {showPassword ? "🙈" : "👁️"}</span>
            
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "LOGIN"}
          </button>

          <p className="signup-link" style={{marginTop:'20px'}}>
             <a href="/forgot">Quên Mật khẩu?</a>
             <a style={{marginLeft:'40px'}} href="/register">Đăng Ký</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
