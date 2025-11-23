import React from 'react';
import { Container, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const QA_RESULTS_BY_STAGE = {
  CUONG_MAC: {
    lotCode: 'LOT-002',
    productName: 'Khăn mặt cotton',
    criteria: [
      {
        title: 'Độ bền sợi',
        result: 'FAIL',
        remark: 'Không đạt',
        image: 'https://placekitten.com/600/260',
      },
      { title: 'Hình dáng khăn', result: 'PASS', remark: 'Đạt' },
      { title: 'Bề mặt vải', result: 'PASS', remark: 'Đạt' },
    ],
    overall: 'FAIL',
    summary: 'Có tiêu chí Không đạt. Vui lòng xử lý lỗi theo quy định.',
    defectLevel: 'Lỗi nặng',
    defectDescription: 'Độ bền sợi không đạt, yêu cầu Leader xử lý lại theo quy trình.',
  },
  DET: {
    lotCode: 'LOT-002',
    productName: 'Khăn mặt cotton',
    criteria: [
      { title: 'Độ bền sợi', result: 'PASS' },
      { title: 'Mật độ sợi', result: 'PASS' },
      { title: 'Hình dáng khăn', result: 'PASS' },
    ],
    overall: 'PASS',
    summary: 'Tất cả tiêu chí đều Đạt.',
    defectLevel: null,
    defectDescription: null,
  },
};

const QaStageCheckResult = () => {
  const navigate = useNavigate();
  const { orderId, stageCode } = useParams();
  const stageKey = (stageCode || '').toUpperCase();
  const qaResult = QA_RESULTS_BY_STAGE[stageKey] || QA_RESULTS_BY_STAGE.CUONG_MAC;

  const stageNameMap = {
    CUONG_MAC: 'Cuồng mắc',
    DET: 'Dệt',
    NHUOM: 'Nhuộm',
    CAT: 'Cắt',
    MAY: 'May',
    DONG_GOI: 'Đóng gói',
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="qa" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={() => navigate(`/qa/orders/${orderId || 'LOT-002'}`)}>
              &larr; Quay lại kế hoạch
            </Button>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h4 className="mb-1">Kết quả Kiểm Tra</h4>
                    <div className="text-muted small">
                      {qaResult.lotCode} • {qaResult.productName}
                    </div>
                    <div className="text-muted small">
                      Công đoạn: <strong>{stageNameMap[stageKey] || 'Công đoạn'}</strong>
                    </div>
                  </div>
                  <Badge bg={qaResult.overall === 'PASS' ? 'success' : 'danger'}>
                    {qaResult.overall === 'PASS' ? 'Đạt' : 'Không đạt'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <h6 className="mb-3">Tiêu chí kiểm tra</h6>
                <div className="d-flex flex-column gap-3">
                  {qaResult.criteria.map((criteria) => (
                    <div
                      key={criteria.title}
                      className="p-3 rounded"
                      style={{
                        border: `1px solid ${criteria.result === 'PASS' ? '#c3ebd3' : '#f9cfd9'}`,
                        backgroundColor: criteria.result === 'PASS' ? '#e8f7ef' : '#fdecef',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="fw-semibold">{criteria.title}</div>
                        <Badge bg={criteria.result === 'PASS' ? 'success' : 'danger'}>
                          {criteria.result === 'PASS' ? 'Đạt' : 'Không đạt'}
                        </Badge>
                      </div>
                      {criteria.image && (
                        <img
                          src={criteria.image}
                          alt={criteria.title}
                          className="rounded mb-2"
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      )}
                      {criteria.remark && <div className="text-muted small">{criteria.remark}</div>}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <Card
              className="shadow-sm"
              style={{
                borderColor: qaResult.overall === 'PASS' ? '#c3e6cb' : '#f5c2c7',
                backgroundColor: qaResult.overall === 'PASS' ? '#e9f7ef' : '#fdecec',
              }}
            >
              <Card.Body>
                <div className="fw-semibold mb-2">
                  Kết quả kiểm tra: <span>{qaResult.overall === 'PASS' ? 'Đạt' : 'Không đạt'}</span>
                </div>
                <div className="text-muted small mb-2">{qaResult.summary}</div>
                {qaResult.overall === 'FAIL' && (
                  <div className="d-flex flex-column gap-1">
                    <div>
                      <span className="text-muted small me-1">Mức độ lỗi:</span>
                      <strong>{qaResult.defectLevel || 'Chưa xác định'}</strong>
                    </div>
                    <div>
                      <span className="text-muted small me-1">Mô tả lỗi:</span>
                      <span>{qaResult.defectDescription || 'Chưa ghi chú'}</span>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QaStageCheckResult;

