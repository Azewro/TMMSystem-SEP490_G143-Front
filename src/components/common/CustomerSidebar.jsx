import React from 'react';
import { Nav } from 'react-bootstrap';
import { FaTachometerAlt, FaFileInvoice, FaPlusSquare, FaShoppingCart } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Sidebar.css'; // Import the shared sidebar styles

const CustomerSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: FaTachometerAlt,
      label: 'Tổng quan',
      path: '/customer/dashboard',
    },
    {
      icon: FaFileInvoice,
      label: 'Yêu cầu đã gửi',
      path: '/customer/rfqs',
    },
    {
      icon: FaShoppingCart,
      label: 'Đơn hàng của tôi',
      path: '/customer/orders',
    }
  ];

  return (
    <div className="sidebar sidebar-dark">
      <div className="sidebar-content p-3">
        <h5 className="text-white px-3 mb-3">Menu</h5>
        <Nav className="flex-column">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            // Check if the current path starts with the item's path.
            // For the dashboard, we use an exact match.
            const isActive = item.path === '/customer/dashboard' 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);

            return (
              <Nav.Link
                key={index}
                className={`sidebar-item d-flex align-items-center py-3 px-3 mb-1 rounded ${isActive ? 'bg-primary text-white' : 'text-white'}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (!isActive) {
                    navigate(item.path);
                  }
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

export default CustomerSidebar;
