import React, { useEffect, useState } from "react";
import "./AdminDashboard.css";
import { getAllUsers, getUserByID, toggleUserActive, UpdateUsers } from "../../services/userApi";
import Navbar from "../../components/Navbar";
import { data, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [account, setAccount] = useState({});
    const [profile, setProfile] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [name, setName] = useState("");
    const navigate = useNavigate();
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
            fetchUsers();
        } catch (err) {
            alert("Update failed: " + err.message);
        }
    };

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
    const filteredUsers = users.filter((user) => {
        const term = searchTerm.toLowerCase();
        return (
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.phoneNumber?.toLowerCase().includes(term) ||
            user.roleName?.toLowerCase().includes(term)
        );
    });

    useEffect(() => {
        fetchUsers();
    }, []);
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser && storedUser.name) {
            setName(storedUser.name);
        } else {
            // Nếu không có tên trong localStorage, lấy từ API
            const fetchUserProfile = async () => {
                try {
                    const userData = await getUserByID(storedUser.userId);
                    setName(userData.name);
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setName("Profile");
                }
            };
            if (storedUser && storedUser.userId) {
                fetchUserProfile();
            }
        }
    }, []);

    const openEditPopup = (user) => {
        setAccount(user);
        setShowEditPopup(true);
    };

    const closeEditPopup = () => {
        setShowEditPopup(false);
        setAccount({});
    };


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
        setName("");
        setProfile(null);
        setShowProfilePopup(false);
        navigate("/");
    };

    return (
        <div className="dashboard-layout">
            <Navbar />
            <div className="dashboard-content">

                <div style={{ display: "flex", gap: "10px", cursor: "pointer" }} onClick={handleShowProfile}>
                    <FaUser className="icon-dashboard" />
                    <span className="text-dashboard">{name ? name : "Profile"}</span>
                </div>

                <div className="header">
                    <h2>Quản Lý Tài Khoản</h2>
                    <input
                        type="text"
                        className="search"
                        placeholder="Tìm kiếm "
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <a href="/createuser">
                        <button className="create-btn">Tạo Tài Khoản</button>
                    </a>
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
            </div>
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
                                    <a href="/changepass" style={{ textDecoration: 'none', color: '#008080' }}><p>Đổi mật khẩu</p></a>
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
        </div>
    );
};

export default AdminDashboard;
