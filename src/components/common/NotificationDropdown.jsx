import React, { useState, useEffect, useCallback } from 'react';
import { Dropdown, Badge, Spinner, Button } from 'react-bootstrap';
import { FaBell, FaCheck, FaExclamationCircle, FaInfoCircle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { notificationService } from '../../api/notificationService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const NotificationDropdown = ({ userId: propUserId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from AuthContext
  
  // Lấy userId từ prop hoặc context
  const userId = propUserId || user?.id;

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(userId);
      // Sắp xếp theo thời gian mới nhất trước
      const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(sorted);
      setUnreadCount(sorted.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // toast.error('Không thể tải thông báo'); // Comment out to avoid spamming
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
        loadNotifications();
        // Auto refresh mỗi 30 giây
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }
  }, [userId, loadNotifications]);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      toast.error('Không thể đánh dấu đã đọc');
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    if (!userId) return;
    try {
      await notificationService.markAllAsRead(userId);
      await loadNotifications();
      toast.success('Đã đánh dấu tất cả đã đọc');
    } catch (error) {
      toast.error('Không thể đánh dấu tất cả đã đọc');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
        // Không cần load lại ngay, để user thấy sự thay đổi sau khi quay lại
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // Điều hướng dựa trên referenceType và referenceId
    if (notification.referenceType && notification.referenceId) {
      const role = user?.role; // Lấy vai trò từ context
      switch (notification.referenceType) {
        case 'RFQ':
          if (role === 'director') {
            navigate(`/director/rfqs`);
          } else if (role === 'sale') {
            navigate(`/sales/my-rfqs`);
          }
          // Thêm các role khác nếu cần
          break;
        case 'QUOTATION':
           if (role === 'customer') {
            navigate(`/customer/quotations/${notification.referenceId}`);
          } else {
            navigate(`/sales/quotes/${notification.referenceId}`);
          }
          break;
        case 'CONTRACT':
          if (role === 'director') {
            navigate(`/director/contract-approval`);
          } else if (role === 'customer') {
            navigate(`/customer/orders`);
          }
          break;
        case 'PRODUCTION_PLAN':
            if (role === 'director') {
                navigate(`/director/production-plan-approvals`);
            }
            break;
        default:
          // Không điều hướng nếu không có route tương ứng
          break;
      }
    }
    setShowDropdown(false); // Đóng dropdown sau khi click
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return <FaCheckCircle className="text-success" />;
      case 'WARNING':
        return <FaExclamationCircle className="text-warning" />;
      case 'ERROR':
        return <FaTimesCircle className="text-danger" />;
      default:
        return <FaInfoCircle className="text-info" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Dropdown show={showDropdown} onToggle={setShowDropdown}>
      <Dropdown.Toggle as="div" className="position-relative" style={{ cursor: 'pointer' }}>
        <FaBell size={20} />
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.7rem', minWidth: '18px' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        style={{
          minWidth: '350px',
          maxWidth: '400px',
          maxHeight: '500px',
          overflowY: 'auto',
        }}
        align="end"
      >
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <h6 className="mb-0">Thông báo</h6>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="p-0 text-decoration-none"
              onClick={handleMarkAllAsRead}
            >
              <FaCheck className="me-1" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <FaBell className="mb-2" style={{ fontSize: '2rem', opacity: 0.3 }} />
            <p className="mb-0">Không có thông báo</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-bottom ${!notification.read ? 'bg-light' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="d-flex align-items-start">
                  <div className="me-2 mt-1">{getTypeIcon(notification.type)}</div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>
                        {notification.title}
                      </h6>
                      {!notification.read && (
                        <Badge bg="primary" pill style={{ fontSize: '0.6rem' }}>
                          Mới
                        </Badge>
                      )}
                    </div>
                    <p className="mb-1 text-muted" style={{ fontSize: '0.85rem' }}>
                      {notification.message}
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">{formatTime(notification.createdAt)}</small>
                      {!notification.read && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Đánh dấu đã đọc"
                        >
                          <FaCheck size={12} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationDropdown;

