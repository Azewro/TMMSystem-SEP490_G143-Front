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

  const handleNavClick = (path) => {
    navigate(path);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="internal-sidebar bg-light shadow-sm" style={{ width: '250px', minHeight: 'calc(100vh - 70px)' }}>
      <div className="p-4">
        <h5 className="text-primary mb-3">Phòng Kế Hoạch</h5>
        <Nav className="flex-column">
          <Nav.Link 
            className={`sidebar-link py-3 ${isActiveRoute('/planning/quote-requests') ? 'active' : ''}`}
            onClick={() => handleNavClick('/planning/quote-requests')}
            style={{ cursor: 'pointer' }}
          >
            <FaClipboardList className="me-3" />
            Yêu cầu báo giá
          </Nav.Link>
          
          <Nav.Link 
            className={`sidebar-link py-3 ${isActiveRoute('/planning/orders') ? 'active' : ''}`}
            onClick={() => handleNavClick('/planning/orders')}
            style={{ cursor: 'pointer' }}
          >
            <FaBox className="me-3" />
            Đơn hàng
          </Nav.Link>
          
          <Nav.Link 
            className={`sidebar-link py-3 ${isActiveRoute('/planning/production-orders') ? 'active' : ''}`}
            onClick={() => handleNavClick('/planning/production-orders')}
            style={{ cursor: 'pointer' }}
          >
            <FaIndustry className="me-3" />
            Lệnh Sản Xuất
          </Nav.Link>
          
          <Nav.Link 
            className={`sidebar-link py-3 ${isActiveRoute('/planning/risk-reports') ? 'active' : ''}`}
            onClick={() => handleNavClick('/planning/risk-reports')}
            style={{ cursor: 'pointer' }}
          >
            <FaExclamationTriangle className="me-3" />
            Báo cáo rủi ro
          </Nav.Link>
          
          <Nav.Link 
            className={`sidebar-link py-3 ${isActiveRoute('/planning/delivery-impact') ? 'active' : ''}`}
            onClick={() => handleNavClick('/planning/delivery-impact')}
            style={{ cursor: 'pointer' }}
          >
            <FaTruck className="me-3" />
            Ảnh hưởng giao hàng
          </Nav.Link>
        </Nav>
      </div>
    </div>
  );
};

export default PlanningSidebar;
