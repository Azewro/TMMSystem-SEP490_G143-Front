import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { orderService } from '../../api/orderService';
import { productionService } from '../../api/productionService';
import { getStatusLabel, getStatusVariant } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import { useWebSocketContext } from '../../context/WebSocketContext';

const ProductionReworkOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await orderService.getOrderById(orderId);
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
        // Silent fail - already logged to console
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // WebSocket subscription for real-time updates
  const { subscribe } = useWebSocketContext();
  useEffect(() => {
    const unsubscribe = subscribe('/topic/updates', (update) => {
      if (['PRODUCTION_ORDER', 'PRODUCTION_STAGE'].includes(update.entity)) {
        console.log('[ProductionReworkOrderDetail] Received update, refreshing...', update);
        orderService.getOrderById(orderId).then(setOrder).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, [subscribe, orderId]);

  // Window focus refetch - refresh when user switches back to tab
  useEffect(() => {
    const handleFocus = () => {
      console.log('[ProductionReworkOrderDetail] Window focused, refreshing...');
      orderService.getOrderById(orderId).then(setOrder).catch(console.error);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [orderId]);

  const handleViewStage = (stageId) => {
    navigate(`/production/stage-progress/${stageId}`);
  };

  const handleStartWork = async () => {
    try {
      setProcessing(true);
      await productionService.startWorkOrder(orderId);
      toast.success('Đã bắt đầu sản xuất bổ sung');
      // Refresh order
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error starting work:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi bắt đầu sản xuất');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center mt-5">
        <h4>Không tìm thấy đơn hàng</h4>
        <Button variant="link" onClick={() => navigate('/production/rework-orders')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const isWaiting = order.executionStatus === 'WAITING_PRODUCTION' || order.status === 'WAITING_PRODUCTION';

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="production" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={() => navigate('/production/rework-orders')}>
              &larr; Quay lại danh sách
            </Button>

            <Card className="shadow-sm mb-4">
              <Card.Body>
                <div className="row g-4 align-items-center">
                  <div className="col-lg-4 d-flex gap-3 align-items-center">
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        border: '1px dashed #ced4da',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        color: '#adb5bd',
                      }}
                    >
                      QR
                    </div>
                    <div>
                      <div className="text-muted small mb-1">Mã lô sản xuất</div>
                      <h5 className="mb-1">{order.poNumber}</h5>
                      <small className="text-muted">Đơn hàng {order.contract?.contractNumber}</small>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-2">
                      <div className="text-muted small">Tên sản phẩm</div>
                      <div className="fw-semibold">{order.productName || 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Số lượng</div>
                      <div className="fw-semibold">{order.totalQuantity?.toLocaleString('vi-VN')} sản phẩm</div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-2">
                      <div className="text-muted small">Ngày bắt đầu dự kiến</div>
                      <div className="fw-semibold">{order.plannedStartDate}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Ngày kết thúc dự kiến</div>
                      <div className="fw-semibold">{order.plannedEndDate}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="text-muted small mb-0">Trạng thái</div>
                      <Badge bg={getStatusVariant(order.executionStatus || order.status)}>
                        {getStatusLabel(order.executionStatus || order.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <strong>Các công đoạn sản xuất</strong>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Công đoạn</th>
                      <th>Người phụ trách</th>
                      <th>Tiến độ (%)</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.stages?.map((stage) => (
                      <tr key={stage.id}>
                        <td>{stage.stageType}</td>
                        <td>{stage.assignedLeader?.fullName || 'Chưa phân công'}</td>
                        <td>{stage.progressPercent ?? 0}%</td>
                        <td>
                          <Badge bg={getStatusVariant(stage.executionStatus || stage.status)}>
                            {getStatusLabel(stage.executionStatus || stage.status)}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button size="sm" variant="outline-secondary" onClick={() => handleViewStage(stage.id)}>
                            Chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {isWaiting && (
              <Card className="shadow-sm">
                <Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                  <div>
                    <strong>Bắt đầu sản xuất</strong>
                    <p className="text-muted mb-0">Kiểm tra thông tin và khởi động kế hoạch sản xuất bổ sung.</p>
                  </div>
                  <Button variant="dark" onClick={handleStartWork} disabled={processing}>
                    {processing ? <Spinner size="sm" animation="border" /> : 'Bắt đầu làm việc'}
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionReworkOrderDetail;

