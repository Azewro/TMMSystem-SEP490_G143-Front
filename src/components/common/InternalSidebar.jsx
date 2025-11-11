import React from 'react';
import { Nav } from 'react-bootstrap';
import { FaListAlt, FaFileSignature, FaProjectDiagram, FaUsers, FaUserFriends, FaCog } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Sidebar.css'; // Reuse the same dark theme

const InternalSidebar = ({ userRole: propUserRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Map backend role to sidebar role format
  const mapRoleToSidebarFormat = (role) => {
    if (!role) return null;
    const roleUpper = role.toUpperCase();
    
    if (roleUpper === 'ADMIN' || roleUpper.includes('ADMIN')) {
      return 'admin';
    } else if (roleUpper.includes('DIRECTOR')) {
      return 'director';
    } else if (roleUpper.includes('PLANNING') || roleUpper === 'PLANNING_DEPARTMENT') {
      return 'planning';
    } else if (roleUpper.includes('SALE') || roleUpper === 'SALE_STAFF') {
      return 'sales';
    } else if (roleUpper.includes('TECHNICAL') || roleUpper === 'TECHNICAL_DEPARTMENT') {
      return 'technical';
    }
    return null;
  };

  // Get user role from prop or from auth context
  const userRole = propUserRole || mapRoleToSidebarFormat(user?.role);

  // Define all possible menu items
  const allMenuItems = {
    admin: [
      { icon: FaUsers, label: 'Quản lý tài khoản', path: '/admin/users' },
      { icon: FaUserFriends, label: 'Quản lý khách hàng', path: '/admin/customers' },
    ],
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
      { icon: FaListAlt, label: 'Đơn hàng đã gộp', path: '/planning/consolidated-orders' },
      { icon: FaProjectDiagram, label: 'Kế hoạch sản xuất', path: '/planning/plans' },
    ],
    technical: [
      { icon: FaCog, label: 'Quản lý máy', path: '/technical/machines' },
    ],
  };

  // Select menu items based on user role
  const menuItems = userRole ? (allMenuItems[userRole] || []) : [];

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
