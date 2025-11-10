import React, { useState } from 'react';
import { Navbar, Nav, Form, FormControl, Button, Dropdown } from 'react-bootstrap';
import { FaSearch, FaBell, FaUserCircle, FaTachometerAlt, FaCog, FaSignOutAlt, FaShoppingCart, FaUser, FaKey } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../modals/ProfileModal';
import ChangePasswordModal from '../modals/ChangePasswordModal';

const Header = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    const role = user.role?.toUpperCase();
    
    switch (role) {
      case 'CUSTOMER':
        return '/customer/dashboard';
      case 'ADMIN':
        return '/admin/users';
      case 'DIRECTOR':
        return '/director/contract-approval';
      case 'PLANNING_DEPARTMENT':
      case 'PLANNING':
        return '/planning/quote-requests';
      case 'SALE_STAFF':
      case 'SALES':
        return '/sales/rfqs';
      default:
        return '/internal/quote-requests'; // Default for other internal roles
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm px-3 sticky-top">
      {/* Logo */}
      <Navbar.Brand href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} style={{cursor: 'pointer'}}>
        <img
          src="/logo.png"
          alt="TMM System"
          height="40"
          className="d-inline-block align-top"
        />
      </Navbar.Brand>

      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        {/* Search Bar - Only for Customers */}
        {user?.role === 'CUSTOMER' && (
          <Form className="d-flex me-auto" style={{ maxWidth: '400px', width: '100%' }}>
            <FormControl
              type="search"
              placeholder="Tìm kiếm sản phẩm..."
              className="me-2"
              aria-label="Search"
            />
            <Button variant="outline-light" type="submit">
              <FaSearch />
            </Button>
          </Form>
        )}

        {/* Right Side Navigation */}
        <Nav className="ms-auto align-items-center">
          {user ? (
            <>
              {/* Shopping Cart for Customers */}
              {user.role === 'CUSTOMER' && (
                <Nav.Link onClick={() => navigate('/cart')} className="position-relative me-3">
                  <FaShoppingCart size={20} />
                  {itemCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">
                      {itemCount}
                    </span>
                  )}
                </Nav.Link>
              )}

              {/* Notifications */}
              <Nav.Link href="#" className="position-relative me-3">
                <FaBell size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  3
                </span>
              </Nav.Link>

              {/* User Dropdown */}
              <Dropdown align="end">
                <Dropdown.Toggle as={Nav.Link} className="text-white d-flex align-items-center">
                  <FaUserCircle size={24} className="me-2" />
                  <span>{user?.name || user?.email || 'User'}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => navigate(getDashboardPath())}>
                    <FaTachometerAlt className="me-2" />
                    Bảng điều khiển
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setShowProfileModal(true)}>
                    <FaUser className="me-2" />
                    Thông tin cá nhân
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setShowChangePasswordModal(true)}>
                    <FaKey className="me-2" />
                    Đổi mật khẩu
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" />
                    Đăng xuất
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </>
          ) : (
            <>
              <Button variant="outline-light" className="me-2" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
              <Button variant="primary" onClick={() => navigate('/register')}>
                Đăng ký
              </Button>
            </>
          )}
        </Nav>
      </Navbar.Collapse>

      {/* Profile Modal */}
      <ProfileModal
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        show={showChangePasswordModal}
        onHide={() => setShowChangePasswordModal(false)}
      />
    </Navbar>
  );
};

export default Header;