import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button, Spinner, Form, Modal } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { getStageTypeName } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import { useWebSocketContext } from '../../context/WebSocketContext';

const severityConfig = {
  minor: { label: 'Lỗi nhẹ', variant: 'warning' },
  major: { label: 'Lỗi nặng', variant: 'danger' },
};

const checklistVariant = {
  pass: { border: '#c3ebd3', background: '#e8f7ef', badge: 'success', badgeText: 'Đạt' },
  fail: { border: '#f9cfd9', background: '#fdecef', badge: 'danger', badgeText: 'Không đạt' },
};

const ProductionFiberRequestDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvedQuantity, setApprovedQuantity] = useState(0);
  const [approvedDetails, setApprovedDetails] = useState({}); // Per-material approved quantities
  const [processing, setProcessing] = useState(false);

  // Get userId for directorId (assuming PM/Director role)
  const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const data = await productionService.getMaterialRequest(id);
        setRequest(data);
        setApprovedQuantity(data.quantityRequested || 0);
        // Initialize approvedDetails with requested quantities
        if (data.details && data.details.length > 0) {
          const initialDetails = {};
          data.details.forEach((detail, index) => {
            initialDetails[index] = detail.quantityRequested || 0;
          });
          setApprovedDetails(initialDetails);
        }
      } catch (error) {
        console.error('Error fetching request:', error);
        toast.error('Không thể tải thông tin yêu cầu');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  // WebSocket subscription for real-time updates
  const { subscribe } = useWebSocketContext();
  useEffect(() => {
    const unsubscribe = subscribe('/topic/updates', (update) => {
      if (update.entity === 'MATERIAL_REQUEST') {
        console.log('[ProductionFiberRequestDetail] Received update, refreshing...', update);
        productionService.getMaterialRequest(id).then(setRequest).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, [subscribe, id]);

  const calculateDays = () => {
    // Capacity per stage (kg/day)
    const capacities = {
      'WARPING': 2000, 'CUONG_MAC': 2000,
      'WEAVING': 500, 'DET': 500,
      'DYEING': 1000, 'NHUOM': 1000,
      'CUTTING': 2000, 'CAT': 2000,
      'HEMMING': 1500, 'MAY': 1500,
      'PACKAGING': 3000, 'DONG_GOI': 3000
    };

    // Wait times between stages (days) - from backend SequentialCapacityCalculator
    const waitTimes = {
      'WARPING': 0.5,     // Warping -> Weaving
      'CUONG_MAC': 0.5,
      'WEAVING': 0.5,     // Weaving -> Dyeing
      'DET': 0.5,
      'DYEING': 1.0,      // Dyeing -> Cutting
      'NHUOM': 1.0,
      'CUTTING': 0.2,     // Cutting -> Hemming
      'CAT': 0.2,
      'HEMMING': 0.3,     // Hemming -> Packaging
      'MAY': 0.3,
      'PACKAGING': 0.2,   // Packaging buffer
      'DONG_GOI': 0.2
    };

    // Stage order for rework - remaining stages after current one
    const stageOrder = ['WARPING', 'WEAVING', 'DYEING', 'CUTTING', 'HEMMING', 'PACKAGING'];
    const stageAliases = {
      'CUONG_MAC': 'WARPING',
      'DET': 'WEAVING',
      'NHUOM': 'DYEING',
      'CAT': 'CUTTING',
      'MAY': 'HEMMING',
      'DONG_GOI': 'PACKAGING'
    };

    const currentStageType = request?.productionStage?.stageType?.toUpperCase() || 'WARPING';
    const normalizedStage = stageAliases[currentStageType] || currentStageType;

    // Find index of current stage
    const currentIndex = stageOrder.indexOf(normalizedStage);
    if (currentIndex === -1) {
      // Fallback: just calculate for single stage
      const capacity = capacities[currentStageType] || 1000;
      return Math.ceil((approvedQuantity / capacity) * 2) / 2.0;
    }

    // Calculate total time for remaining stages (including current)
    let totalDays = 0;
    let totalWaitTime = 0;

    for (let i = currentIndex; i < stageOrder.length; i++) {
      const stage = stageOrder[i];
      const capacity = capacities[stage] || 1000;
      const processingDays = approvedQuantity / capacity;
      totalDays += processingDays;

      // Add wait time (except for last stage which has buffer)
      if (waitTimes[stage]) {
        totalWaitTime += waitTimes[stage];
      }
    }

    const grandTotal = totalDays + totalWaitTime;
    return Math.ceil(grandTotal * 2) / 2.0; // Round to nearest 0.5
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [estimatedDays, setEstimatedDays] = useState(0);

  const handlePreApprove = () => {
    const qty = Number(approvedQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Số lượng phê duyệt phải lớn hơn 0');
      return;
    }
    const days = calculateDays();
    setEstimatedDays(days);
    if (days > 7) {
      setShowWarningModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmApprove = async (force = false) => {
    if (!userId) {
      console.warn('[ProductionFiberRequestDetail] User ID not found');
      return;
    }
    try {
      setProcessing(true);
      // Build details array with per-material approved quantities
      const details = request.details?.map((detail, index) => ({
        id: detail.id,
        quantityApproved: Number(approvedDetails[index]) || 0
      })) || [];

      await productionService.approveMaterialRequest(id, details, userId, force);
      toast.success('Đã phê duyệt yêu cầu và tạo lệnh sản xuất bù');
      setShowConfirmModal(false);
      setShowWarningModal(false);
      navigate('/production/rework-orders');
    } catch (error) {
      console.error('Error approving request:', error);
      // If backend throws warning despite frontend check (e.g. slight calc diff), handle it
      if (error.response?.data?.message?.includes('TIME_EXCEEDED_WARNING')) {
        setEstimatedDays(calculateDays()); // Update days just in case
        setShowWarningModal(true); // Show warning modal
      } else {
        toast.error(error.response?.data?.message || 'Lỗi khi phê duyệt yêu cầu');
      }
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

  if (!request) {
    return (
      <div className="text-center mt-5">
        <h4>Không tìm thấy yêu cầu</h4>
        <Button variant="link" onClick={() => navigate('/production/orders')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const severityKey = request.sourceIssue?.severity?.toLowerCase() || 'minor';
  const severity = severityConfig[severityKey] || severityConfig.minor;
  const isPending = request.status === 'PENDING';

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="production" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={() => navigate('/production/orders')}>
              &larr; Quay lại danh sách đơn hàng
            </Button>

            <Card className="shadow-sm mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="mb-1">Chi Tiết Yêu Cầu Cấp Sợi</h5>
                    <small className="text-muted d-block">Mã lô hàng: {request.lotCode || request.poNumber || 'N/A'}</small>
                    {request.productName && (
                      <small className="text-muted d-block">Sản phẩm: <strong>{request.productName}</strong>{request.size ? ` - ${request.size}` : ''}</small>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <Badge bg={request.status === 'PENDING' ? 'warning' : 'success'}>
                      {request.status === 'PENDING' ? 'Chờ phê duyệt' : 'Đã phê duyệt'}
                    </Badge>
                    {request.sourceIssue && (
                      <Badge bg={severity.variant}>{severity.label}</Badge>
                    )}
                  </div>
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="text-muted small mb-1">Công đoạn</div>
                    <div className="fw-semibold">{getStageTypeName(request.productionStage?.stageType || request.stageName) || 'N/A'}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Người yêu cầu</div>
                    <div className="fw-semibold">{request.requesterName || request.requestedBy?.name || 'N/A'}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Ngày yêu cầu</div>
                    <div className="fw-semibold">{request.requestedAt ? new Date(request.requestedAt).toLocaleString('vi-VN') : '-'}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Tổng Số lượng yêu cầu</div>
                    <div className="fw-semibold">{request.quantityRequested?.toLocaleString('vi-VN')} kg</div>
                  </Col>
                  <Col md={12}>
                    <div className="text-muted small mb-1">Ghi chú</div>
                    <div className="fw-semibold">{request.notes || '-'}</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Material Details Table */}
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <strong>Chi tiết vật tư yêu cầu</strong>
              </Card.Header>
              <Card.Body>
                <table className="table table-bordered table-hover">
                  <thead>
                    <tr>
                      <th>Vật tư</th>
                      <th>Mã vật tư</th>
                      <th>SL Yêu cầu</th>
                      <th>SL Duyệt</th>
                      <th>Đơn vị</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {request.details && request.details.length > 0 ? (
                      request.details.map((detail, index) => (
                        <tr key={index}>
                          <td>{detail.materialName || '-'}</td>
                          <td>{detail.materialCode || '-'}</td>
                          <td className="text-end">{detail.quantityRequested?.toLocaleString('vi-VN')}</td>
                          <td className="text-end">{(detail.quantityApproved || detail.quantityRequested)?.toLocaleString('vi-VN') || '-'}</td>
                          <td>{detail.unit}</td>
                          <td>{detail.notes || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">Chưa có chi tiết vật tư</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card.Body>
            </Card>

            {request.sourceIssue && (
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white">
                  <strong>Thông tin lỗi QC tổng hợp</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={12}>
                      <div className="text-muted small mb-1">Mô tả lỗi</div>
                      <div>{request.sourceIssue.description}</div>
                    </Col>
                    {request.sourceIssue.evidencePhoto && (
                      <Col md={12}>
                        <div className="text-muted small mb-1">Ảnh bằng chứng</div>
                        <img src={request.sourceIssue.evidencePhoto} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '300px' }} className="rounded" />
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Detailed Defect List */}
            {request.defectDetails && request.defectDetails.length > 0 && (
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white">
                  <strong>Chi tiết tiêu chí lỗi</strong>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover">
                      <thead>
                        <tr>
                          <th style={{ width: '25%' }}>Tiêu chí kiểm tra</th>
                          <th style={{ width: '35%' }}>Mô tả lỗi</th>
                          <th style={{ width: '40%' }}>Ảnh minh họa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {request.defectDetails.map((defect, idx) => (
                          <tr key={idx}>
                            <td>{defect.criteriaName || 'Kiểm tra chung'}</td>
                            <td>{defect.description || '-'}</td>
                            <td>
                              {defect.photoUrl ? (
                                <img
                                  src={defect.photoUrl}
                                  alt="Defect"
                                  style={{ maxWidth: '150px', maxHeight: '100px', objectFit: 'cover' }}
                                  className="rounded border"
                                  onClick={() => window.open(defect.photoUrl, '_blank')}
                                  title="Click để xem ảnh lớn"
                                />
                              ) : (
                                <span className="text-muted small">Không có ảnh</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            )}

            {isPending && (
              <Card className="shadow-sm">
                <Card.Body>
                  <h6 className="mb-3">Phê duyệt yêu cầu</h6>
                  <div className="table-responsive mb-3">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Vật tư</th>
                          <th style={{ width: '150px' }}>SL Yêu cầu (kg)</th>
                          <th style={{ width: '180px' }}>SL Phê duyệt (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {request.details && request.details.map((detail, index) => (
                          <tr key={index}>
                            <td>
                              <div className="fw-medium">{detail.materialName || '-'}</div>
                              <small className="text-muted">{detail.materialCode}</small>
                            </td>
                            <td className="text-end">{detail.quantityRequested?.toLocaleString('vi-VN')}</td>
                            <td>
                              <Form.Control
                                type="number"
                                min="0"
                                step="0.1"
                                value={approvedDetails[index] || 0}
                                onChange={(e) => {
                                  const newDetails = { ...approvedDetails, [index]: parseFloat(e.target.value) || 0 };
                                  setApprovedDetails(newDetails);
                                  // Update total
                                  const total = Object.values(newDetails).reduce((sum, val) => sum + val, 0);
                                  setApprovedQuantity(total);
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                        <tr className="table-light fw-bold">
                          <td>Tổng cộng</td>
                          <td className="text-end">{request.quantityRequested?.toLocaleString('vi-VN')}</td>
                          <td className="text-end">{approvedQuantity.toLocaleString('vi-VN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handlePreApprove}
                    disabled={processing || approvedQuantity <= 0}
                  >
                    {processing ? <Spinner size="sm" animation="border" /> : 'Phê duyệt & Tạo lệnh bù'}
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Container>
        </div>
      </div>

      {/* Confirmation Modal (<= 7 days) */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận phê duyệt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Hệ thống ước tính thời gian sản xuất bù là <strong>{estimatedDays} ngày</strong>.</p>
          <p>Bạn có chắc chắn muốn phê duyệt yêu cầu này và tạo lệnh sản xuất bổ sung không?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => handleConfirmApprove(false)} disabled={processing}>
            {processing ? <Spinner size="sm" animation="border" /> : 'Xác nhận'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Warning Modal (> 7 days) */}
      <Modal show={showWarningModal} onHide={() => setShowWarningModal(false)} centered>
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title>Cảnh báo thời gian</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Thời gian làm quá lâu (<strong>{estimatedDays} ngày</strong>) làm cho các đơn hàng sau sẽ bị quá ngày giao hàng.</p>
          <p>Bạn có chắc chắn muốn phê duyệt không?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWarningModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={() => handleConfirmApprove(true)} disabled={processing}>
            {processing ? <Spinner size="sm" animation="border" /> : 'Xác nhận phê duyệt'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductionFiberRequestDetail;

