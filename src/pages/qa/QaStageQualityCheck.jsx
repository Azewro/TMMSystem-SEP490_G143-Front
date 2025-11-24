import React, { useState, useMemo, useEffect } from 'react';
import { Container, Card, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { orderService } from '../../api/orderService';
import { executionService } from '../../api/executionService';
import toast from 'react-hot-toast';

const QaStageQualityCheck = () => {
  const navigate = useNavigate();
  const { orderId, stageCode } = useParams();
  // Get userId from sessionStorage (set during login in authService.internalLogin)
  // Fallback to localStorage for backward compatibility
  const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');

  const [order, setOrder] = useState(null);
  const [stage, setStage] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [defectLevel, setDefectLevel] = useState('');
  const [defectDescription, setDefectDescription] = useState('');
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Order Details to find Stage ID
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);

        // Find stage by code/type
        const foundStage = orderData.stages?.find(s => s.stageType === stageCode || s.stageType === stageCode.toUpperCase());

        if (foundStage) {
          setStage(foundStage);

          // 2. Start QC Session if needed (or get existing)
          if (foundStage.executionStatus === 'WAITING_QC') {
            const session = await executionService.startQcSession(foundStage.id, userId);
            setSessionId(session.id);
          } else if (foundStage.executionStatus === 'QC_IN_PROGRESS') {
            // Ideally fetch existing session, but for now we might need an endpoint for that.
            // Assuming we can start again or get the active session.
            // The startQcSession endpoint returns existing session if IN_PROGRESS.
            const session = await executionService.startQcSession(foundStage.id, userId);
            setSessionId(session.id);
          }

          // 3. Fetch Checkpoints
          const cpData = await executionService.getStageCheckpoints(foundStage.id);
          setCheckpoints(cpData);

          // Initialize criteria state
          setCriteria(cpData.map(cp => ({
            id: cp.id,
            name: cp.checkpointName,
            result: '', // 'PASS' or 'FAIL'
            notes: '',
            photo: null,
            qcCheckpointId: cp.id
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Lỗi khi tải dữ liệu kiểm tra');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId, stageCode, userId]);

  const overallResult = useMemo(() => {
    if (criteria.length === 0) return 'PENDING';
    const hasFail = criteria.some((c) => c.result === 'FAIL');
    const allSelected = criteria.every((c) => c.result === 'PASS' || c.result === 'FAIL');
    if (!allSelected) return 'PENDING';
    return hasFail ? 'FAIL' : 'PASS';
  }, [criteria]);

  const handleBack = () => {
    navigate(`/qa/orders/${orderId}`);
  };

  const handleChangeResult = (id, value) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
            ...c,
            result: value,
            photo: value === 'FAIL' ? c.photo : null,
          }
          : c,
      ),
    );
  };

  const handlePhotoUpload = (id) => {
    // Mock photo upload
    setCriteria((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, photo: 'https://placehold.co/640x240?text=QC+Image' } : item,
      ),
    );
    toast.success('Đã đính kèm ảnh (giả lập)');
  };

  const handleSubmit = async () => {
    if (overallResult === 'PENDING') {
      toast.error('Vui lòng chọn đầy đủ kết quả cho tất cả tiêu chí.');
      return;
    }
    if (overallResult === 'FAIL') {
      const missingPhoto = criteria.some((c) => c.result === 'FAIL' && !c.photo);
      // Relaxing photo requirement for now as we don't have real upload
      // if (missingPhoto) {
      //   toast.error('Vui lòng bổ sung hình ảnh lỗi cho các tiêu chí Không đạt yêu cầu.');
      //   return;
      // }
      if (!defectDescription.trim()) {
        toast.error('Vui lòng nhập mô tả lỗi.');
        return;
      }
    }

    try {
      // Prepare DTOs
      const criteriaResults = criteria.map(c => ({
        qcCheckpointId: c.qcCheckpointId,
        result: c.result,
        notes: c.result === 'FAIL' ? c.name : '', // Use checkpoint name as defect type/note for now
        photoUrl: c.photo
      }));

      await executionService.submitQcSession(
        sessionId,
        overallResult,
        defectDescription,
        userId,
        overallResult === 'FAIL' ? defectLevel : null,  // ✅ ADD defectLevel
        overallResult === 'FAIL' ? defectDescription : null,  // ✅ ADD defectDescription
        criteriaResults
      );

      toast.success('Đã gửi kết quả kiểm tra');
      setTimeout(() => handleBack(), 1500);
    } catch (error) {
      toast.error(error.message || 'Lỗi khi gửi kết quả');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="qa" />
          <Container fluid className="p-4">
            <Button variant="link" onClick={handleBack}>&larr; Quay lại</Button>
            <div className="alert alert-warning mt-3">Không tìm thấy công đoạn.</div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="qa" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={handleBack}>
              &larr; Quay lại chi tiết đơn hàng
            </Button>

            {/* Header thông tin */}
            <Card className="shadow-sm mb-3">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">Kiểm tra chất lượng</h5>
                  <div className="text-muted small">
                    {orderId} • {order?.productName}
                  </div>
                  <div className="mt-2">
                    <span className="text-muted small">Công đoạn:&nbsp;</span>
                    <strong>{stage.stageType}</strong>
                  </div>
                </div>
                <div className="text-end">
                  <Badge bg="info" className="p-2">
                    {stage.executionStatus}
                  </Badge>
                </div>
              </Card.Body>
            </Card>

            {/* Danh sách tiêu chí */}
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <h6 className="mb-3">Danh sách tiêu chí kiểm tra</h6>
                {criteria.length === 0 ? (
                  <div className="text-muted">Không có tiêu chí kiểm tra nào được định nghĩa cho công đoạn này.</div>
                ) : (
                  criteria.map((c) => (
                    <div key={c.id} className="mb-3 border-bottom pb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>{c.name}</div>
                        <Form.Select
                          value={c.result}
                          onChange={(e) => handleChangeResult(c.id, e.target.value)}
                          style={{ maxWidth: 180 }}
                        >
                          <option value="">Chọn kết quả</option>
                          <option value="PASS">Đạt</option>
                          <option value="FAIL">Không đạt</option>
                        </Form.Select>
                      </div>

                      {c.result === 'FAIL' && (
                        <div
                          className="p-3 rounded"
                          style={{ backgroundColor: '#ffe3e3', border: '1px solid #ffc9c9' }}
                        >
                          <div className="mb-2 fw-semibold">Hình ảnh lỗi (bắt buộc)</div>
                          <Button
                            variant="outline-dark"
                            size="sm"
                            onClick={() => handlePhotoUpload(c.id)}
                          >
                            {c.photo ? 'Đã có ảnh' : 'Chụp ảnh'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>

            {/* Kết quả tổng */}
            {overallResult === 'PASS' && (
              <Card
                className="shadow-sm mb-3"
                style={{ borderColor: '#c3e6cb', backgroundColor: '#e9f7ef' }}
              >
                <Card.Body>
                  <div className="fw-semibold mb-2">Kết quả kiểm tra: <span style={{ color: '#28a745' }}>Đạt</span></div>
                  <div className="text-muted small">
                    Tất cả tiêu chí đều Đạt. Bạn có thể gửi kết quả kiểm tra.
                  </div>
                </Card.Body>
              </Card>
            )}

            {overallResult === 'FAIL' && (
              <Card
                className="shadow-sm mb-3"
                style={{ borderColor: '#f5c2c7', backgroundColor: '#fdecec' }}
              >
                <Card.Body>
                  <div className="fw-semibold mb-3">
                    Kết quả kiểm tra: <span style={{ color: '#dc3545' }}>Không Đạt</span>
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label>Mức độ lỗi *</Form.Label>
                    <Form.Select
                      value={defectLevel}
                      onChange={(e) => setDefectLevel(e.target.value)}
                    >
                      <option value="">Chọn mức độ</option>
                      <option value="MINOR">Nhẹ</option>
                      <option value="MAJOR">Nặng</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Mô tả lỗi *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={defectDescription}
                      onChange={(e) => setDefectDescription(e.target.value)}
                      placeholder="Mô tả chi tiết lỗi phát hiện..."
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            )}

            <div className="d-flex justify-content-end">
              <Button variant="dark" onClick={handleSubmit} disabled={overallResult === 'PENDING'}>
                Gửi kết quả kiểm tra
              </Button>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QaStageQualityCheck;


