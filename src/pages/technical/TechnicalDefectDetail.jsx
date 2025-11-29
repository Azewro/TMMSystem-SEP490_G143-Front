import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button, Form, Spinner } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import api from '../../api/apiConfig';
import { toast } from 'react-hot-toast';

const severityStyles = {
  minor: { label: 'Lỗi nhẹ', variant: 'warning' },
  major: { label: 'Lỗi nặng', variant: 'danger' },
};

const checklistVariant = {
  PASS: { background: '#e8f7ef', border: '#c3ebd3', badgeVariant: 'success', badgeText: 'Đạt' },
  FAIL: { background: '#fdecef', border: '#f9cfd9', badgeVariant: 'danger', badgeText: 'Không đạt' },
};

const TechnicalDefectDetail = () => {
  const navigate = useNavigate();
  const { defectId } = useParams();
  const [defect, setDefect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [materialRequest, setMaterialRequest] = useState({
    type: '',
    quantity: '',
    notes: ''
  });

  useEffect(() => {
    const fetchDefect = async () => {
      try {
        const response = await api.get(`/v1/production/defects/${defectId}`);
        setDefect(response.data);
      } catch (error) {
        console.error("Error fetching defect:", error);
        toast.error("Không thể tải thông tin lỗi");
      } finally {
        setLoading(false);
      }
    };
    fetchDefect();
  }, [defectId]);

  const handleDecision = async (decision) => {
    try {
      const userId = localStorage.getItem('userId') || 1; // Fallback to 1 for testing

      let finalNotes = notes;
      if (decision === 'MATERIAL_REQUEST') {
        finalNotes = `Yêu cầu cấp: ${materialRequest.quantity}kg ${materialRequest.type}. Ghi chú: ${materialRequest.notes}`;
      }

      await api.post('/v1/technical/defects/handle', null, {
        params: {
          stageId: defect.stageId, // Assuming DTO has stageId
          decision: decision,
          notes: finalNotes,
          technicalUserId: userId,
          quantity: materialRequest.quantity || 0
        }
      });

      toast.success("Đã gửi xử lý thành công");
      navigate('/technical/defects');
    } catch (error) {
      console.error("Error handling defect:", error);
      toast.error("Có lỗi xảy ra khi xử lý");
    }
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (!defect) return <div className="text-center p-5">Không tìm thấy lỗi</div>;

  const severity = severityStyles[defect.severity?.toLowerCase()] || severityStyles.minor;

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="technical" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={() => navigate('/technical/defects')}>
              &larr; Quay lại
            </Button>

            <Card className="shadow-sm mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
                  <div>
                    <h5 className="mb-1">Chi Tiết Lỗi #{defect.id}</h5>
                    <small className="text-muted">Xem và xử lý lỗi</small>
                  </div>
                  <Badge bg={severity.variant} className="align-self-start">
                    {severity.label}
                  </Badge>
                </div>
                <Row className="g-3">
                  <Col md={4}>
                    <div className="text-muted small mb-1">Công đoạn</div>
                    <div className="fw-semibold">{defect.stageName}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small mb-1">Mã lô</div>
                    <div className="fw-semibold">{defect.batchNumber || 'N/A'}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small mb-1">Người báo cáo</div>
                    <div className="fw-semibold">{defect.reportedBy}</div>
                  </Col>
                  <Col md={12}>
                    <div className="text-muted small mb-1">Mô tả lỗi</div>
                    <div className="fw-semibold">{defect.issueDescription}</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <strong>Hình ảnh lỗi</strong>
              </Card.Header>
              <Card.Body>
                {defect.evidencePhoto && (
                  <img src={defect.evidencePhoto} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '300px' }} className="rounded" />
                )}
                {!defect.evidencePhoto && <p className="text-muted">Không có hình ảnh</p>}
              </Card.Body>
            </Card>

            {defect.severity === 'MINOR' ? (
              <Card className="shadow-sm">
                <Card.Body>
                  <strong>Xử lý lỗi nhẹ</strong>
                  <p className="text-muted mt-2 mb-4">Lỗi này được đánh giá là lỗi nhẹ. Bạn có thể yêu cầu Leader làm lại (Rework).</p>
                  <Form.Group className="mb-3">
                    <Form.Label>Ghi chú cho Leader</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Nhập hướng dẫn sửa lỗi..."
                    />
                  </Form.Group>
                  <Button variant="warning" onClick={() => handleDecision('REWORK')}>Yêu cầu làm lại</Button>
                </Card.Body>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <Card.Body>
                  <strong>Yêu cầu cấp lại sợi (Lỗi nặng)</strong>
                  <p className="text-muted mt-2 mb-4">Lỗi được đánh giá là lỗi nặng. Vui lòng điền thông tin yêu cầu cấp lại sợi để gửi cho PM phê duyệt.</p>
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Control
                        placeholder="Loại sợi cần cấp (ví dụ: Cotton 100%)"
                        value={materialRequest.type}
                        onChange={(e) => setMaterialRequest({ ...materialRequest, type: e.target.value })}
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Control
                        placeholder="Khối lượng cần cấp (kg)"
                        value={materialRequest.quantity}
                        onChange={(e) => setMaterialRequest({ ...materialRequest, quantity: e.target.value })}
                      />
                    </Col>
                    <Col md={12}>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Ghi chú thêm về yêu cầu..."
                        value={materialRequest.notes}
                        onChange={(e) => setMaterialRequest({ ...materialRequest, notes: e.target.value })}
                      />
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-end">
                    <Button variant="danger" onClick={() => handleDecision('MATERIAL_REQUEST')}>Tạo phiếu yêu cầu cấp sợi</Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default TechnicalDefectDetail;

