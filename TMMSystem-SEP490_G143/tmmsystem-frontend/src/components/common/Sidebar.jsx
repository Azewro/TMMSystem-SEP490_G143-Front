import React from 'react';
import { Nav } from 'react-bootstrap';
import { FaUser, FaFileInvoice, FaShoppingCart } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: FaUser,
      label: 'Khách Hàng',
      path: '/customer/dashboard',
      isActive: location.pathname === '/customer/dashboard'
    },
    {
      icon: FaFileInvoice,
      label: 'Yêu cầu báo giá',
      path: '/customer/quotes',
      isActive: location.pathname.includes('/quotes') || location.pathname.includes('/quote-request')
    },
    {
      icon: FaShoppingCart,
      label: 'Đơn hàng',
      path: '/customer/orders',
      isActive: location.pathname.includes('/orders')
    }
  ];

  return (
    <div className="sidebar bg-light border-end" style={{ width: '250px', minHeight: '100vh' }}>
      <div className="sidebar-content p-3">
        <Nav className="flex-column">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Nav.Link
                key={index}
                href="#"
                className={`sidebar-item d-flex align-items-center py-3 px-3 mb-1 rounded ${
                  item.isActive ? 'bg-primary text-white' : 'text-dark'
                }`}
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
