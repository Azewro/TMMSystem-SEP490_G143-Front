import React from 'react';
import { Nav } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaClipboardList,
  FaBox,
  FaIndustry,
  FaExclamationTriangle,
  FaTruck
} from 'react-icons/fa';

const PlanningSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: FaClipboardList,
      label: 'Yêu cầu báo giá',
      path: '/planning/quote-requests',
    },
    {
      icon: FaBox,
      label: 'Đơn hàng',
      path: '/planning/orders',
    },
    {
      icon: FaIndustry,
      label: 'Lệnh Sản Xuất',
      path: '/planning/production-orders',
    },
    {
      icon: FaExclamationTriangle,
      label: 'Báo cáo rủi ro',
      path: '/planning/risk-reports',
    },
    {
      icon: FaTruck,
      label: 'Ảnh hưởng giao hàng',
      path: '/planning/delivery-impact',
    }
  ];

  return (
    <div className="sidebar bg-light border-end" style={{ width: '250px', minHeight: 'calc(100vh - 70px)' }}>
      <div className="sidebar-content p-3">
        <Nav className="flex-column">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Nav.Link
                key={index}
                href="#"
                className={`sidebar-item d-flex align-items-center py-3 px-3 mb-1 rounded ${isActive ? 'bg-primary text-white' : 'text-dark'}`}
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

export default PlanningSidebar;
