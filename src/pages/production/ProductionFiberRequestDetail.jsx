import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const FIBER_REQUEST_LIBRARY = {
  'LOT-001': {
    lotCode: 'LOT-001',
    defectCode: 'L0001',
    product: 'Áo sơ mi nam',
    size: 'L',
    quantity: 1000,
    stage: 'Dệt',
    severity: 'major',
    description: 'h',
    creator: 'KCS - Hie',
    fiberType: 'cotton',
    fiberWeight: 100,
    requester: 'Tech - Trần Văn T',
    createdAt: '20/11/2025',
    note: 'hihi',
    checklist: [
      {
        title: 'Màu sắc đồng đều',
        status: 'fail',
        images: ['https://placekitten.com/480/220'],
      },
      {
        title: 'Hình dáng khăn',
        status: 'pass',
      },
      {
        title: 'Bề mặt vải',
        status: 'pass',
      },
    ],
  },
};

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
  const { lotCode } = useParams();
  const [approved, setApproved] = useState(false);

  const request = useMemo(() => FIBER_REQUEST_LIBRARY[lotCode] || FIBER_REQUEST_LIBRARY['LOT-001'], [lotCode]);
  const severity = severityConfig[request.severity];

  const handlePrimaryAction = () => {
    if (!approved) {
      setApproved(true);
    } else {
      navigate('/production/rework-orders/LOT-2025-001');
    }
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="production" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={() => navigate('/production/fiber-requests')}>
              &larr; Quay lại
            </Button>

            <Card className="shadow-sm mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="mb-1">Chi Tiết Yêu Cầu Cấp Sợi</h5>
                    <small className="text-muted">Xem và phê duyệt yêu cầu</small>
                  </div>
                  <Badge bg={severity.variant}>{severity.label}</Badge>
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="text-muted small mb-1">Mã lô</div>
                    <div className="fw-semibold">{request.lotCode}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Mã lỗi</div>
                    <div className="fw-semibold">{request.defectCode}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Sản phẩm</div>
                    <div className="fw-semibold">{request.product}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Kích thước</div>
                    <div className="fw-semibold">{request.size}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Số lượng</div>
                    <div className="fw-semibold">{request.quantity.toLocaleString('vi-VN')}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Công đoạn lỗi</div>
                    <div className="fw-semibold">{request.stage}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Mô tả lỗi</div>
                    <div className="fw-semibold">{request.description}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Người tạo</div>
                    <div className="fw-semibold">{request.creator}</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <strong>Tiêu chí kiểm tra</strong>
              </Card.Header>
              <Card.Body className="d-flex flex-column gap-3">
                {request.checklist.map((item) => {
                  const variant = checklistVariant[item.status];
                  return (
                    <div
                      key={item.title}
                      className="p-3 rounded"
                      style={{ border: `1px solid ${variant.border}`, background: variant.background }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="fw-semibold">{item.title}</div>
                        <Badge bg={variant.badge}>{variant.badgeText}</Badge>
                      </div>
                      {item.images?.map((src) => (
                        <img key={src} src={src} alt={item.title} className="rounded mb-2" style={{ maxWidth: '100%' }} />
                      ))}
                    </div>
                  );
                })}
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="text-muted small mb-1">Loại sợi</div>
                    <div className="fw-semibold text-capitalize">{request.fiberType}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Khối lượng cần cấp</div>
                    <div className="fw-semibold">{request.fiberWeight} kg</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Người yêu cầu</div>
                    <div className="fw-semibold">{request.requester}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Ngày tạo</div>
                    <div className="fw-semibold">{request.createdAt}</div>
                  </Col>
                  <Col md={12}>
                    <div className="text-muted small mb-1">Ghi chú</div>
                    <div className="fw-semibold">{request.note}</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body className="d-flex flex-column flex-lg-row justify-content-between align-items-center gap-3">
                <div>
                  <strong>{approved ? 'Tạo lệnh sản xuất bù' : 'Phê duyệt yêu cầu'}</strong>
                  <p className="text-muted mb-0">
                    {approved
                      ? 'Yêu cầu đã được phê duyệt. Bạn có thể tạo lệnh sản xuất bù.'
                      : 'Vui lòng xem xét và phê duyệt yêu cầu cấp sợi này.'}
                  </p>
                </div>
                <Button variant="dark" onClick={handlePrimaryAction}>
                  {approved ? 'Tạo lệnh sản xuất bù' : 'Phê duyệt'}
                </Button>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionFiberRequestDetail;

