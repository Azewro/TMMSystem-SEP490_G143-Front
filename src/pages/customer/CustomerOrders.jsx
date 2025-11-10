import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { contractService } from '../../api/contractService';
import { useAuth } from '../../context/AuthContext';

const statusMap = {
  PENDING: { label: 'Chờ xử lý', variant: 'warning' },
  UPLOADED_SIGNED: { label: 'Đã tải lên hợp đồng', variant: 'info' },
  DIRECTOR_APPROVED: { label: 'Giám đốc đã duyệt', variant: 'success' },
  DIRECTOR_REJECTED: { label: 'Giám đốc từ chối', variant: 'danger' },
  COMPLETED: { label: 'Hoàn thành', variant: 'primary' },
};

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  try { return new Date(iso).toLocaleDateString('vi-VN'); } catch { return iso; }
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

const CustomerOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.customerId) {
        setError('Không tìm thấy thông tin khách hàng.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const allContracts = await contractService.getAllContracts();
        // Filter contracts for the current customer
        const customerOrders = allContracts.filter(
          (contract) => contract.customerId === parseInt(user.customerId, 10)
        );
        const sortedOrders = customerOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
      } catch (e) {
        setError(e.message || 'Không thể tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <h4 className="mb-3">Danh sách đơn hàng</h4>

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Mã Đơn Hàng</th>
                      <th>Ngày Tạo</th>
                      <th>Ngày Giao Dự Kiến</th>
                      <th>Trạng Thái</th>
                      <th>Tổng Tiền</th>
                      <th className="text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" className="text-center py-5"><Spinner animation="border" /></td></tr>
                    ) : error ? (
                      <tr><td colSpan="6" className="text-center py-4"><Alert variant="danger">{error}</Alert></td></tr>
                    ) : orders.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-4 text-muted">Bạn chưa có đơn hàng nào.</td></tr>
                    ) : (
                      orders.map((order) => {
                        const badge = statusMap[order.status] || { label: order.status || 'Không xác định', variant: 'secondary' };
                        return (
                          <tr key={order.id}>
                            <td className="fw-semibold">{order.contractNumber || `HD-${order.id}`}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>{formatDate(order.deliveryDate)}</td>
                            <td><Badge bg={badge.variant}>{badge.label}</Badge></td>
                            <td>{formatCurrency(order.totalAmount)}</td>
                            <td className="text-center">
                              <Button size="sm" variant="outline-primary" onClick={() => navigate(`/customer/orders/${order.id}`)}>
                                <FaEye className="me-1" /> Xem
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrders;
