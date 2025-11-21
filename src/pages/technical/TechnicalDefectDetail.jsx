import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button, Form } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const DEFECT_LIBRARY = {
  L0001: {
    id: 'L0001',
    lotCode: 'LOT-001',
    product: 'Áo sơ mi nam',
    size: 'L',
    quantity: 1000,
    stage: 'Dệt',
    severity: 'minor',
    note: '11111',
    creator: 'KSC - Nguyễn Văn K',
    checklist: [
      {
        title: 'Độ bền sợi',
        status: 'fail',
        remark: 'Không đạt',
        images: [
          'https://placekitten.com/480/240',
        ],
      },
      {
        title: 'Hình dáng khăn',
        status: 'pass',
        remark: 'Đạt',
      },
      {
        title: 'Bề mặt vải',
        status: 'pass',
        remark: 'Đạt',
      },
    ],
    actionNote: 'Lỗi này được đánh giá là lỗi nhẹ. Bạn có thể gửi yêu cầu xử lý về Leader công đoạn Dệt.',
    leader: 'Leader công đoạn Dệt',
  },
  L0002: {
    id: 'L0002',
    lotCode: 'LOT-002',
    product: 'Quần lử nữ',
    size: 'M',
    quantity: 800,
    stage: 'Nhuộm',
    severity: 'major',
    note: '99999',
    creator: 'KSC - Nguyễn Văn K',
    checklist: [
      {
        title: 'Màu sắc đồng đều',
        status: 'fail',
        remark: 'Không đạt',
        images: [
          'https://placekitten.com/480/240',
        ],
      },
      {
        title: 'Độ bền sợi',
        status: 'fail',
        remark: 'Không đạt',
        images: [
          'https://placekitten.com/481/240',
        ],
      },
      {
        title: 'Hình dáng khăn',
        status: 'pass',
        remark: 'Đạt',
      },
      {
        title: 'Bề mặt vải',
        status: 'pass',
        remark: 'Đạt',
      },
    ],
    actionNote: 'Lỗi được đánh giá là lỗi nặng. Vui lòng điền thông tin yêu cầu cấp lại sợi để gửi cho PM phê duyệt.',
  },
};

const severityStyles = {
  minor: { label: 'Lỗi nhẹ', variant: 'warning' },
  major: { label: 'Lỗi nặng', variant: 'danger' },
};

const checklistVariant = {
  pass: { background: '#e8f7ef', border: '#c3ebd3', badgeVariant: 'success', badgeText: 'Đạt' },
  fail: { background: '#fdecef', border: '#f9cfd9', badgeVariant: 'danger', badgeText: 'Không đạt' },
};

const TechnicalDefectDetail = () => {
  const navigate = useNavigate();
  const { defectId } = useParams();

  const defect = useMemo(() => DEFECT_LIBRARY[defectId] || DEFECT_LIBRARY.L0001, [defectId]);
  const severity = severityStyles[defect.severity];

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
                    <h5 className="mb-1">Chi Tiết Lỗi</h5>
                    <small className="text-muted">Xem và xử lý lỗi</small>
                  </div>
                  <Badge bg={severity.variant} className="align-self-start">
                    {severity.label}
                  </Badge>
                </div>
                <Row className="g-3">
                  <Col md={4}>
                    <div className="text-muted small mb-1">Sản phẩm</div>
                    <div className="fw-semibold">{defect.product}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small mb-1">Mã lô</div>
                    <div className="fw-semibold">{defect.lotCode}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small mb-1">Kích thước</div>
                    <div className="fw-semibold">{defect.size}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small mb-1">Số lượng</div>
                    <div className="fw-semibold">{defect.quantity.toLocaleString('vi-VN')}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small mb-1">Công đoạn lỗi</div>
                    <div className="fw-semibold">{defect.stage}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Mức độ lỗi</div>
                    <div className="fw-semibold">{severity.label}</div>
                  </Col>
                  <Col md={6}>
                    <div className="text-muted small mb-1">Người tạo</div>
                    <div className="fw-semibold">{defect.creator}</div>
                  </Col>
                  <Col md={12}>
                    <div className="text-muted small mb-1">Ghi chú</div>
                    <div className="fw-semibold">{defect.note}</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <strong>Tiêu chí kiểm tra</strong>
              </Card.Header>
              <Card.Body className="d-flex flex-column gap-3">
                {defect.checklist.map((item, index) => {
                  const variant = checklistVariant[item.status];
                  return (
                    <div
                      key={item.title}
                      style={{
                        border: `1px solid ${variant.border}`,
                        backgroundColor: variant.background,
                        borderRadius: 8,
                      }}
                      className="p-3"
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="fw-semibold">{item.title}</div>
                        <Badge bg={variant.badgeVariant}>{variant.badgeText}</Badge>
                      </div>
                      {item.images?.map((src, imgIndex) => (
                        <img
                          key={src}
                          src={src}
                          alt={`${item.title}-${imgIndex}`}
                          className="rounded mb-2"
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      ))}
                      <div className="text-muted">{item.remark}</div>
                    </div>
                  );
                })}
              </Card.Body>
            </Card>

            {defect.severity === 'minor' ? (
              <Card className="shadow-sm">
                <Card.Body>
                  <strong>Xử lý lỗi nhẹ</strong>
                  <p className="text-muted mt-2 mb-4">{defect.actionNote}</p>
                  <Button variant="dark">Gửi yêu cầu về {defect.leader}</Button>
                </Card.Body>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <Card.Body>
                  <strong>Yêu cầu cấp lại sợi (Lỗi nặng)</strong>
                  <p className="text-muted mt-2 mb-4">{defect.actionNote}</p>
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Control placeholder="Ví dụ: Sợi cotton 100%" />
                    </Col>
                    <Col md={6}>
                      <Form.Control placeholder="Khối lượng cần cấp (kg)" />
                    </Col>
                    <Col md={12}>
                      <Form.Control as="textarea" rows={3} placeholder="Ghi chú thêm về yêu cầu..." />
                    </Col>
                  </Row>
                  <Button variant="dark">Gửi yêu cầu cấp sợi cho PM</Button>
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

