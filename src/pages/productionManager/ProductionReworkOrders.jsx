import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Form, Tab, Tabs, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import api from '../../api/apiConfig';
import MaterialRequestApprovalModal from '../../components/production/MaterialRequestApprovalModal';
import { toast } from 'react-hot-toast';

const statusConfig = {
  WAITING_PRODUCTION: { label: 'Chờ sản xuất', variant: 'secondary' },
  IN_PROGRESS: { label: 'Đang sản xuất', variant: 'primary' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  PENDING: { label: 'Chờ xử lý', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
};

const ProductionReworkOrders = () => {
  const navigate = useNavigate();
  const [reworkOrders, setReworkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Rework Orders (Assuming we can filter by type or just fetch all and filter client side)
      // For now fetching all orders and filtering by "-REWORK" in poNumber
      const orderResponse = await api.get('/v1/production/manager/orders');
      const reworks = orderResponse.data.filter(o => o.poNumber && o.poNumber.includes('-REWORK'));
      setReworkOrders(reworks);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn bắt đầu đơn hàng bổ sung này?")) return;
    try {
      await api.post(`/v1/production/orders/${orderId}/start-supplementary`);
      toast.success("Đã bắt đầu đơn hàng bổ sung");
      fetchData();
    } catch (error) {
      console.error("Error starting order:", error);
      toast.error("Không thể bắt đầu đơn hàng");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="production" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <h4 className="mb-4">Quản lý Sản xuất Bổ sung</h4>

            <Card className="shadow-sm">
              <Card.Body>
                {loading ? <Spinner animation="border" /> : (
                  <Table hover responsive className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Mã lệnh</th>
                        <th>Sản phẩm</th>
                        <th>Số lượng</th>
                        <th>Ngày bắt đầu</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reworkOrders.length === 0 ? (
                        <tr><td colSpan="6" className="text-center">Không có lệnh bổ sung nào</td></tr>
                      ) : (
                        reworkOrders.map(order => (
                          <tr key={order.id}>
                            <td>{order.poNumber}</td>
                            <td>{order.productName || 'N/A'}</td>
                            <td>{order.totalQuantity?.toLocaleString('vi-VN')}</td>
                            <td>{order.plannedStartDate}</td>
                            <td>
                              <Badge bg={statusConfig[order.executionStatus]?.variant || 'secondary'}>
                                {statusConfig[order.executionStatus]?.label || order.executionStatus}
                              </Badge>
                            </td>
                            <td>
                              <Button size="sm" variant="outline-dark" onClick={() => navigate(`/production/orders/${order.id}`)} className="me-2">
                                Chi tiết
                              </Button>
                              {order.executionStatus === 'WAITING_PRODUCTION' && (
                                <Button size="sm" variant="success" onClick={() => handleStart(order.id)}>
                                  Bắt đầu
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionReworkOrders;

