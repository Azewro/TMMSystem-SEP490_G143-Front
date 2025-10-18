import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";
import { getAllUsers, toggleUserActive, UpdateUsers, CreateUsers } from "../../services/userApi";
import { changePassword } from "../../services/authApi";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [showChangePasswordPopup, setShowChangePasswordPopup] = useState(false);
    const [account, setAccount] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [userData, setUserData] = useState({
        email: '',
        phoneNumber: '',
        roleId: '',     
        password: '',
        confirmPassword: '',
        name: ''
    });
    const [passwordData, setPasswordData] = useState({
        email: '',
        currentPassword: '',
        newPassword: ''
    });
    const [changePasswordMessage, setChangePasswordMessage] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleActive = async (user) => {
        const newValue = !user.isActive;
        const confirmMsg = newValue
            ? `Bạn có chắc muốn mở khóa tài khoản "${user.name}" không?`
            : `Bạn có chắc muốn khóa (ban) tài khoản "${user.name}" không?`;

        if (!window.confirm(confirmMsg)) return;
        try {
            await toggleUserActive(user.id, newValue);
            alert(`Tài khoản đã được ${newValue ? "mở khóa" : "khóa"} thành công!`);
            fetchUsers();
        } catch (error) {
            alert("Cập nhật trạng thái thất bại: " + error.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (showEditPopup) {
            setAccount({
                ...account,
                [name]: value,
            });
        } else {
            setUserData({
                ...userData,
                [name]: value
            });
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

    const handleCreateAccount = async () => {
        if (userData.password !== userData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const payload = {
                email: userData.email,
                password: userData.password,
                name: userData.name || "New User",
                role: { id: parseInt(userData.roleId) }
            };

            await CreateUsers(payload);
            alert("User created successfully!");
            setShowCreatePopup(false);
            fetchUsers();
            setUserData({
                email: '',
                phoneNumber: '',
                roleId: '',
                password: '',
                confirmPassword: '',
                name: ''
            });
        } catch (error) {
            alert("User creation failed! " + error.message);
            console.error(error);
        }
    };

    const handleEditAccount = async (e) => {
        e.preventDefault();
        try {
            await UpdateUsers(account.id, account);
            alert("Update successfully!");
            setShowEditPopup(false);
            fetchUsers();
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

    const filteredUsers = users.filter((user) => {
        const term = searchTerm.toLowerCase();
        return (
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.phoneNumber?.toLowerCase().includes(term) ||
            user.roleName?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="dashboard-layout">
            <Navbar />
            <div className="dashboard-content">
                <div className="header">
    <h2>Quản Lý Tài Khoản</h2>
    <input
        type="text" 
        className="search"
        placeholder="Tìm kiếm "
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
    />
    <button className="create-btn" onClick={() => setShowCreatePopup(true)}>
        Tạo Tài Khoản
    </button>
</div>

                {loading && <p className="loading-text">Đang tải dữ liệu...</p>}
                {error && <p className="error-text">{error}</p>}
                {!loading && !error && (
                    <div className="table-wrapper">
                        <table className="user-table">
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Họ Và Tên</th>
                                    <th>Email</th>
                                    <th>Số Điện Thoại</th>
                                    <th>Vai Trò</th>
                                    <th>Trạng Thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user, index) => (
                                        <tr key={user.id}>
                                            <td>{index + 1}</td>
                                            <td className="user-info">
                                                <img src={user.avatar} alt={user.name} className="avatar" />
                                                <span>{user.name}</span>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{user.phoneNumber}</td>
                                            <td>{user.roleName}</td>
                                            <td>
                                                <span
                                                    className={`status-icon ${user.isActive ? "active" : "inactive"}`}
                                                    onClick={() => handleActive(user)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    {user.isActive ? "👁️" : "🚫"}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="update-btn" onClick={() => openEditPopup(user)}>
                                                    Cập nhật
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="no-data">
                                            Không có người dùng nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                
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

                
                {showCreatePopup && (
                    <div className="popup-overlay">
                        <div className="popup">
                            <h3>Tạo Tài Khoản Mới</h3>
                            <form onSubmit={(e) => { e.preventDefault(); handleCreateAccount(); }}>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={userData.email} 
                                    onChange={handleChange}
                                    placeholder="Email"
                                    required
                                />
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={userData.name} 
                                    onChange={handleChange}
                                    placeholder="Họ và tên"
                                    required
                                />
                                <select 
                                    name="roleId" 
                                    value={userData.roleId} 
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">--Chọn Role--</option>
                                    <option value="7">MANAGER</option>
                                    <option value="5">ADMIN</option>
                                    <option value="8">USER</option>
                                    <option value="6">SALES</option>
                                </select>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={userData.password} 
                                    onChange={handleChange}
                                    placeholder="Mật khẩu"
                                    required
                                />
                                <input 
                                    type="password" 
                                    name="confirmPassword" 
                                    value={userData.confirmPassword} 
                                    onChange={handleChange}
                                    placeholder="Xác nhận mật khẩu"
                                    required
                                />
                                <div className="popup-actions">
                                    <button type="submit" className="save-btn">
                                        Tạo
                                    </button>
                                    <button 
                                        type="button" 
                                        className="cancel-btn" 
                                        onClick={() => setShowCreatePopup(false)}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </form>
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
            </div>
        </div>
    );
};

export default AdminDashboard;