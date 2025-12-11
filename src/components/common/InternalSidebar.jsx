import React from 'react';
import { Nav } from 'react-bootstrap';
import { FaTachometerAlt, FaListAlt, FaFileSignature, FaProjectDiagram, FaUsers, FaUserFriends, FaPlusSquare, FaCog, FaWarehouse, FaExclamationTriangle } from 'react-icons/fa';
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
    } else if (roleUpper.includes('QA') || roleUpper.includes('QUALITY')) {
      // QA / Quality Assurance
      return 'qa';
    } else if (
      roleUpper.includes('PRODUCT_PROCESS_LEADER') ||
      roleUpper.includes('PRODUCT PROCESS LEADER') ||
      roleUpper.includes('PROCESS_LEADER') ||
      roleUpper.includes('PROCESS LEADER') ||
      roleUpper.includes('PRODUCTION_LEADER')
    ) {
      // Product Process Leader - leader công đoạn
      return 'leader';
    } else if (roleUpper.includes('PRODUCTION') && roleUpper.includes('MANAGER')) {
      // Production Manager
      return 'production';
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
      // { icon: FaTachometerAlt, label: 'Tổng quan', path: '/director/dashboard' }, // Temporarily hidden
      { icon: FaListAlt, label: 'Quản lý yêu cầu báo giá', path: '/director/rfqs' },
      { icon: FaFileSignature, label: 'Duyệt Hợp Đồng', path: '/director/contract-approval' },
      { icon: FaProjectDiagram, label: 'Duyệt Kế Hoạch Sản Xuất', path: '/director/production-plan-approvals' },
    ],
    sales: [
      { icon: FaListAlt, label: 'Yêu cầu báo giá', path: '/sales/rfqs' },
      { icon: FaPlusSquare, label: 'Tạo yêu cầu báo giá', path: '/sales/create-rfq' },
      { icon: FaFileSignature, label: 'Báo giá', path: '/sales/quotations' },
      { icon: FaFileSignature, label: 'Đơn hàng', path: '/sales/contracts' },
    ],
    planning: [
      { icon: FaListAlt, label: 'Yêu cầu báo giá cần xử lý', path: '/planning/rfqs' },
      { icon: FaProjectDiagram, label: 'Kế hoạch sản xuất', path: '/planning/lots' },
    ],
    // Production Manager
    production: [
      // { icon: FaTachometerAlt, label: 'Tổng quan', path: '/production/dashboard' }, // Temporarily hidden
      { icon: FaListAlt, label: 'Đơn hàng sản xuất', path: '/production/orders' },
      { icon: FaFileSignature, label: 'Yêu cầu cấp sợi', path: '/production/fiber-requests' },
      { icon: FaProjectDiagram, label: 'Sản xuất bổ sung', path: '/production/rework-orders' },
      { icon: FaWarehouse, label: 'Nhập kho nguyên liệu', path: '/production/material-stock' },
    ],
    // Product Process Leader
    leader: [
      { icon: FaListAlt, label: 'Đơn hàng của tôi', path: '/leader/orders' },
      { icon: FaExclamationTriangle, label: 'Danh sách lỗi', path: '/leader/defects' },
    ],
    // QA
    qa: [
      { icon: FaListAlt, label: 'Đơn hàng cần kiểm tra', path: '/qa/orders' },
    ],
    technical: [
      { icon: FaExclamationTriangle, label: 'Quản lý lỗi', path: '/technical/defects' },
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
            const isExact = location.pathname === item.path;

            return (
              <Nav.Link
                key={index}
                active={isActive}
                className="sidebar-item d-flex align-items-center py-2 px-3 mb-1 rounded"
                onClick={(e) => {
                  e.preventDefault();
                  if (!isExact) {
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

export default InternalSidebar;
