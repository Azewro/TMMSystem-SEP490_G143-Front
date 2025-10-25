import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePopup.css';
import { FaUser } from "react-icons/fa";
import { changePassword } from '../../services/authApi';
import axios from 'axios';

const ProfilePopup = () => {
  const [account, setAccount] = useState({});
  const [name, setName] = useState("");
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null); 
  const [showChangePasswordPopup, setShowChangePasswordPopup] = useState(false);
  const [passwordData, setPasswordData] = useState({
    email: '',
    currentPassword: '',
    newPassword: ''
  });
  const [changePasswordMessage, setChangePasswordMessage] = useState('');
  const navigate = useNavigate();

  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phoneNumber: '',
    address: '',
    taxCode: '',
    isActive: true,
    isVerified: true,
    registrationType: 'BUSINESS',
    createdById: 0
  });

  
  const createCompany = async (token, companyData) => {
    const res = await axios.post(
      'https://tmmsystem-sep490g143-production.up.railway.app/v1/auth/customer/create-company',
      companyData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data;
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const token = storedUser?.token || storedUser?.accessToken;

      if (!token || !storedUser?.customerId) {
        alert('Không tìm thấy thông tin đăng nhập');
        return;
      }

      const dataToSend = {
        companyName: companyForm.companyName,
        contactPerson: companyForm.contactPerson,
        email: companyForm.email,
        phoneNumber: companyForm.phoneNumber,
        address: companyForm.address,
        taxCode: companyForm.taxCode,
        isActive: true,
        isVerified: true,
        registerType: companyForm.registrationType,
        createdById: storedUser.userId
      };

      await createCompany(token, dataToSend);
      alert('✅ Tạo công ty thành công!');

      setCompanyForm({
        companyName: '',
        contactPerson: '',
        email: '',
        phoneNumber: '',
        address: '',
        taxCode: '',
        isActive: true,
        isVerified: true,
        registrationType: companyForm.registrationType,
        createdById: storedUser.customerId
      });

      
      fetchCompany(token);
    } catch (err) {
      alert('❌ Tạo công ty thất bại: ' + (err.response?.data?.message || err.message));
      console.log('Công ty đã được tạo:', err);
    }
  };

  
  const fetchProfile = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser?.accessToken) {
        console.error("Không tìm thấy token trong localStorage");
        return;
      }

      const role = storedUser.role?.toUpperCase();
      const id = role === "CUSTOMER" ? storedUser.customerId : storedUser.userId;
      if (!id) {
        console.error("Không tìm thấy ID phù hợp trong localStorage");
        return;
      }

      let url = "";
      if (role === "CUSTOMER") {
        url = `https://tmmsystem-sep490g143-production.up.railway.app/v1/customers/${id}`;
      } else {
        url = `https://tmmsystem-sep490g143-production.up.railway.app/api/admin/users/${id}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${storedUser.accessToken}` },
      });

      setProfile(res.data);
      setName(res.data.name || res.data.contactPerson || "Người dùng");

     
      fetchCompany(storedUser.accessToken);
    } catch (error) {
      console.error("❌ Lỗi khi lấy thông tin profile:", error);
      setName("User");
    }
  };

  
  const fetchCompany = async (token) => {
    try {
      const res = await axios.get(
        'https://tmmsystem-sep490g143-production.up.railway.app/v1/auth/customer/profile',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCompany(res.data);
    } catch (error) {
      console.error("❌ Lỗi khi lấy thông tin công ty:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleShowProfile = async () => {
    setShowProfilePopup(true);
  };

  const handleSignOut = () => {
    localStorage.removeItem("user");
    setShowProfilePopup(false);
    navigate("/");
  };

  const handleChange = (e) => {
    setAccount({
      ...account,
      [e.target.name]: e.target.value,
    });
  };

  const openEditPopup = (user) => {
    setAccount(user);
    setShowEditPopup(true);
  };

  const closeEditPopup = () => {
    setShowEditPopup(false);
    setAccount({});
  };

  const handlePasswordDataChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordMessage('');
    try {
      await changePassword(
        passwordData.email,
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setChangePasswordMessage("✅ Mật khẩu đã được thay đổi thành công!");
      setPasswordData({
        email: '',
        currentPassword: '',
        newPassword: ''
      });
      setTimeout(() => {
        setShowChangePasswordPopup(false);
        setChangePasswordMessage('');
      }, 2000);
    } catch (error) {
      setChangePasswordMessage("❌ " + error.message);
    }
  };

  return (
    <>
      <FaUser
        style={{
          fontSize: '34px',
          border: '#241c1cff solid 1px',
          borderRadius: '50px',
          cursor: 'pointer'
        }}
        onClick={handleShowProfile}
      />
      <span>{name || "Profile"}</span>

      
      {showEditPopup && (
        <div className="popup-overlay" >
          <div className="popup2">
            <h3>Cập nhật tài khoản</h3>
            <form onSubmit={(e) => e.preventDefault()} >
              <input  type="text" name="name" value={account.name || ""} onChange={handleChange} placeholder="Họ và tên" />
              <input type="email" name="email" value={account.email || ""} onChange={handleChange} placeholder="Email" />
            </form>

            <hr />
            <h4>Thông tin công ty</h4>
            <form onSubmit={handleCreateCompany}>
              <input type="text" name="companyName" value={companyForm.companyName} onChange={handleCompanyChange} placeholder="Tên công ty" required />
              <input type="text" name="contactPerson" value={companyForm.contactPerson} onChange={handleCompanyChange} placeholder="Người liên hệ" />
              <input type="email" name="email" value={companyForm.email} onChange={handleCompanyChange} placeholder="Email công ty" />
              <input type="text" name="phoneNumber" value={companyForm.phoneNumber} onChange={handleCompanyChange} placeholder="Số điện thoại công ty" />
              <input type="text" name="address" value={companyForm.address} onChange={handleCompanyChange} placeholder="Địa chỉ" />
              <input type="text" name="taxCode" value={companyForm.taxCode} onChange={handleCompanyChange} placeholder="Mã số thuế" />
              <div className="popup-actions">
                <button type="submit" className="save-btn">Thêm công ty</button>
                <button type="button" className="cancel-btn" onClick={closeEditPopup}>Đóng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showProfilePopup && profile && (
        <div className="popup-overlay">
          <div className="popup profile-detail">
            <h3>Thông tin cá nhân</h3>
            <img
              src="https://thichtrangtri.com/wp-content/uploads/2025/05/hinh-anh-con-meo-cute-1.jpg"
              alt={profile.name || profile.customerName}
              className="popup-avatar"
            />

            <p><b>Họ tên:</b> {profile.name || profile.customerName}</p>
            <p><b>Email:</b> {profile.email}</p>
            <p><b>Số điện thoại:</b> {profile.phoneNumber}</p>
            {profile.roleName && <p><b>Vai trò:</b> {profile.roleName}</p>}

            
            {company && (
              <>
                <hr />
                <h4>Thông tin công ty</h4>
                <p><b>Tên công ty:</b> {company.companyName}</p>
                <p><b>Người liên hệ:</b> {company.contactPerson}</p>
                <p><b>Email:</b> {company.email}</p>
                <p><b>Điện thoại:</b> {company.phoneNumber}</p>
                <p><b>Địa chỉ:</b> {company.address}</p>
                <p><b>Mã số thuế:</b> {company.taxCode}</p>
              </>
            )}

            <div className="popup-actions">
              <div className="popup-menu">
                <div
                  className="popup-item"
                  onClick={() => {
                    openEditPopup(profile);
                    setShowProfilePopup(false);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <span>🔑</span>
                  <p>Cập nhật tài khoản</p>
                </div>
                <div className="popup-item"><span>🔔</span><p>Thông báo</p></div>
                <div className="popup-item">
                  <span>🔒</span>
                  <p
                    onClick={() => {
                      setShowChangePasswordPopup(true);
                      setShowProfilePopup(false);
                    }}
                  >
                    Đổi mật khẩu
                  </p>
                </div>
                <div className="popup-actions">
                  <button className="cancel-btn" onClick={() => setShowProfilePopup(false)}>Đóng</button>
                  <button className="signout-btn" onClick={handleSignOut}>🚪 Đăng xuất</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {showChangePasswordPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Đổi Mật Khẩu</h3>
            <form onSubmit={handleChangePassword}>
              <input type="email" name="email" value={passwordData.email} onChange={handlePasswordDataChange} placeholder="Nhập email" required />
              <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordDataChange} placeholder="Mật khẩu hiện tại" required />
              <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordDataChange} placeholder="Mật khẩu mới" required />
              {changePasswordMessage && (
                <p className={changePasswordMessage.includes('✅') ? 'success-message' : 'error-message'}>
                  {changePasswordMessage}
                </p>
              )}
              <div className="popup-actions">
                <button type="submit" className="save-btn">Đổi Mật Khẩu</button>
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowChangePasswordPopup(false);
                  setPasswordData({ email: '', currentPassword: '', newPassword: '' });
                  setChangePasswordMessage('');
                }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePopup;
