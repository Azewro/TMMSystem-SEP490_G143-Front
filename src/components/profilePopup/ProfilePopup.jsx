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
  const [showChangePasswordPopup, setShowChangePasswordPopup] = useState(false);
  const [passwordData, setPasswordData] = useState({
    email: '',
    currentPassword: '',
    newPassword: ''
  });
  const [changePasswordMessage, setChangePasswordMessage] = useState('');
  const navigate = useNavigate();

  
  const [company, setCompany] = useState({
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

  
  const getProfileByRole = async (id, role, token) => {
    let url = '';
    if (role === 'CUSTOMER') {
      url = `https://tmmsystem-sep490g143-production.up.railway.app/v1/customers/${id}`;
    } else {
      url = `https://tmmsystem-sep490g143-production.up.railway.app/api/admin/users/${id}`;
    }

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  };

  // 🟨 Gọi API tạo công ty
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
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser?.token || !storedUser?.userId) {
        alert('Không tìm thấy thông tin đăng nhập');
        return;
      }

      const dataToSend = {
        ...company,
        createdById: storedUser.userId
      };

      await createCompany(storedUser.token, dataToSend);
      alert('✅ Tạo công ty thành công!');
      setCompany({
        companyName: '',
        contactPerson: '',
        email: '',
        phoneNumber: '',
        address: '',
        taxCode: '',
        isActive: true,
        isVerified: true,
        registrationType: 'BUSINESS',
        createdById: storedUser.userId
      });
    } catch (err) {
      alert('❌ Tạo công ty thất bại: ' + (err.response?.data?.message || err.message));
    }
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

  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser?.userId || !storedUser?.token) {
        //   navigate("/");
          return;
        }

        const role = storedUser.roleName?.toUpperCase();
        const profileData = await getProfileByRole(storedUser.userId, role, storedUser.token);
        setProfile(profileData);
        setName(profileData?.name || profileData?.customerName || "Người dùng");
      } catch (error) {
        console.error("Lỗi khi lấy thông tin profile:", error);
        setName("User");
      }
    };

    fetchProfile();
  }, [navigate]);

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
        <div className="popup-overlay">
          <div className="popup2">
            <h3>Cập nhật tài khoản</h3>
            <form onSubmit={(e) => e.preventDefault()} >
              <input  type="text" name="name" value={account.name || ""} onChange={handleChange} placeholder="Họ và tên" />
              <input type="email" name="email" value={account.email || ""} onChange={handleChange} placeholder="Email" />
              
              
            </form>

            
            <hr />
            <h4>Thông tin công ty</h4>
            <form onSubmit={handleCreateCompany}>
              <input type="text" name="companyName" value={company.companyName} onChange={handleCompanyChange} placeholder="Tên công ty" required />
              <input type="text" name="contactPerson" value={company.contactPerson} onChange={handleCompanyChange} placeholder="Người liên hệ" />
              <input type="email" name="email" value={company.email} onChange={handleCompanyChange} placeholder="Email công ty" />
              <input type="text" name="phoneNumber" value={company.phoneNumber} onChange={handleCompanyChange} placeholder="Số điện thoại công ty" />
              <input type="text" name="address" value={company.address} onChange={handleCompanyChange} placeholder="Địa chỉ" />
              <input type="text" name="taxCode" value={company.taxCode} onChange={handleCompanyChange} placeholder="Mã số thuế" />
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
