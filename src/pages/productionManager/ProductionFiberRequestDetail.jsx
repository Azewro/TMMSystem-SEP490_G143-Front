import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button, Spinner, Form } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import toast from 'react-hot-toast';

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
      } catch (error) {
        console.error('Error fetching request:', error);
        toast.error('Không thể tải thông tin yêu cầu');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  const handleApprove = async () => {
    if (!userId) {
      toast.error('Không tìm thấy thông tin người dùng');
      return;
    }
    try {
      setProcessing(true);
      await productionService.approveMaterialRequest(id, approvedQuantity, userId);
      toast.success('Đã phê duyệt yêu cầu và tạo lệnh sản xuất bù');
      navigate('/production/rework-orders');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Lỗi khi phê duyệt yêu cầu');
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

  const severity = request.sourceIssue ? severityConfig[request.sourceIssue.severity] || severityConfig.minor : severityConfig.minor;
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
                    <small className="text-muted">Mã yêu cầu: {request.requisitionNumber}</small>
                  </div>
                  <div className="d-flex gap-2">
                    <Badge bg={request.status === 'PENDING' ? 'warning' : 'success'}>
                      {request.status === 'PENDING' ? 'Chờ duyệt' : 'Đã duyệt'}
                    </Badge>
                    {request.sourceIssue && (
                      <Badge bg={severity.variant}>{severity.label}</Badge>
                    )}
                  </div>
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="text-muted small mb-1">Công đoạn</div>
                    <div className="fw-semibold">{request.productionStage?.stageType}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Người yêu cầu</div>
                    <div className="fw-semibold">{request.requestedBy?.name || 'N/A'}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Ngày yêu cầu</div>
                    <div className="fw-semibold">{request.requestedAt ? new Date(request.requestedAt).toLocaleString('vi-VN') : '-'}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Số lượng yêu cầu</div>
                    <div className="fw-semibold">{request.quantityRequested?.toLocaleString('vi-VN')} kg</div>
                  </Col>
                  <Col md={12}>
                    <div className="text-muted small mb-1">Ghi chú</div>
                    <div className="fw-semibold">{request.notes || '-'}</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {request.sourceIssue && (
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white">
                  <strong>Thông tin lỗi (QC)</strong>
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

            {isPending && (
              <Card className="shadow-sm">
                <Card.Body>
                  <h6 className="mb-3">Phê duyệt yêu cầu</h6>
                  <Row className="align-items-end">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Số lượng phê duyệt (kg)</Form.Label>
                        <Form.Control
                          type="number"
                          value={approvedQuantity}
                          onChange={(e) => setApprovedQuantity(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Button
                        variant="primary"
                        onClick={handleApprove}
                        disabled={processing}
                      >
                        {processing ? <Spinner size="sm" animation="border" /> : 'Phê duyệt & Tạo lệnh bù'}
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionFiberRequestDetail;

