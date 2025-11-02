import React from 'react';
import { Nav } from 'react-bootstrap';
import { FaClipboardList, FaReceipt, FaShoppingCart, FaTruck } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const InternalSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: FaClipboardList,
      label: 'Yêu cầu báo giá',
      path: '/internal/quote-requests',
    },
    {
      icon: FaReceipt,
      label: 'Danh sách báo giá',
      path: '/internal/quotations',
    },
    {
      icon: FaShoppingCart,
      label: 'Đơn hàng',
      path: '/internal/orders',
    },
    {
      icon: FaTruck,
      label: 'Ảnh hưởng giao hàng',
      path: '/internal/delivery',
    }
  ];

  return (
    <div className="sidebar bg-light border-end flex-shrink-0" style={{ width: '250px', minHeight: 'calc(100vh - 70px)' }}>
      <div className="sidebar-content p-3">
        <Nav className="flex-column">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = item.path === '/internal/quote-requests' ? location.pathname.startsWith(item.path) || location.pathname.startsWith('/internal/rfqs') : location.pathname.startsWith(item.path);

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

export default InternalSidebar;
