import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePopup.css';
import { FaUser } from "react-icons/fa";
import { getCustomerProfile } from '../../services/customerApi';

const ProfilePopup = () => {
    const navigate = useNavigate();
    const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profile, setProfile] = useState(null);
  const handleShowProfile = async () => {
    try {
      const storedCustomer = JSON.parse(localStorage.getItem("customer"));
      if (!storedCustomer?.customerId) {
        alert("Không tìm thấy thông tin người dùng");
        return;
      }

      const data = await getCustomerProfile(storedUser.customerId); // gọi API
      setProfile(data);
      setShowProfilePopup(true);
    } catch (error) {
      alert("Không thể lấy thông tin người dùng: " + error.message);
    }
  };

    const handleSignOut = () => {
        localStorage.removeItem("user");
        setShowProfilePopup(false);
        navigate("/");
    };

    return (
        <>
            <FaUser 
                style={{
                    fontSize:'34px',
                    border:'#241c1cff solid 1px',
                    borderRadius:'50px',
                    cursor:'pointer'
                }}
                onClick={handleShowProfile}
            />
            <span>{name || "Profile"}</span>

            {showProfilePopup && profile && (
                <div className="popup-overlay">
                    <div className="popup profile-detail">
                        <h3>Thông tin cá nhân</h3>
                        <img 
                            src="https://thichtrangtri.com/wp-content/uploads/2025/05/hinh-anh-con-meo-cute-1.jpg" 
                            alt={profile.name} 
                            className="popup-avatar" 
                        />
                        <p><b>Họ tên:</b> {profile.name}</p>
                        <p><b>Email:</b> {profile.email}</p>
                        <p><b>Số điện thoại:</b> {profile.phoneNumber}</p>
                        <p><b>Vai trò:</b> {profile.position}</p>
                        <div className="popup-actions">
                            <div className="popup-menu">
                                <div className="popup-item">
                                    <span>🔒</span>
                                    <a href="/changepass" style={{ textDecoration: 'none', color: '#008080' }}>
                                        <p>Đổi mật khẩu</p>
                                    </a>
                                </div>
                                <div className="popup-actions">
                                    <button className="cancel-btn" onClick={() => setShowProfilePopup(false)}>
                                        Đóng
                                    </button>
                                    <button className="signout-btn" onClick={handleSignOut}>
                                        🚪 Đăng xuất
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfilePopup;