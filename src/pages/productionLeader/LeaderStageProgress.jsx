import React, { useMemo, useState, useEffect } from 'react';
import { Container, Card, Button, ProgressBar, Table, Form, Badge, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { executionService } from '../../api/executionService';
import toast from 'react-hot-toast';

const LeaderStageProgress = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  // Get userId from sessionStorage (set during login in authService.internalLogin)
  // Fallback to localStorage for backward compatibility
  const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');

  const [order, setOrder] = useState(null);
  const [stage, setStage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [inputProgress, setInputProgress] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const formatTimestamp = (value) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString('vi-VN');
    } catch {
      return value;
    }
  };

  const mapTrackingAction = (action) => {
    switch (action) {
      case 'START':
        return 'Bắt đầu';
      case 'UPDATE_PROGRESS':
        return 'Cập nhật tiến độ';
      case 'COMPLETE':
        return 'Hoàn thành';
      case 'RESUME':
        return 'Tiếp tục';
      case 'PAUSE':
        return 'Tạm dừng';
      default:
        return action || 'Không xác định';
    }
  };

  const formatTrackingProgress = (tracking) => {
    if (tracking?.quantityCompleted === null || tracking?.quantityCompleted === undefined) {
      return '-';
    }
    return `${tracking.quantityCompleted}%`;
  };

  const loadStageHistory = async (stageId) => {
    if (!stageId) {
      setHistory([]);
      return;
    }
    try {
      setHistoryLoading(true);
      const trackings = await executionService.getStageTrackings(stageId);
      const mapped = (trackings || []).map((tracking) => ({
        id: tracking.id,
        action: mapTrackingAction(tracking.action),
        progress: formatTrackingProgress(tracking),
        timestamp: formatTimestamp(tracking.timestamp),
        operator: tracking.operatorName || 'Không xác định',
        notes: tracking.notes || '',
      }));
      setHistory(mapped);
    } catch (error) {
      console.error('Error loading stage history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (orderId) {
          const data = await productionService.getLeaderOrderDetail(orderId, userId);
          setOrder(data);
          if (data.stages && data.stages.length > 0) {
            const currentStage = data.stages[0];
            setStage(currentStage);
            setCurrentProgress(currentStage.progressPercent || 0);
            await loadStageHistory(currentStage.id);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Không thể tải thông tin công đoạn');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId, userId, refreshKey]);

  useEffect(() => {
    if (stage?.id) {
      loadStageHistory(stage.id);
    }
  }, [stage?.id]);

  const handleBack = () => {
    navigate('/leader/orders');
  };

  const handleStartStage = async () => {
    if (!stage) return;
    try {
      await executionService.startStage(stage.id, userId);
      toast.success('Đã bắt đầu công đoạn');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(error.message || 'Lỗi khi bắt đầu công đoạn');
    }
  };

  const handleUpdateProgress = async () => {
    if (!stage) return;
    const target = Number(inputProgress);
    if (Number.isNaN(target) || target < 0 || target > 100) {
      toast.error('Vui lòng nhập tiến độ từ 0 đến 100');
      return;
    }
    if (target <= currentProgress) {
      toast.error('Tiến độ mới phải lớn hơn tiến độ hiện tại');
      return;
    }

    try {
      await executionService.updateProgress(stage.id, userId, target);
      toast.success('Cập nhật tiến độ thành công');
      setInputProgress('');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(error.message || 'Lỗi khi cập nhật tiến độ');
    }
  };

  const statusConfig = useMemo(() => {
    if (!stage) return { label: '...', variant: 'secondary' };
    const status = stage.executionStatus || stage.status;
    switch (status) {
      case 'PENDING': return { label: 'Đợi', variant: 'secondary' };
      case 'WAITING': return { label: 'Chờ làm', variant: 'primary' };
      case 'READY': return { label: 'Sẵn sàng', variant: 'primary' };
      case 'IN_PROGRESS': return { label: 'Đang làm', variant: 'info' };
      case 'WAITING_QC': return { label: 'Chờ kiểm tra', variant: 'warning' };
      case 'QC_PASSED': return { label: 'Đạt QC', variant: 'success' };
      case 'QC_FAILED': return { label: 'Lỗi QC', variant: 'danger' };
      case 'COMPLETED': return { label: 'Hoàn thành', variant: 'success' };
      default: return { label: status, variant: 'secondary' };
    }
  }, [stage]);

  // Check if stage is pending (chưa đến lượt)
  const orderStatus = order?.executionStatus || order?.status;
  const orderLocked = orderStatus === 'WAITING_PRODUCTION' || orderStatus === 'PENDING_APPROVAL' || orderStatus === 'DRAFT';
  const isPending = stage && (stage.executionStatus === 'PENDING' || stage.status === 'PENDING');
  const isStageInProgress = stage && (
    stage.executionStatus === 'IN_PROGRESS' ||
    stage.executionStatus === 'REWORK_IN_PROGRESS' ||
    stage.status === 'IN_PROGRESS' ||
    stage.status === 'REWORK_IN_PROGRESS'
  );

  // canStart: WAITING, READY (sẵn sàng sản xuất) hoặc WAITING_REWORK (chờ sửa), chưa IN_PROGRESS và tiến độ < 100%
  const canStart = stage && !isStageInProgress && stage.progressPercent < 100 && !orderLocked && (
    stage.executionStatus === 'WAITING' ||
    stage.executionStatus === 'READY' ||
    stage.executionStatus === 'WAITING_REWORK' ||
    stage.status === 'WAITING' ||
    stage.status === 'READY' ||
    stage.status === 'WAITING_REWORK'
  );
  // canUpdate: IN_PROGRESS (đang làm) hoặc REWORK_IN_PROGRESS (đang sửa)
  const canUpdate = stage && !orderLocked && (
    stage.executionStatus === 'IN_PROGRESS' ||
    stage.executionStatus === 'REWORK_IN_PROGRESS' ||
    stage.status === 'IN_PROGRESS' ||
    stage.status === 'REWORK_IN_PROGRESS'
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!order || !stage) {
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="leader" />
          <Container fluid className="p-4">
            <Button variant="link" onClick={handleBack}>&larr; Quay lại</Button>
            <div className="alert alert-warning mt-3">Không tìm thấy thông tin công đoạn cho đơn hàng này.</div>
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
                  <div className="col-lg-4 d-flex gap-3 align-items-center">
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
                      <h5 className="mb-1">{order.lotCode || order.poNumber}</h5>
                      <small className="text-muted">
                        Sản phẩm: {order.productName || order.contract?.contractNumber || 'N/A'}
                      </small>
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="mb-2">
                      <div className="text-muted small">Tổng số lượng</div>
                      <div className="fw-semibold">{order.totalQuantity?.toLocaleString('vi-VN')}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Ngày bắt đầu KH</div>
                      <div className="fw-semibold">{order.plannedStartDate}</div>
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="text-muted small mb-1">Người phụ trách</div>
                    <div className="fw-semibold">
                      {stage.assignedLeader?.fullName ||
                        stage.assignedLeader?.name ||
                        stage.assigneeName ||
                        'Chưa phân công'}
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="text-muted small mb-1">Trạng thái công đoạn</div>
                    <Badge bg={statusConfig.variant} className="status-badge">
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="row g-3">
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="text-muted small mb-1">Công đoạn</div>
                    <Form.Control readOnly value={stage.stageType} className="fw-semibold" style={{ backgroundColor: '#f8f9fb' }} />
                  </div>
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="text-muted small mb-1">Bắt đầu thực tế</div>
                    <Form.Control readOnly value={stage.startAt ? new Date(stage.startAt).toLocaleString('vi-VN') : 'Chưa bắt đầu'} className="fw-semibold" style={{ backgroundColor: '#f8f9fb' }} />
                  </div>
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="text-muted small mb-1">Kết thúc thực tế</div>
                    <Form.Control readOnly value={stage.completeAt ? new Date(stage.completeAt).toLocaleString('vi-VN') : 'Chưa kết thúc'} className="fw-semibold" style={{ backgroundColor: '#f8f9fb' }} />
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="mb-3">
                  <div className="text-muted mb-1">Tiến độ hiện tại</div>
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div className="h5 mb-0">{currentProgress}%</div>
                  </div>
                  <ProgressBar
                    now={currentProgress}
                    label={`${currentProgress}%`}
                    style={{ height: 18, borderRadius: 999 }}
                    variant={currentProgress === 100 ? 'success' : 'primary'}
                  />
                </div>
              </Card.Body>
            </Card>

            {/* Action Area */}
            {orderLocked && (
              <Card className="shadow-sm mb-3" style={{ borderColor: '#ffe1a8', backgroundColor: '#fff7e6' }}>
                <Card.Body>
                  <div className="alert alert-warning mb-0">
                    Quản lý sản xuất chưa ấn “Bắt đầu lệnh làm việc”. Bạn chỉ có thể xem thông tin cho đến khi lệnh được mở.
                  </div>
                </Card.Body>
              </Card>
            )}

            {isPending && !orderLocked && (
              <Card className="shadow-sm mb-3" style={{ borderColor: '#e9ecef', backgroundColor: '#f8f9fa' }}>
                <Card.Body>
                  <div className="alert alert-info mb-0">
                    <strong>Chưa đến lượt:</strong> Công đoạn này đang ở trạng thái "đợi". Bạn chỉ có thể xem thông tin, không thể bắt đầu hoặc cập nhật tiến độ cho đến khi đến lượt của bạn.
                  </div>
                </Card.Body>
              </Card>
            )}

            {canStart && !isPending && !orderLocked && (
              <Card className="shadow-sm mb-3" style={{ borderColor: '#e7f1ff', backgroundColor: '#f5f9ff' }}>
                <Card.Body className="d-flex justify-content-center">
                  <Button variant="primary" size="lg" onClick={handleStartStage}>
                    Bắt đầu công đoạn
                  </Button>
                </Card.Body>
              </Card>
            )}

            {canUpdate && !isPending && !orderLocked && (
              <Card className="shadow-sm mb-3" style={{ borderColor: '#e7f1ff', backgroundColor: '#f5f9ff' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <strong>Cập nhật tiến độ</strong>
                    <small className="text-muted">Nhập tiến độ từ 0 đến 100</small>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <Form.Control
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Tiến độ (%)"
                      value={inputProgress}
                      onChange={(e) => setInputProgress(e.target.value)}
                      style={{ maxWidth: 200 }}
                      disabled={isPending}
                    />
                    <Button variant="dark" onClick={handleUpdateProgress} disabled={isPending}>
                      Cập nhật
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            <Card className="shadow-sm mb-3">
              <Card.Body className="p-0">
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <strong>Lịch sử cập nhật tiến độ</strong>
                  {historyLoading && <small className="text-muted">Đang tải...</small>}
                </div>
                {historyLoading ? (
                  <div className="p-4 text-center text-muted">Đang tải lịch sử...</div>
                ) : history.length === 0 ? (
                  <div className="p-4 text-center text-muted">Chưa có lịch sử cập nhật</div>
                ) : (
                  <Table responsive className="mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Hành động</th>
                        <th>Tiến độ</th>
                        <th>Thời gian</th>
                        <th>Người cập nhật</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item) => (
                        <tr key={item.id}>
                          <td>{item.action}</td>
                          <td>{item.progress}</td>
                          <td>{item.timestamp}</td>
                          <td>{item.operator}</td>
                          <td>{item.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>

            {/* QC Results (Simplified) */}
            {(stage.executionStatus === 'QC_PASSED' || stage.executionStatus === 'QC_FAILED') && (
              <Card className="shadow-sm mt-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <strong>Kết quả kiểm tra gần nhất</strong>
                    <Badge bg={stage.executionStatus === 'QC_PASSED' ? 'success' : 'danger'}>
                      {stage.executionStatus === 'QC_PASSED' ? 'Đạt' : 'Không đạt'}
                    </Badge>
                  </div>
                  {stage.notes && (
                    <div className="alert alert-light border">
                      <strong>Ghi chú:</strong> {stage.notes}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

          </Container>
        </div>
      </div>
    </div>
  );
};

export default LeaderStageProgress;
