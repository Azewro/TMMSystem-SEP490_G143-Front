import React, { useState } from 'react';
import './CreateAccount.css';
import { useNavigate } from 'react-router-dom';
import { CreateUsers } from '../../services/userApi';
const CreateAccount = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
  email: '',
  phoneNumber: '',
  roleId: '',     
  password: '',
  confirmPassword: '',
  name: ''
});

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };
  const handleCreateAccount = async () => {
  // Kiểm tra mật khẩu nhập lại
  if (userData.password !== userData.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const payload = {
      email: userData.email,
      password: userData.password,
      name: userData.name || "New User",
      role: { id: parseInt(userData.roleId) }  // Đúng format API yêu cầu
    };

    console.log("Payload gửi đi:", payload); // Debug xem dữ liệu gửi đúng chưa

    await CreateUsers(payload);

    alert("User created successfully!");
    navigate('/dashbroad');

    // Reset form
    setUserData({
      email: '',
      phoneNumber: '',
      roleId: '',
      password: '',
      confirmPassword: '',
      name: ''
    });
  } catch (error) {
    alert("User created failed! " + error.message);
    console.error(error);
  }
};

    return (
        <div className="signup-container">
      <div className="signup-box">
        <h1 className="signup-title">Create Account</h1>
        <form className="signup-form">
          <label>Email</label>
          <input type="email" placeholder="Enter your email" value={userData.email} onChange={handleChange} name='email'/>
         
          <label>Full Name</label>
<input
  type="text"
  placeholder="Enter your full name"
  value={userData.name}
  onChange={handleChange}
  name='name'
/>

          <select
  className="role-filter"
  value={userData.roleId}
  onChange={handleChange}
  name='roleId'
>
  <option value="">--Select Role--</option>
  <option value="7">MANAGER</option>
  <option value="5">ADMIN</option>
  <option value="8">USER</option>
  <option value="6">SALES</option>
</select>

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={userData.password} onChange={handleChange} name='password'
          />
          <label>Comfirm Password</label>
          <input type="password" placeholder="Repeat your password" value={userData.confirmPassword} onChange={handleChange} name='confirmPassword'/>
          <button type="button" className="signup-btn" onClick={handleCreateAccount}>
            Create
          </button>
        </form>

      </div>
      
    </div>
  );
};



export default CreateAccount;