import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { executionService } from '../../api/executionService';
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
            progress: leaderStage.progressPercent || 0,
            isRework: leaderStage.isRework,
            defectId: leaderStage.defectId,
            defectDescription: leaderStage.defectDescription,
            defectSeverity: leaderStage.defectSeverity
          } : null,
          qrToken: data.qrToken, // Map QR token from backend
          stages: data.stages ? data.stages.map(s => ({
            id: s.id,
            name: s.stageName || getStageTypeName(s.stageType) || s.stageType, // Use stageName from backend if available
            stageType: s.stageType,
            assignee: s.assigneeName || s.assignedLeader?.fullName || 'Chưa phân công',
            status: s.status || s.executionStatus, // Use simple status or specific execution status
            statusLabel: s.statusLabel || getStatusLabel(s.status || s.executionStatus),
            progress: s.progressPercent || 0,
            isRework: s.isRework,
            executionStatus: s.executionStatus
          })) : []
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

            {/* Defect Info Card for Rework */}
            {order.stage && order.stage.isRework && order.stage.defectId && (
              <Card className="shadow-sm mb-3 border-danger">
                <Card.Header className="bg-danger text-white">
                  <strong>Thông tin lỗi cần sửa (Rework)</strong>
                </Card.Header>
                <Card.Body>
                  <div className="row">
                    <div className="col-md-12">
                      <p><strong>Mô tả lỗi:</strong> {order.stage.defectDescription}</p>
                      <p><strong>Mức độ:</strong> {order.stage.defectSeverity}</p>
                      <div className="alert alert-warning mb-0">
                        <small>Vui lòng thực hiện sửa lỗi theo yêu cầu của bộ phận kỹ thuật.</small>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

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
                    {order.stages && order.stages.length > 0 ? (
                      order.stages.map((stage) => (
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
                            {(() => {
                              // Use specific stage status for button logic
                              const buttonConfig = getButtonForStage(stage.status, 'leader');
                              const orderLocked = order.orderStatus === 'WAITING_PRODUCTION' || order.orderStatus === 'PENDING_APPROVAL';
                              // Disable if PENDING, Locked, or QC_FAILED (waiting for Tech) - specific to this stage
                              const isQcFailed = stage.status === 'QC_FAILED';
                              const isPending = stage.status === 'PENDING';
                              const isReworkStage = stage.isRework || stage.executionStatus === 'WAITING_REWORK' || stage.executionStatus === 'REWORK_IN_PROGRESS';
                              // Also disable if NOT assigned to current user (view only)
                              // We need to check if this stage is assigned to the current user.
                              // Since we don't have easy access to userId here inside the map without prop drilling or context,
                              // we rely on the backend filtering or we might need to check stage.assigneeId if available.
                              // However, for now, let's assume we can see actions for all, and "disabled" might handle permissions?
                              // Actually, getLeaderOrderDetail returns stages. 
                              // Use simplistic approach: if buttonConfig returns start/update, imply permission.
                              // BUT, we should probably only enable "Start/Update" if it's assigned to *this* leader.
                              // The user request says "Leader... ấn bắt đầu thì sẽ hiện thêm danh sách các công đoạn...".
                              // It implies they want visibility. Maybe they can only ACT on their own stages.
                              const isDisabled = isPending || orderLocked || isQcFailed;

                              // HIDE BUTTON if disabled (User Request)
                              if (isDisabled) {
                                return <span className="text-muted small">Chưa đến lượt</span>;
                              }

                              const goProgress = () => {
                                navigate(`/leader/orders/${orderId}/progress`, {
                                  state: {
                                    stageId: stage.id,
                                    defectId: stage.defectId,
                                    severity: stage.defectSeverity
                                  }
                                });
                              };

                              const handleAction = async () => {
                                if (buttonConfig.action === 'start') {
                                  setLoading(true);
                                  try {
                                    // Rework flow: use startRework (auto pre-emption) and skip blocking check
                                    if (isReworkStage) {
                                      // If already in progress, just view detail
                                      if (stage.executionStatus === 'REWORK_IN_PROGRESS') {
                                        goProgress();
                                        return;
                                      }
                                      await executionService.startRework(stage.id, userId);
                                      toast.success('Đã bắt đầu sửa lỗi');
                                      goProgress();
                                      return;
                                    }

                                    // Normal flow: Check if stage is blocked before starting
                                    const blockCheck = await executionService.checkCanStart(stage.id);
                                    if (blockCheck && blockCheck.canStart === false) {
                                      toast.error(blockCheck.message || 'Công đoạn đang bị chiếm bởi lô khác');
                                      return;
                                    }
                                    await productionService.startStageRolling(stage.id, userId);
                                    toast.success('Đã bắt đầu công đoạn');
                                    goProgress();
                                  } catch (error) {
                                    console.error('Error starting stage:', error);
                                    const msg = error.response?.data?.message || error.message || 'Không thể bắt đầu công đoạn';
                                    if (msg.includes('BLOCKING')) {
                                      toast.error(msg.replace('java.lang.RuntimeException: BLOCKING: ', ''));
                                    } else {
                                      toast.error(msg);
                                    }
                                    } finally {
                                      setLoading(false);
                                  }
                                } else {
                                  goProgress();
                                }
                              };

                              if (buttonConfig.action === 'start' || buttonConfig.action === 'update') {
                                return (
                                  <Button
                                    size="sm"
                                    variant={buttonConfig.variant}
                                    onClick={handleAction}
                                  >
                                    {buttonConfig.text}
                                  </Button>
                                );
                              }
                              return (
                                <Button
                                  size="sm"
                                  variant={buttonConfig.variant}
                                  onClick={() => navigate(`/leader/orders/${orderId}/progress`)}
                                >
                                  {buttonConfig.text}
                                </Button>
                              );
                            })()}
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
          </Container>
        </div>
      </div>
    </div >
  );
};

export default LeaderOrderDetail;
