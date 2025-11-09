import React from 'react';
import { Nav } from 'react-bootstrap';
import { FaHome, FaFileInvoice, FaShoppingCart } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: FaHome,
      label: 'Trang chủ',
      path: '/',
    },
    {
      icon: FaFileInvoice,
      label: 'Báo giá của tôi',
      path: '/customer/quotations',
    },
    {
      icon: FaFileInvoice, // Reusing FaFileInvoice for "Yêu cầu đã gửi"
      label: 'Yêu cầu đã gửi',
      path: '/customer/rfqs',
    },
    {
      icon: FaShoppingCart,
      label: 'Đơn hàng',
      path: '/customer/orders',
    }
  ];

  return (
    <div className="sidebar sidebar-dark">
      <div className="sidebar-content p-3">
        <Nav className="flex-column">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Nav.Link
                key={index}
                href="#"
                className={`sidebar-item d-flex align-items-center py-3 px-3 mb-1 rounded ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
              >
                <IconComponent className="me-3" size={16} />
                <span>{item.label}</span>
              </Nav.Link>
            );
          })}
        </Nav>
      </div>
    </div>
  );
};

export default Sidebar;

