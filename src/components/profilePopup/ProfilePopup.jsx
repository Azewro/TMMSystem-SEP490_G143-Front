import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePopup.css';
import { FaUser } from "react-icons/fa";
import { getUserByID } from '../../services/userApi';
import { changePassword } from '../../services/authApi';
const ProfilePopup = () => {
    const [users, setUsers] = useState([]);
    const [account, setAccount] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showEditPopup, setShowEditPopup] = useState(false);
    const navigate = useNavigate();
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [profile, setProfile] = useState(null);
    const [showChangePasswordPopup, setShowChangePasswordPopup] = useState(false);
    const [passwordData, setPasswordData] = useState({
        email: '',
        currentPassword: '',
        newPassword: ''
    });
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
    const [changePasswordMessage, setChangePasswordMessage] = useState('');
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser && storedUser.name) {
            setName(storedUser.name);
        } else {
            const fetchUserProfile = async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser?.userId) {
      console.log("Không tìm thấy ID người dùng");
      return;
    }

   
    if (!storedUser.token) {
      console.log("Không tìm thấy token");
      navigate("/"); 
      return;
    }

    const userData = await getUserByID(storedUser.userId);
    if (userData) {
      setName(userData.name);
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin profile:", error);
    setName("User"); 
  }
};
        }
    }, []);

    const handleShowProfile = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (!storedUser?.userId) {
                alert("Không tìm thấy thông tin người dùng");
                return;
            }
            const data = await getUserByID(storedUser.userId);
            setProfile(data);
            setShowProfilePopup(true);
        } catch (error) {
            alert("Lấy thông tin profile thất bại: " + error.message);
        }
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

    const handleEditAccount = async (e) => {
        e.preventDefault();
        try {
            await UpdateUsers(account.id, account);
            alert("Update successfully!");
            setShowEditPopup(false);

        } catch (err) {
            alert("Update failed: " + err.message);
        }
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
                    <div className="popup">
                        <h3>Cập nhật tài khoản</h3>
                        <form onSubmit={handleEditAccount}>
                            <input type="text" name="name" value={account.name || ""} onChange={handleChange} placeholder="Họ và tên" />
                            <input type="email" name="email" value={account.email || ""} onChange={handleChange} placeholder="Email" />
                            <input
                                type="text"
                                name="phoneNumber"
                                value={account.phoneNumber || ""}
                                onChange={handleChange}
                                placeholder="Số điện thoại"
                            />
                            <select name="roleName" value={account.roleName || ""} onChange={handleChange}>
                                <option value="ADMIN">ADMIN</option>
                                <option value="USER">USER</option>
                                <option value="MANAGER">MANAGER</option>
                                <option value="SALES">SALES</option>
                            </select>
                            <div className="popup-actions">
                                <button type="submit" className="save-btn">
                                    Lưu
                                </button>
                                <button type="button" className="cancel-btn" onClick={closeEditPopup}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showProfilePopup && profile && (
                <div className="popup-overlay">
                    <div className="popup profile-detail" >
                        <h3>Thông tin cá nhân</h3>
                        <img src="https://thichtrangtri.com/wp-content/uploads/2025/05/hinh-anh-con-meo-cute-1.jpg" alt={profile.name} className="popup-avatar" />
                        <p><b>Họ tên:</b> {profile.name}</p>
                        <p><b>Email:</b> {profile.email}</p>
                        <p><b>Số điện thoại:</b> {profile.phoneNumber}</p>
                        <p><b>Vai trò:</b> {profile.roleName}</p>
                        <div className="popup-actions">
                            <div className="popup-menu">
                                <div className="popup-item" onClick={() => {
                                    openEditPopup(profile);
                                    setShowProfilePopup(false)
                                }}
                                    style={{ cursor: "pointer" }} >
                                    <span>🔑</span>
                                    <p>Cập nhật tài khoản</p>
                                </div>
                                <div className="popup-item">
                                    <span>🔔</span>
                                    <p>Thông báo</p>
                                </div>

                                <div className="popup-item">
                                    <span>🔒</span>
                                    <p onClick={() => {
                                        setShowChangePasswordPopup(true);
                                        setShowProfilePopup(false);
                                    }}>Đổi mật khẩu</p>
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
                            <input
                                type="email"
                                name="email"
                                value={passwordData.email}
                                onChange={handlePasswordDataChange}
                                placeholder="Nhập email"
                                required
                            />
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordDataChange}
                                placeholder="Mật khẩu hiện tại"
                                required
                            />
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordDataChange}
                                placeholder="Mật khẩu mới"
                                required
                            />
                            {changePasswordMessage && (
                                <p className={changePasswordMessage.includes('✅') ? 'success-message' : 'error-message'}>
                                    {changePasswordMessage}
                                </p>
                            )}
                            <div className="popup-actions">
                                <button type="submit" className="save-btn">
                                    Đổi Mật Khẩu
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setShowChangePasswordPopup(false);
                                        setPasswordData({
                                            email: '',
                                            currentPassword: '',
                                            newPassword: ''
                                        });
                                        setChangePasswordMessage('');
                                    }}
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </>
    );
};


export default ProfilePopup;