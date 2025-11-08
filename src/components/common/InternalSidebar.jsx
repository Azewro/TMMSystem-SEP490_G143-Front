import React from 'react';
import { Nav } from 'react-bootstrap';
import { FaListAlt, FaFileSignature, FaProjectDiagram } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/Sidebar.css'; // Reuse the same dark theme

const InternalSidebar = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define all possible menu items
  const allMenuItems = {
    director: [
      { icon: FaListAlt, label: 'Quản lý RFQ', path: '/director/rfqs' },
      { icon: FaFileSignature, label: 'Duyệt Hợp Đồng', path: '/director/contract-approval' },
      { icon: FaProjectDiagram, label: 'Duyệt Kế Hoạch SX', path: '/director/plan-approval' },
    ],
    sales: [
      { icon: FaListAlt, label: 'RFQ của tôi', path: '/sales/rfqs' },
      { icon: FaFileSignature, label: 'Hợp đồng', path: '/sales/contracts' },
    ],
    planning: [
      { icon: FaListAlt, label: 'RFQ cần xử lý', path: '/planning/rfqs' },
      { icon: FaProjectDiagram, label: 'Kế hoạch sản xuất', path: '/planning/plans' },
    ],
  };

  // Select menu items based on user role
  const menuItems = allMenuItems[userRole] || [];

  return (
    <div className="sidebar sidebar-dark">
      <div className="sidebar-content p-3">
        <h5 className="text-white px-3 mb-3">Menu</h5>
        <Nav className="flex-column">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Nav.Link
                key={index}
                href="#"
                className={`sidebar-item d-flex align-items-center py-2 px-3 mb-1 rounded ${isActive ? 'active' : ''}`}
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