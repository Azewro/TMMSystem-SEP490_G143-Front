import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { orderService } from '../../api/orderService';
import { getStatusLabel, getStageTypeName, getStatusVariant, getProductionOrderStatusFromStages, getPMStageStatusLabel } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import { useWebSocketContext } from '../../context/WebSocketContext';

const ProductionOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // WebSocket subscription for real-time updates
  const { subscribe } = useWebSocketContext();
  useEffect(() => {
    const unsubscribe = subscribe('/topic/updates', (update) => {
      if (['PRODUCTION_ORDER', 'PRODUCTION_STAGE'].includes(update.entity)) {
        console.log('[ProductionOrderDetail] Received update, refreshing...', update);
        fetchOrder();
      }
    });
    return () => unsubscribe();
  }, [subscribe]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      // Fetch order detail directly (backend enrichProductionOrderDto returns stages)
      const data = await orderService.getOrderById(orderId);

      // Map stages with proper Vietnamese names and status labels using new function
      const stages = (data.stages || []).map(s => {
        const isDyeingStage = s.stageType === 'DYEING' || s.stageType === 'NHUOM';
        const stageStatus = getPMStageStatusLabel(s.status === 'PAUSED' ? 'PAUSED' : (s.executionStatus || s.status), isDyeingStage);

        return {
          id: s.id,
          code: s.stageType,
          name: getStageTypeName(s.stageType) || s.stageType,
          assignee: s.assignedLeader?.fullName ||
            s.assigneeName ||
            'Chưa phân công',
          status: s.executionStatus || s.status,
          statusLabel: stageStatus.label,
          statusVariant: stageStatus.variant,
          // Always include at least Chi tiết button
          buttons: stageStatus.buttons,
          progress: s.progressPercent || 0,
          isDyeingStage: isDyeingStage
        };
      });

      // Use getProductionOrderStatusFromStages for order-level status
      const orderStatus = getProductionOrderStatusFromStages(data);

      const mappedOrder = {
        id: data.id || orderId,
        lotCode: data.lotCode || data.poNumber || orderId,
        productName: data.productName || data.contract?.contractNumber || 'N/A',
        size: data.size || '-',
        quantity: data.totalQuantity || 0,
        expectedStartDate: data.plannedStartDate || data.expectedStartDate,
        expectedFinishDate: data.plannedEndDate || data.expectedFinishDate,
        status: data.executionStatus || data.status,
        statusLabel: orderStatus.label,
        statusVariant: orderStatus.variant,
        stages: stages,
        qrToken: data.qrToken // Map QR token from backend
      };
      setOrder(mappedOrder);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/production/orders');
  };

  const handleViewStage = (stage) => {
    navigate(`/production/stage-progress/${stage.id}`);
  };

  const handleStartProduction = async () => {
    try {
      setLoading(true);
      await productionService.startWorkOrder(orderId);
      toast.success('Đã bắt đầu lệnh làm việc');
      // Refresh order data immediately and again after a short delay to ensure backend has updated
      await fetchOrder();
      setTimeout(async () => {
        await fetchOrder();
      }, 1000);
    } catch (error) {
      console.error('Error starting production:', error);
      toast.error(error.response?.data?.message || 'Không thể bắt đầu lệnh làm việc');
      setLoading(false);
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
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="production" />
          <Container fluid className="p-4">
            <Button variant="link" onClick={handleBack}>&larr; Quay lại</Button>
            <Alert variant="warning" className="mt-3">Không tìm thấy đơn hàng</Alert>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="production" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <Button variant="link" className="btn-back-link mb-3" onClick={handleBack}>
              <span>&larr;</span>
              <span>Quay lại danh sách</span>
            </Button>

            {/* Thông tin đơn hàng */}
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="row g-4 align-items-center">
                  <div className="col-md-4">
                    <div className="d-flex gap-3 align-items-center">
                      <div
                        style={{
                          width: 150,
                          height: 150,
                          borderRadius: 12,
                          border: '1px dashed #ced4da',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          backgroundColor: '#fff'
                        }}
                      >
                        {order.qrToken ? (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/qa/scan/' + order.qrToken)}`}
                            alt="QR Code"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <span className="text-muted">No QR</span>
                        )}
                      </div>
                      <div>
                        <div className="text-muted small mb-1">Mã lô sản xuất</div>
                        <h5 className="mb-1">{order.lotCode}</h5>
                        <div className="text-muted small">Đơn hàng {order.productName}</div>
                      </div>
                    </div>
                    {/* Print QR Button */}
                    {order.qrToken && (
                      <Button
                        variant="outline-dark"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.print()}
                      >
                        🖨️ In mã QR
                      </Button>
                    )}
                  </div>
                  <div className="col-md-8">
                    <div className="row g-2 order-info-grid">
                      <div className="col-sm-6">
                        <div className="text-muted small">Tên sản phẩm</div>
                        <div className="fw-semibold">{order.productName}</div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-muted small">Ngày bắt đầu dự kiến</div>
                        <div>{order.expectedStartDate || 'N/A'}</div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-muted small">Kích thước</div>
                        <div>{order.size}</div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-muted small">Ngày kết thúc dự kiến</div>
                        <div>{order.expectedFinishDate || 'N/A'}</div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-muted small">Số lượng</div>
                        <div>{order.quantity.toLocaleString('vi-VN')} sản phẩm</div>
                      </div>
                      <div className="col-sm-6 d-flex flex-column">
                        <div className="text-muted small mb-1">Trạng thái</div>
                        <Badge bg={order.statusVariant} className="status-badge align-self-start">
                          {order.statusLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Bảng các công đoạn sản xuất */}
            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <div className="p-3 border-bottom">
                  <strong>Các công đoạn sản xuất</strong>
                </div>
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Công đoạn</th>
                      <th>Người phụ trách</th>
                      <th>Tiến độ (%)</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 160 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.stages && order.stages.length > 0 ? (
                      order.stages.map((stage) => (
                        <tr key={stage.id}>
                          <td>{stage.name}</td>
                          <td>{stage.assignee}</td>
                          <td>{stage.progress ?? 0}%</td>
                          <td>
                            <Badge bg={stage.statusVariant}>
                              {stage.statusLabel}
                            </Badge>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              {/* Render buttons dynamically based on getPMStageStatusLabel */}
                              {stage.buttons && stage.buttons.length > 0 ? (
                                stage.buttons.map((btn, idx) => (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    variant={btn.variant}
                                    className="btn-pill-outline"
                                    onClick={() => handleViewStage(stage)}
                                    disabled={btn.disabled}
                                  >
                                    {btn.text}
                                  </Button>
                                ))
                              ) : (
                                /* No buttons for PENDING status */
                                <span className="text-muted small">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          Chưa có công đoạn nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Only show start button if order hasn't been started yet */}
            {(order.status === 'WAITING_PRODUCTION' || order.status === 'CHO_SAN_XUAT' || order.statusLabel === 'Chờ sản xuất') && (
              <div className="d-flex justify-content-end mt-4">
                <Button
                  size="lg"
                  variant="dark"
                  className="px-4"
                  onClick={handleStartProduction}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Bắt đầu lệnh làm việc'}
                </Button>
              </div>
            )}
          </Container>
        </div>
      </div>

      {/* Hidden Printable QR Label - Only visible when printing */}
      {order && order.qrToken && (
        <div id="qr-print-label" className="qr-print-label">
          <div className="qr-print-content">
            <div className="qr-code-section">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/qa/scan/' + order.qrToken)}`}
                alt="QR Code"
                className="qr-code-img"
              />
            </div>
            <div className="info-section">
              <div className="lot-info">
                <span className="info-label">Mã lô sản xuất</span>
                <h2 className="lot-code">{order.lotCode}</h2>
                <span className="order-name">Đơn hàng {order.productName}</span>
              </div>
              <div className="product-info">
                <div className="info-item">
                  <span className="info-label">Tên sản phẩm</span>
                  <strong>{order.productName}</strong>
                </div>
                <div className="info-item">
                  <span className="info-label">Kích thước</span>
                  <span>{order.size}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Số lượng</span>
                  <span>{order.quantity?.toLocaleString('vi-VN')} sản phẩm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionOrderDetail;
