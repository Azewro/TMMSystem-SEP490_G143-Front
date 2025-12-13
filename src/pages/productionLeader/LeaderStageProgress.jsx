import React, { useMemo, useState, useEffect } from 'react';
import { Container, Card, Button, ProgressBar, Table, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { executionService } from '../../api/executionService';
import toast from 'react-hot-toast';
import { getStatusLabel, getStageTypeName, getLeaderStageStatusLabel } from '../../utils/statusMapper';
import { API_BASE_URL } from '../../utils/constants';

const getCleanImageUrl = (url) => {
  if (!url || url === 'null') return null;
  if (url.startsWith('http')) return url;

  // Remove potential double slash or domain duplication
  const cleanBase = API_BASE_URL.replace(/\/$/, '');

  // If url contains the domain but no protocol
  const domain = cleanBase.replace(/^https?:\/\//, '');
  if (url.includes(domain) && !url.startsWith('http')) {
    return `https://${url}`;
  }

  // If it's a relative path starting with /
  if (url.startsWith('/')) {
    return `${cleanBase}${url}`;
  }

  // If it already seems to have a path structure (like api/files/)
  if (url.includes('/') && !url.startsWith('/')) {
    return `${cleanBase}/${url}`;
  }

  // Default to files endpoint
  return `${cleanBase}/api/files/${url}`;
};

const severityConfig = {
  MINOR: 'Nhẹ',
  MAJOR: 'Nặng',
  CRITICAL: 'Nghiêm trọng'
};

const LeaderStageProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { severity } = location.state || {};
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
  const [defect, setDefect] = useState(null);
  const [blockingInfo, setBlockingInfo] = useState(null); // NEW: Blocking check info

  const [inspections, setInspections] = useState([]);

  useEffect(() => {
    const fetchDefectInfo = async () => {
      if (location.state?.defectId) {
        try {
          const data = await productionService.getDefectDetail(location.state.defectId);
          setDefect(data);
        } catch (error) {
          console.error("Error fetching defect:", error);
        }
      }
    };
    fetchDefectInfo();
  }, [location.state?.defectId]);

  // Fallback: nếu mở từ "Đơn hàng của tôi" không có state.defectId, nhưng stage có defectId
  useEffect(() => {
    const fetchStageDefect = async () => {
      if (stage?.defectId) {
        // tránh gọi lại nếu đã có cùng defect
        if (defect && String(defect.id) === String(stage.defectId)) return;
        try {
          const data = await productionService.getDefectDetail(stage.defectId);
          setDefect(data);
        } catch (error) {
          console.error("Error fetching defect by stage.defectId:", error);
        }
      }
    };
    fetchStageDefect();
  }, [stage?.defectId, defect]);

  useEffect(() => {
    const loadInspections = async () => {
      const isFailedStatus = stage?.executionStatus === 'QC_FAILED' ||
        stage?.executionStatus === 'WAITING_REWORK' ||
        stage?.executionStatus === 'REWORK_IN_PROGRESS';

      if (stage?.id && (isFailedStatus || defect)) {
        try {
          const data = await executionService.getStageInspections(stage.id);
          // Filter only failed inspections
          const failed = data.filter(i => i.result === 'FAIL');
          setInspections(failed);
        } catch (error) {
          console.error("Error loading inspections:", error);
        }
      } else {
        setInspections([]);
      }
    };
    loadInspections();
  }, [stage, defect]);

  // ... (existing code)

  const [historyLoading, setHistoryLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
      case 'START_REWORK':
        return 'Bắt đầu sửa lỗi';
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
        isRework: tracking.isRework, // Map isRework
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
            // Ưu tiên stageId được truyền từ danh sách/đơn hàng
            const preferredStageId = location.state?.stageId;
            let currentStage = null;
            if (preferredStageId) {
              currentStage = data.stages.find(s => String(s.id) === String(preferredStageId));
            }
            // Nếu không có stageId hoặc không tìm thấy, fallback: stage của leader, sau đó stage đầu tiên
            if (!currentStage) {
              currentStage = data.stages.find(s =>
                (s.assignedLeader && String(s.assignedLeader.id) === String(userId)) ||
                (String(s.assignedLeaderId) === String(userId)) ||
                (s.assignee && s.assignee.includes && s.assignee.includes(userId))
              ) || data.stages[0];
            }

            setStage(currentStage);
            setCurrentProgress(currentStage.progress || currentStage.progressPercent || 0);
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

  // NEW: Check if stage is blocked by another lot
  useEffect(() => {
    const checkBlocking = async () => {
      if (!stage?.id) return;
      // Only check for stages that can potentially start
      const canPotentiallyStart = ['READY', 'WAITING', 'READY_TO_PRODUCE', 'WAITING_REWORK'].includes(stage?.executionStatus);
      if (!canPotentiallyStart) {
        setBlockingInfo(null);
        return;
      }
      try {
        const result = await executionService.checkCanStart(stage.id);
        setBlockingInfo(result);
      } catch (error) {
        console.error('Error checking stage availability:', error);
        setBlockingInfo(null);
      }
    };
    checkBlocking();
  }, [stage?.id, stage?.executionStatus, refreshKey]);

  const handleBack = () => {
    navigate('/leader/orders');
  };

  const handleStartStage = async () => {
    if (!stage) return;
    try {
      // Check if this is a rework stage (either explicitly flagged or part of a rework order)
      const isRework = stage.isRework || (order && order.poNumber && order.poNumber.includes('-REWORK'));

      if (isRework) {
        // Use startRework for pre-emption logic
        await executionService.startRework(stage.id, userId);
        toast.success('Đã bắt đầu sửa lỗi (Ưu tiên)');
      } else {
        // Normal start
        await executionService.startStage(stage.id, userId);
        toast.success('Đã bắt đầu công đoạn');
      }
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Lỗi khi bắt đầu công đoạn';
      if (msg.includes("BLOCKING")) {
        toast.error(msg.replace("java.lang.RuntimeException: BLOCKING: ", ""));
      } else {
        toast.error(msg);
      }
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
      setIsUpdating(true);
      await executionService.updateProgress(stage.id, userId, target);
      toast.success('Cập nhật tiến độ thành công');
      setInputProgress('');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(error.message || 'Lỗi khi cập nhật tiến độ');
    } finally {
      setIsUpdating(false);
    }
  };

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReason, setPauseReason] = useState('OTHER');
  const [pauseNotes, setPauseNotes] = useState('');

  const isRework = stage?.isRework || (order && order.poNumber && order.poNumber.includes('-REWORK'));

  const handlePause = () => {
    setShowPauseModal(true);
  };

  const confirmPause = async () => {
    if (!stage) return;
    try {
      await executionService.pauseStage(stage.id, userId, pauseReason, pauseNotes);
      toast.success('Đã tạm dừng công đoạn');
      setShowPauseModal(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(error.message || 'Lỗi khi tạm dừng công đoạn');
    }
  };

  const statusConfig = useMemo(() => {
    if (!stage) return { label: '...', variant: 'secondary' };

    const status = stage.executionStatus || stage.status;
    // Use the new getLeaderStageStatusLabel function for consistent mapping
    const result = getLeaderStageStatusLabel(status);
    return { label: result.label, variant: result.variant };
  }, [stage]);

  // Check if stage is pending (chưa đến lượt)
  const orderStatus = order?.executionStatus || order?.status;
  const orderLocked = orderStatus === 'WAITING_PRODUCTION' || orderStatus === 'PENDING_APPROVAL' || orderStatus === 'DRAFT';
  const isPaused = stage?.status === 'PAUSED';

  const isPending = stage && (
    stage.executionStatus === 'PENDING' ||
    (!stage.executionStatus && stage.status === 'PENDING')
  );
  const isStageInProgress = stage && (
    stage.executionStatus === 'IN_PROGRESS' ||
    stage.executionStatus === 'REWORK_IN_PROGRESS' ||
    stage.status === 'IN_PROGRESS' ||
    stage.status === 'REWORK_IN_PROGRESS'
  );

  // canStart: WAITING, READY (sẵn sàng sản xuất) hoặc WAITING_REWORK (chờ sửa), chưa IN_PROGRESS và tiến độ < 100%
  const canStart = stage && !isStageInProgress && stage.progressPercent < 100 && !orderLocked && !isPaused && (
    stage.executionStatus === 'WAITING' ||
    stage.executionStatus === 'READY' ||
    stage.executionStatus === 'READY_TO_PRODUCE' || // NEW: Allow start for this status
    stage.executionStatus === 'WAITING_REWORK' ||
    stage.status === 'WAITING' ||
    stage.status === 'WAITING_REWORK'
  );

  // Check if QC Failed (waiting for Tech)
  const isQcFailed = stage && (stage.executionStatus === 'QC_FAILED' || stage.status === 'QC_FAILED');

  // canUpdate: IN_PROGRESS (đang làm) hoặc REWORK_IN_PROGRESS (đang sửa)
  const canUpdate = stage && !orderLocked && !isPaused && !isQcFailed && currentProgress < 100 && (
    stage.executionStatus === 'IN_PROGRESS' ||
    stage.executionStatus === 'REWORK_IN_PROGRESS' ||
    stage.status === 'IN_PROGRESS' ||
    stage.status === 'REWORK_IN_PROGRESS'
  );

  const renderActions = () => {
    if (loading) return <Spinner animation="border" size="sm" />;

    // Rework orders can always start if they are assigned to this leader
    if (isRework && (stage?.executionStatus === 'WAITING' || stage?.executionStatus === 'PENDING' || stage?.executionStatus === 'READY' || stage?.executionStatus === 'READY_TO_PRODUCE')) {
      return (
        <Button variant="warning" onClick={handleStartStage}>
          Bắt đầu sửa lỗi (Ưu tiên)
        </Button>
      );
    }

    if (isPending) {
      return (
        <Alert variant="info">
          Chưa đến lượt: Công đoạn này đang ở trạng thái '{getStatusLabel(stage?.executionStatus)}'. Bạn chỉ có thể xem thông tin, không thể bắt đầu hoặc cập nhật tiến độ cho đến khi đến lượt của bạn.
        </Alert>
      );
    }

    if (canStart && !isPending && !orderLocked) {
      // NEW: Check if blocked by another lot
      if (blockingInfo && blockingInfo.canStart === false) {
        return (
          <Alert variant="warning" className="mb-3">
            <Alert.Heading>Công đoạn đang bị chiếm</Alert.Heading>
            <p>{blockingInfo.message || `Công đoạn này đang được sử dụng bởi lô khác.`}</p>
            {blockingInfo.blockedBy && (
              <p className="mb-0"><strong>Lô đang sử dụng:</strong> {blockingInfo.blockedBy}</p>
            )}
          </Alert>
        );
      }

      return (
        <Card className="shadow-sm mb-3" style={{ borderColor: '#e7f1ff', backgroundColor: '#f5f9ff' }}>
          <Card.Body className="d-flex justify-content-center">
            <Button variant="primary" size="lg" onClick={handleStartStage}>
              Bắt đầu công đoạn
            </Button>
          </Card.Body>
        </Card>
      );
    }

    if (canUpdate && !isPending && !orderLocked) {
      return (
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
                disabled={isPending || isPaused}
              />
              <Button variant="dark" onClick={handleUpdateProgress} disabled={isPending || isPaused || isUpdating}>
                {isUpdating ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Cập nhật'}
              </Button>
              {/* <Button variant="outline-danger" onClick={handlePause} disabled={isPending || isPaused}>
                Tạm dừng
              </Button> */}
            </div>
          </Card.Body>
        </Card>
      );
    }
    return null;
  };

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
                    <Form.Control readOnly value={getStageTypeName(stage.stageType)} className="fw-semibold" style={{ backgroundColor: '#f8f9fb' }} />
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

            {/* Defect Details for Rework - hide for supplementary production orders */}
            {!stage?.isRework && !(order?.poNumber || '').includes('-REWORK') && (defect || (stage && (stage.executionStatus === 'QC_FAILED' || stage.executionStatus === 'WAITING_REWORK' || stage.executionStatus === 'REWORK_IN_PROGRESS'))) && (
              <Card className="shadow-sm mb-3 border-danger">
                <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center">
                  <strong>Thông tin lỗi cần sửa</strong>
                  {defect?.attemptLabel && <Badge bg="light" text="dark">{defect.attemptLabel}</Badge>}
                </Card.Header>
                <Card.Body>
                  {defect && (
                    <div className="row mb-3">
                      <div className="col-12">
                        <p><strong>Mô tả lỗi chung:</strong> {defect.issueDescription || defect.description}</p>
                        <p><strong>Người báo cáo:</strong> {defect.reportedBy || 'QC'}</p>
                        <p><strong>Mức độ:</strong> {severityConfig[defect.severity] || defect.severity}</p>
                      </div>
                    </div>
                  )}

                  {/* Detailed Inspections List */}
                  {inspections && inspections.length > 0 && (
                    <div className="mt-3 pt-3 border-top">
                      <h6 className="fw-bold text-danger">Chi tiết lỗi theo tiêu chí:</h6>
                      <div className="table-responsive">
                        <Table size="sm" bordered hover className="mt-2">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: '40%' }}>Tiêu chí lỗi</th>
                              <th style={{ width: '30%' }}>Ghi chú</th>
                              <th style={{ width: '30%' }}>Hình ảnh</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inspections.map((insp, idx) => {
                              const imageUrl = getCleanImageUrl(insp.photoUrl);

                              return (
                                <tr key={idx}>
                                  <td className="align-middle fw-medium">{insp.checkpointName || 'Tiêu chí #' + insp.qcCheckpointId}</td>
                                  <td className="align-middle">{insp.notes || '-'}</td>
                                  <td className="align-middle">
                                    {imageUrl ? (
                                      <img
                                        src={imageUrl}
                                        alt="Inspection Evidence"
                                        className="img-thumbnail"
                                        style={{ height: '150px', cursor: 'pointer', objectFit: 'cover' }}
                                        onClick={() => window.open(imageUrl, '_blank')}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    ) : <span className="text-muted small">Không có ảnh</span>}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Action Area */}
            {isPaused && (
              <Card className="shadow-sm mb-3" style={{ borderColor: '#f5c6cb', backgroundColor: '#f8d7da' }}>
                <Card.Body>
                  <div className="alert alert-danger mb-0">
                    <strong>Đang tạm dừng:</strong> Công đoạn này đang bị tạm dừng (có thể do máy đang xử lý đơn hàng ưu tiên khác hoặc sự cố). Vui lòng chờ hoặc liên hệ quản lý.
                  </div>
                </Card.Body>
              </Card>
            )}

            {isQcFailed && (
              <Card className="shadow-sm mb-3" style={{ borderColor: '#f5c6cb', backgroundColor: '#f8d7da' }}>
                <Card.Body>
                  <div className="alert alert-danger mb-0">
                    <strong>Đang chờ kỹ thuật xử lý lỗi:</strong> Công đoạn này đã bị QC đánh dấu lỗi. Vui lòng chờ chỉ đạo từ bộ phận kỹ thuật trước khi tiếp tục.
                  </div>
                </Card.Body>
              </Card>
            )}

            {orderLocked && !isPaused && (
              <Card className="shadow-sm mb-3" style={{ borderColor: '#ffe1a8', backgroundColor: '#fff7e6' }}>
                <Card.Body>
                  <div className="alert alert-warning mb-0">
                    Quản lý sản xuất chưa ấn “Bắt đầu lệnh làm việc”. Bạn chỉ có thể xem thông tin cho đến khi lệnh được mở.
                  </div>
                </Card.Body>
              </Card>
            )}

            {renderActions()}



            <Card className="shadow-sm mb-3">
              <Card.Body className="p-0">
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <strong>Lịch sử cập nhật</strong>
                  {historyLoading && <small className="text-muted">Đang tải...</small>}
                </div>
                {historyLoading ? (
                  <div className="p-4 text-center text-muted">Đang tải lịch sử...</div>
                ) : history.length === 0 ? (
                  <div className="p-4 text-center text-muted">Chưa có lịch sử cập nhật</div>
                ) : (
                  <>
                    {/* Normal Progress History */}
                    <div className="p-3 bg-light border-bottom">
                      <h6 className="mb-0 text-primary">Lịch sử cập nhật tiến độ</h6>
                    </div>
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
                        {history.filter(h => !h.isRework).length > 0 ? (
                          history.filter(h => !h.isRework).map((item) => (
                            <tr key={item.id}>
                              <td>{item.action}</td>
                              <td>{item.progress}</td>
                              <td>{item.timestamp}</td>
                              <td>{item.operator}</td>
                              <td>{item.notes}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="5" className="text-center text-muted py-3">Chưa có dữ liệu</td></tr>
                        )}
                      </tbody>
                    </Table>

                    {/* Rework Progress History */}
                    {history.some(h => h.isRework) && (
                      <>
                        <div className="p-3 bg-light border-bottom border-top">
                          <h6 className="mb-0 text-danger">Lịch sử cập nhật tiến độ lỗi</h6>
                        </div>
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
                            {history.filter(h => h.isRework).map((item) => (
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
                      </>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>

            {/* QC Results (Simplified) */}
            {
              (stage.executionStatus === 'QC_PASSED' || stage.executionStatus === 'QC_FAILED') && (
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
              )
            }

          </Container >
        </div >
      </div >

      {/* Pause Modal */}
      {
        showPauseModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Tạm dừng công đoạn</h5>
                  <button type="button" className="btn-close" onClick={() => setShowPauseModal(false)}></button>
                </div>
                <div className="modal-body">
                  <Form.Group className="mb-3">
                    <Form.Label>Lý do tạm dừng</Form.Label>
                    <Form.Select value={pauseReason} onChange={(e) => setPauseReason(e.target.value)}>
                      <option value="MACHINE_ISSUE">Sự cố máy móc</option>
                      <option value="MATERIAL_SHORTAGE">Thiếu nguyên liệu</option>
                      <option value="PRIORITY_ORDER">Đơn hàng ưu tiên</option>
                      <option value="OTHER">Khác</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Ghi chú</Form.Label>
                    <Form.Control as="textarea" rows={3} value={pauseNotes} onChange={(e) => setPauseNotes(e.target.value)} />
                  </Form.Group>
                </div>
                <div className="modal-footer">
                  <Button variant="secondary" onClick={() => setShowPauseModal(false)}>Hủy</Button>
                  <Button variant="danger" onClick={confirmPause}>Xác nhận tạm dừng</Button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default LeaderStageProgress;
