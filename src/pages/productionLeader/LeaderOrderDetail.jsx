import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { getStatusLabel, getStageTypeName, getButtonForStage, getStatusVariant } from '../../utils/statusMapper';
import toast from 'react-hot-toast';

const LeaderOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  // Get userId from sessionStorage (set during login in authService.internalLogin)
  // Fallback to localStorage for backward compatibility
  const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await productionService.getLeaderOrderDetail(orderId, userId);

        // Find the stage assigned to this leader
        const leaderStage = data.stages && data.stages.length > 0 ? data.stages[0] : null;

        // Map backend data to match UI structure
        const mappedOrder = {
          id: data.id || orderId,
          lotCode: data.lotCode || data.poNumber || orderId,
          productName: data.productName || data.contract?.contractNumber || 'N/A',
          size: data.size || '-',
          quantity: data.totalQuantity || 0,
          expectedDeliveryDate: data.plannedStartDate || data.expectedDeliveryDate,
          expectedFinishDate: data.plannedEndDate || data.expectedFinishDate,
          customerName: data.contract?.customer?.name || 'N/A',
          status: data.executionStatus || data.status,
          orderStatus: data.executionStatus || data.status,
          statusLabel: getStatusLabel(data.executionStatus || data.status),
          stage: leaderStage ? {
            id: leaderStage.id,
            name: getStageTypeName(leaderStage.stageType) || leaderStage.stageType,
            assignee: leaderStage.assignedLeader?.fullName ||
              leaderStage.assigneeName ||
              'Chưa phân công',
            status: leaderStage.executionStatus || leaderStage.status,
            statusLabel: getStatusLabel(leaderStage.executionStatus || leaderStage.status),
            progress: leaderStage.progressPercent || 0
          } : null,
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
    fetchOrder();
  }, [orderId, userId]);

  const handleBack = () => {
    navigate('/leader/orders');
  };

  const handleViewStage = () => {
    navigate(`/leader/orders/${orderId}/progress`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!order || !order.stage) {
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="leader" />
          <Container fluid className="p-4">
            <Button variant="link" onClick={handleBack}>&larr; Quay lại</Button>
            <div className="alert alert-warning mt-3">Không tìm thấy đơn hàng</div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="leader" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={handleBack}>
              &larr; Quay lại danh sách
            </Button>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="row g-4 align-items-center">
                  <div className="col-md-4 d-flex gap-3 align-items-center">
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
                      <div className="text-muted small mb-1">Mã lô</div>
                      <h5 className="mb-1">{order.lotCode || order.id}</h5>
                      <div className="text-muted small">Kích thước {order.size}</div>
                    </div>
                  </div>
                  <div className="col-md-8">
                    <div className="row g-2 order-info-grid">
                      <div className="col-sm-6">
                        <div className="text-muted small">Tên sản phẩm</div>
                        <div className="fw-semibold">{order.productName}</div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-muted small">Số lượng</div>
                        <div>{order.quantity.toLocaleString('vi-VN')} sản phẩm</div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-muted small">Ngày bắt đầu dự kiến</div>
                        <div>{order.expectedDeliveryDate}</div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-muted small">Ngày kết thúc dự kiến</div>
                        <div>{order.expectedFinishDate}</div>
                      </div>
                      <div className="col-sm-6 d-flex flex-column">
                        <div className="text-muted small mb-1">Trạng thái</div>
                        <Badge bg={getStatusVariant(order.status)} className="status-badge align-self-start">
                          {order.statusLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <div className="p-3 border-bottom">
                  <strong>Công đoạn của bạn</strong>
                </div>
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Công đoạn</th>
                      <th>Người phụ trách</th>
                      <th>Tiến độ (%)</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 120 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.stage ? (
                      <tr>
                        <td>{order.stage.name}</td>
                        <td>{order.stage.assignee}</td>
                        <td>{order.stage.progress ?? 0}%</td>
                        <td>
                          <Badge bg={getStatusVariant(order.stage.status)}>
                            {order.stage.statusLabel}
                          </Badge>
                        </td>
                        <td className="text-end">
                          {(() => {
                            const buttonConfig = getButtonForStage(order.stage.status, 'leader');
                            const orderLocked = order.orderStatus === 'WAITING_PRODUCTION' || order.orderStatus === 'PENDING_APPROVAL';
                            const isDisabled = order.stage.status === 'PENDING' || orderLocked; // Disable nếu chưa đến lượt hoặc chưa start
                            if (buttonConfig.action === 'start' || buttonConfig.action === 'update') {
                              return (
                                <Button
                                  size="sm"
                                  variant={buttonConfig.variant}
                                  onClick={handleViewStage}
                                  disabled={isDisabled}
                                  title={
                                    orderLocked
                                      ? 'PM chưa bắt đầu lệnh làm việc'
                                      : (order.stage.status === 'PENDING' ? 'Chưa đến lượt, chỉ có thể xem' : '')
                                  }
                                >
                                  {buttonConfig.text}
                                </Button>
                              );
                            }
                            return (
                              <Button
                                size="sm"
                                variant={buttonConfig.variant}
                                onClick={handleViewStage}
                              >
                                {buttonConfig.text}
                              </Button>
                            );
                          })()}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          Chưa có công đoạn được phân công
                        </td>
                      </tr>
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

export default LeaderOrderDetail;
