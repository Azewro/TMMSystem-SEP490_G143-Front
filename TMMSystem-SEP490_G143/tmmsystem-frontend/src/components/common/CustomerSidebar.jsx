import React from 'react';
import { Nav } from 'react-bootstrap';
import { FaUser, FaFileInvoice, FaShoppingCart } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const CustomerSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/customer/dashboard', label: 'Tổng quan', icon: <FaUser /> },
    { path: '/customer/quotations', label: 'Yêu cầu báo giá', icon: <FaFileInvoice /> },
    { path: '/customer/quote-request', label: 'Tạo yêu cầu báo giá', icon: <FaShoppingCart /> },
    { path: '/customer/orders', label: 'Đơn hàng', icon: <FaShoppingCart /> },
  ];

  return (
    <div className="sidebar" style={{ width: '250px', backgroundColor: '#343a40', minHeight: '100vh' }}>
      <Nav className="flex-column">
        {menuItems.map((item) => (
          <Nav.Link
            key={item.path}
            href={item.path}
            className={`text-light p-3 ${location.pathname === item.path ? 'bg-primary' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <span className="me-2">{item.icon}</span>
            {item.label}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
};

export default CustomerSidebar;
