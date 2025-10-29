import React from 'react';
import { Navbar, Nav, Form, FormControl, Button, Dropdown } from 'react-bootstrap';
import { FaSearch, FaBell, FaUserCircle, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm border-bottom px-3">
      {/* Logo */}
      <Navbar.Brand href="#" className="me-4">
        <img
          src="/logo.png"
          alt="TMM System"
          height="40"
          className="d-inline-block align-top"
        />
      </Navbar.Brand>

      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        {/* Search Bar */}
        <Form className="d-flex me-auto" style={{ maxWidth: '400px', width: '100%' }}>
          <FormControl
            type="search"
            placeholder="Tìm kiếm sản phẩm..."
            className="me-2"
            aria-label="Search"
          />
          <Button variant="outline-primary" type="submit">
            <FaSearch />
          </Button>
        </Form>

        {/* Right Side Navigation */}
        <Nav className="ms-auto align-items-center">
          {/* Create Quote Request Button */}
          <Button 
            variant="primary" 
            className="me-3"
            onClick={() => navigate('/customer/quote-request')}
          >
            Tạo yêu cầu báo giá
          </Button>

          {/* Notifications */}
          <Nav.Link href="#" className="position-relative me-3">
            <FaBell size={20} />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              3
            </span>
          </Nav.Link>

          {/* User Dropdown */}
          <Dropdown align="end">
            <Dropdown.Toggle variant="link" className="text-decoration-none text-dark">
              <FaUserCircle size={24} className="me-1" />
              <span>{user?.name || user?.email || 'User'}</span>
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item href="#profile">
                <FaUser className="me-2" />
                Hồ sơ
              </Dropdown.Item>
              <Dropdown.Item href="#settings">
                <FaCog className="me-2" />
                Cài đặt
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>
                <FaSignOutAlt className="me-2" />
                Đăng xuất
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Header;
