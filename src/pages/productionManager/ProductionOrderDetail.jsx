import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { orderService } from '../../api/orderService';
import { getStatusLabel, getStageTypeName, getButtonForStage, getStatusVariant } from '../../utils/statusMapper';
import toast from 'react-hot-toast';

const ProductionOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      // Fetch order detail directly (backend enrichProductionOrderDto returns stages)
      const data = await orderService.getOrderById(orderId);

      // Map stages with proper Vietnamese names and status labels
      const stages = (data.stages || []).map(s => ({
          id: s.id,
          code: s.stageType,
        name: getStageTypeName(s.stageType) || s.stageType,
        assignee: s.assignedLeader?.fullName || 
                  s.assigneeName || 
                  (s.stageType === 'DYEING' || s.stageType === 'NHUOM' ? 'Production Manager' : 'Chưa phân công'),
        status: s.executionStatus || s.status,
        statusLabel: getStatusLabel(s.executionStatus || s.status),
          progress: s.progressPercent || 0
      }));

      const mappedOrder = {
        id: data.id || orderId,
        lotCode: data.lotCode || data.poNumber || orderId,
        productName: data.productName || data.contract?.contractNumber || 'N/A',
        size: data.size || '-',
        quantity: data.totalQuantity || 0,
        expectedStartDate: data.plannedStartDate || data.expectedStartDate,
        expectedFinishDate: data.plannedEndDate || data.expectedFinishDate,
        status: data.executionStatus || data.status,
        statusLabel: data.statusLabel || getStatusLabel(data.executionStatus || data.status),
        stages: stages
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
    navigate(`/production/orders/${order.id}/stages/${stage.id}`);
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
                  <div className="col-md-4 d-flex gap-3 align-items-center">
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
                      <h5 className="mb-1">{order.lotCode}</h5>
                      <div className="text-muted small">Đơn hàng {order.productName}</div>
                    </div>
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
                        <Badge bg={getStatusVariant(order.statusLabel)} className="status-badge align-self-start">
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
                      order.stages.map((stage) => {
                        // For dyeing stage (NHUOM), PM can start/update progress
                        const isDyeingStage = stage.code === 'DYEING' || stage.code === 'NHUOM';
                        const buttonConfig = isDyeingStage ? getButtonForStage(stage.status, 'production') : 
                          { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
                        
                        // For dyeing stage, always show action button, but disabled when PENDING
                        const isDyeingPending = isDyeingStage && stage.status === 'PENDING';
                        const canStartDyeing = isDyeingStage && (stage.status === 'WAITING' || stage.status === 'READY' || stage.status === 'WAITING_REWORK');
                        const canUpdateDyeing = isDyeingStage && (stage.status === 'IN_PROGRESS' || stage.status === 'REWORK_IN_PROGRESS');
                        
                        return (
                      <tr key={stage.id}>
                        <td>{stage.name}</td>
                        <td>{stage.assignee}</td>
                        <td>{stage.progress ?? 0}%</td>
                        <td>
                              <Badge bg={getStatusVariant(stage.status)}>
                                {stage.statusLabel}
                              </Badge>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                                {/* Always show "Chi tiết" button */}
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  className="btn-pill-outline"
                                  onClick={() => handleViewStage(stage)}
                                >
                                  Chi tiết
                                </Button>
                                
                                {/* For dyeing stage, always show action button ("Bắt đầu" or "Cập nhật tiến độ"), but disabled when PENDING */}
                                {isDyeingStage && (
                                  <Button
                                    size="sm"
                                    variant={buttonConfig.variant}
                                    className="btn-pill-outline"
                                    onClick={() => handleViewStage(stage)}
                                    disabled={isDyeingPending}
                                    title={isDyeingPending ? 'Chưa đến lượt, chỉ có thể xem' : buttonConfig.text}
                                  >
                                    {buttonConfig.text}
                                  </Button>
                                )}
                          </div>
                        </td>
                      </tr>
                        );
                      })
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
    </div>
  );
};

export default ProductionOrderDetail;
