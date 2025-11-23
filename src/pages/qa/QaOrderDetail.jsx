import React from 'react';
import { Container, Card, Table, Button, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

// Mock chi tiết đơn hàng cho QA
const MOCK_QA_ORDER = {
  id: 'LOT-002',
  productName: 'Khăn mặt cotton',
  size: '30x50cm',
  quantity: 2000,
  expectedStartDate: '2025-11-18',
  expectedFinishDate: '2025-12-01',
  statusLabel: 'Nhuộm chờ kiểm tra',
  stages: [
    { code: 'CUONG_MAC', name: 'Cuồng mắc', assignee: 'Nguyễn Văn A', statusLabel: 'Chờ QC làm', progress: 10 },
    { code: 'DET', name: 'Dệt', assignee: 'Trần Thị B', statusLabel: 'Chờ QC làm', progress: 0 },
    { code: 'NHUOM', name: 'Nhuộm', assignee: 'Lê Văn C', statusLabel: 'Nhuộm chờ kiểm tra', progress: 0 },
    { code: 'CAT', name: 'Cắt', assignee: 'Phạm Thị D', statusLabel: 'Chờ QC làm', progress: 0 },
    { code: 'MAY', name: 'May', assignee: 'Hoàng Văn E', statusLabel: 'Chờ QC làm', progress: 0 },
    { code: 'DONG_GOI', name: 'Đóng gói', assignee: 'Võ Thị F', statusLabel: 'Chờ QC làm', progress: 0 },
  ],
};

const QaOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const order = {
    ...MOCK_QA_ORDER,
    id: orderId || MOCK_QA_ORDER.id,
  };

  const handleBack = () => {
    navigate('/qa/orders');
  };

  const handleInspectStage = (stageCode) => {
    navigate(`/qa/orders/${order.id}/stages/${stageCode}/check`);
  };

  const handleViewStageDetail = (stageCode) => {
    navigate(`/qa/orders/${order.id}/stages/${stageCode}/result`);
  };

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
              &larr; Quay lại danh sách
            </Button>

            {/* Thông tin đơn hàng */}
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="row g-4">
                  <div className="col-lg-4 d-flex gap-3 align-items-center">
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        border: '1px dashed #ced4da',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        color: '#adb5bd',
                      }}
                    >
                      QR
                    </div>
                    <div>
                      <div className="text-muted small mb-1">Mã lô sản xuất</div>
                      <h5 className="mb-1">{order.id}</h5>
                      <small className="text-muted">Đơn hàng {order.productName}</small>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-2">
                      <div className="text-muted small">Tên sản phẩm</div>
                      <div className="fw-semibold">{order.productName}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Kích thước</div>
                      <div className="fw-semibold">{order.size}</div>
                    </div>
                    <div>
                      <div className="text-muted small">Số lượng</div>
                      <div className="fw-semibold">{order.quantity.toLocaleString('vi-VN')} sản phẩm</div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-2">
                      <div className="text-muted small">Ngày bắt đầu dự kiến</div>
                      <div className="fw-semibold">{order.expectedStartDate}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Ngày kết thúc dự kiến</div>
                      <div className="fw-semibold">{order.expectedFinishDate}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="text-muted small mb-0">Trạng thái</div>
                      <Badge bg="warning" className="status-badge">
                        {order.statusLabel}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Danh sách công đoạn sản xuất */}
            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <div className="p-3 border-bottom">
                  <strong>Các công đoạn sản xuất</strong>
                </div>
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Công đoạn</th>
                      <th>Người phụ trách</th>
                      <th>Tiến độ (%)</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 140 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.stages.map((stage) => (
                      <tr key={stage.code}>
                        <td>{stage.name}</td>
                        <td>{stage.assignee}</td>
                        <td>{stage.progress ?? 0}%</td>
                        <td>
                          <Badge bg="secondary">{stage.statusLabel}</Badge>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <Button size="sm" variant="outline-secondary" onClick={() => handleViewStageDetail(stage.code)}>
                              Chi tiết
                            </Button>
                            <Button
                              size="sm"
                              variant="dark"
                              onClick={() => handleInspectStage(stage.code)}
                            >
                              Kiểm tra
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QaOrderDetail;


