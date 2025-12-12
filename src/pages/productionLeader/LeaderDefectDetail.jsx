import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';

const severityConfig = {
  MINOR: { label: 'Lỗi nhẹ', variant: 'warning' },
  MAJOR: { label: 'Lỗi nặng', variant: 'danger' },
};

const LeaderDefectDetail = () => {
  const navigate = useNavigate();
  const { defectId } = useParams();
  const [defect, setDefect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchDefectDetail();
  }, [defectId]);

  const fetchDefectDetail = async () => {
    try {
      setLoading(true);
      const data = await productionService.getDefectDetail(defectId);
      setDefect(data);
    } catch (err) {
      console.error('Error fetching defect detail:', err);
      setError('Không thể tải chi tiết lỗi');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRework = async () => {
    try {
      setStarting(true);
      // Get userId from sessionStorage (set during login in authService.internalLogin)
      // Fallback to localStorage for backward compatibility
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      await productionService.startReworkFromDefect(defectId, userId);
      alert('Đã bắt đầu làm lại công đoạn');
      navigate('/leader/defects');
    } catch (err) {
      console.error('Error starting rework:', err);
      alert('Không thể bắt đầu làm lại: ' + (err.response?.data?.message || err.message));
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="leader" />
          <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
            <Container fluid className="p-4">
              <div className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-2">Đang tải...</p>
              </div>
            </Container>
          </div>
        </div>
      </div>
    );
  }

  if (error || !defect) {
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="leader" />
          <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
            <Container fluid className="p-4">
              <Alert variant="danger">{error || 'Không tìm thấy lỗi'}</Alert>
              <Button variant="link" onClick={() => navigate('/leader/defects')}>← Quay lại</Button>
            </Container>
          </div>
        </div>
      </div>
    );
  }

  const severity = severityConfig[defect.severity] || { label: defect.severity, variant: 'secondary' };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="leader" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={() => navigate('/leader/defects')}>
              &larr; Quay lại
            </Button>

            <Card className="shadow-sm mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                  <div>
                    <h5 className="mb-1">Chi tiết lỗi {defect.attemptLabel && <Badge bg="info" className="ms-2">{defect.attemptLabel}</Badge>}</h5>
                  </div>
                  <Badge bg={severity.variant}>{severity.label}</Badge>
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="text-muted small mb-1">Mã đơn</div>
                    <div className="fw-semibold">{defect.poNumber || 'N/A'}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Công đoạn</div>
                    <div className="fw-semibold">{defect.stageType || 'N/A'}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Loại lỗi</div>
                    <div className="fw-semibold">{defect.issueType || 'N/A'}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Trạng thái</div>
                    <div className="fw-semibold">{defect.status || 'N/A'}</div>
                  </Col>
                  <Col md={12}>
                    <div className="text-muted small mb-1">Mô tả lỗi</div>
                    <div className="fw-semibold">{defect.description || 'Không có mô tả'}</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                <div>
                  <strong>Xử lý lỗi</strong>
                  <p className="text-muted mb-0">
                    Bắt đầu làm lại công đoạn để sửa lỗi này.
                  </p>
                </div>
                <Button
                  variant="dark"
                  onClick={handleStartRework}
                  disabled={starting || defect.status === 'IN_PROGRESS'}
                >
                  {starting ? 'Đang xử lý...' : defect.status === 'IN_PROGRESS' ? 'Đang sửa' : 'Bắt đầu sửa lỗi'}
                </Button>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default LeaderDefectDetail;
