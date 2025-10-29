import React from 'react';
import { Nav } from 'react-bootstrap';
import { FaUserTie, FaFileInvoice, FaShoppingCart, FaTruck, FaClipboardList, FaReceipt } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const InternalSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      icon: FaUserTie,
      label: 'Nhân viên kinh doanh',
      path: '/internal/dashboard',
      isActive: location.pathname === '/internal/dashboard'
    },
    {
      icon: FaClipboardList,
      label: 'Yêu cầu báo giá',
      path: '/internal/quote-requests',
      isActive: location.pathname === '/internal/quote-requests' || location.pathname.includes('/internal/rfq-detail')
    },
    {
      icon: FaReceipt, // New icon for Báo giá list
      label: 'Báo giá',
      path: '/internal/quotations',
      isActive: location.pathname === '/internal/quotations' || location.pathname.includes('/internal/quotations/')
    },
    {
      icon: FaFileInvoice,
      label: 'Quản lý báo giá',
      path: '/internal/quotes/management',
      isActive: location.pathname === '/internal/quotes/management' || location.pathname.includes('/internal/quote-detail')
    },
    {
      icon: FaShoppingCart,
      label: 'Đơn hàng',
      path: '/internal/orders',
      isActive: location.pathname.includes('/orders')
    },
    {
      icon: FaTruck,
      label: 'Ảnh hưởng giao hàng',
      path: '/internal/delivery',
      isActive: location.pathname.includes('/delivery')
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
                  item.isActive ? 'bg-dark text-white' : 'text-dark'
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

export default InternalSidebar;
