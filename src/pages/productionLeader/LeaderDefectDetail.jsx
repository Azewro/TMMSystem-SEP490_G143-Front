import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const DEFECT_DETAIL_LIBRARY = {
  L0001: {
    id: 'L0001',
    lotCode: 'LOT-001',
    product: 'Áo sơ mi nam',
    stage: 'Dệt',
    size: 'L',
    quantity: 1000,
    description: 'd',
    severity: 'minor',
    checklist: [
      {
        title: 'Độ bền sợi',
        status: 'fail',
        images: ['https://placekitten.com/640/240'],
      },
    ],
  },
  L0002: {
    id: 'L0002',
    lotCode: 'LOT-002',
    product: 'Quần lử nữ',
    stage: 'May',
    size: 'M',
    quantity: 2000,
    description: 'Đường may lệch',
    severity: 'minor',
    checklist: [
      {
        title: 'Độ bền sợi',
        status: 'fail',
        images: ['https://placekitten.com/641/240'],
      },
    ],
  },
};

const severityConfig = {
  minor: { label: 'Lỗi nhẹ', variant: 'warning' },
  major: { label: 'Lỗi nặng', variant: 'danger' },
};

const checklistVariant = {
  pass: { border: '#c3ebd3', background: '#e8f7ef', badge: 'success', label: 'Đạt' },
  fail: { border: '#f9cfd9', background: '#fdecef', badge: 'danger', label: 'Không đạt' },
};

const LeaderDefectDetail = () => {
  const navigate = useNavigate();
  const { defectId } = useParams();
  const [isFixing, setIsFixing] = useState(false);
  const defect = useMemo(() => DEFECT_DETAIL_LIBRARY[defectId] || DEFECT_DETAIL_LIBRARY.L0001, [defectId]);
  const severity = severityConfig[defect.severity];

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
                    <h5 className="mb-1">Chi tiết lỗi</h5>
                  </div>
                  <Badge bg={severity.variant}>{severity.label}</Badge>
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="text-muted small mb-1">Mã lô</div>
                    <div className="fw-semibold">{defect.lotCode}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Sản phẩm</div>
                    <div className="fw-semibold">{defect.product}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Kích thước</div>
                    <div className="fw-semibold">{defect.size}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Công đoạn</div>
                    <div className="fw-semibold">{defect.stage}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Số lượng</div>
                    <div className="fw-semibold">{defect.quantity.toLocaleString('vi-VN')}</div>
                  </Col>
                  <Col md={12}>
                    <div className="text-muted small mb-1">Mô tả lỗi</div>
                    <div className="fw-semibold">{defect.description}</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <strong>Tiêu chí lỗi</strong>
              </Card.Header>
              <Card.Body className="d-flex flex-column gap-3">
                {defect.checklist.map((item) => {
                  const variant = checklistVariant[item.status];
                  return (
                    <div
                      key={item.title}
                      className="p-3 rounded"
                      style={{ border: `1px solid ${variant.border}`, background: variant.background }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="fw-semibold">{item.title}</div>
                        <Badge bg={variant.badge}>{variant.label}</Badge>
                      </div>
                      {item.images?.map((src) => (
                        <img key={src} src={src} alt={item.title} className="rounded" style={{ maxWidth: '100%' }} />
                      ))}
                    </div>
                  );
                })}
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                <div>
                  <strong>{isFixing ? 'Cập nhật tiến độ sửa lỗi' : 'Xử lý lỗi'}</strong>
                  <p className="text-muted mb-0">
                    {isFixing
                      ? 'Bạn có thể chuyển sang màn cập nhật tiến độ để báo cáo kết quả.'
                      : 'Hãy bắt đầu sửa lỗi và thông báo cho Tech khi hoàn thành.'}
                  </p>
                </div>
                {defect.severity === 'minor' ? (
                  <Button variant="dark" onClick={() => navigate(`/leader/orders/${defect.lotCode}/progress`)}>
                    Bắt đầu sửa lỗi
                  </Button>
                ) : !isFixing ? (
                  <Button variant="dark" onClick={() => setIsFixing(true)}>
                    Bắt đầu sửa lỗi
                  </Button>
                ) : (
                  <Button variant="dark" onClick={() => navigate(`/leader/orders/${defect.lotCode}/progress`)}>
                    Cập nhật tiến độ
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default LeaderDefectDetail;

