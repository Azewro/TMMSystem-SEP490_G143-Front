import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Table, Badge, Button, Row, Col } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const REWORK_ORDER_LIBRARY = {
  'LOT-2025-001': {
    id: 'LOT-2025-001',
    product: 'Khăn tắm cao cấp',
    size: '70x140cm',
    quantity: 1000,
    startDate: '2025-11-20',
    endDate: '2025-12-05',
    status: 'Chờ sản xuất',
    stages: [
      { code: 'CUONG_MAC', name: 'Cuồng mắc', owner: 'Nguyễn Văn A', progress: 10, statusLabel: 'Chờ cuồng mắc làm' },
      { code: 'DET', name: 'Dệt', owner: 'Trần Thị B', progress: 0, statusLabel: 'Chờ dệt làm' },
      { code: 'NHUOM', name: 'Nhuộm', owner: 'Production Manager', progress: 0, statusLabel: 'Nhuộm chờ kiểm tra', canStart: true },
      { code: 'CAT', name: 'Cắt', owner: 'Phạm Thị D', progress: 0, statusLabel: 'Chờ cắt làm' },
      { code: 'MAY', name: 'May', owner: 'Hoàng Văn E', progress: 0, statusLabel: 'Chờ may làm' },
      { code: 'DONG_GOI', name: 'Đóng gói', owner: 'Võ Thị F', progress: 0, statusLabel: 'Chờ đóng gói làm' },
    ],
  },
};

const ProductionReworkOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const order = useMemo(() => REWORK_ORDER_LIBRARY[orderId] || REWORK_ORDER_LIBRARY['LOT-2025-001'], [orderId]);

  const handleViewStage = (stageCode) => {
    navigate(`/production/rework-orders/${order.id}/stages/${stageCode}`);
  };

  const handleStartStage = (stageCode) => {
    navigate(`/production/rework-orders/${order.id}/stages/${stageCode}`);
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="production" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={() => navigate('/production/rework-orders')}>
              &larr; Quay lại danh sách
            </Button>

            <Card className="shadow-sm mb-4">
              <Card.Body>
                <div className="row g-4 align-items-center">
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
                      <small className="text-muted">Đơn hàng {order.product}</small>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-2">
                      <div className="text-muted small">Tên sản phẩm</div>
                      <div className="fw-semibold">{order.product}</div>
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
                      <div className="fw-semibold">{order.startDate}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Ngày kết thúc dự kiến</div>
                      <div className="fw-semibold">{order.endDate}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="text-muted small mb-0">Trạng thái</div>
                      <Badge bg="secondary" className="status-badge">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <strong>Các công đoạn sản xuất</strong>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Công đoạn</th>
                      <th>Người phụ trách</th>
                      <th>Tiến độ (%)</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.stages.map((stage) => (
                      <tr key={stage.code}>
                        <td>{stage.name}</td>
                        <td>{stage.owner}</td>
                        <td>{stage.progress ?? 0}%</td>
                        <td>
                          <Badge bg="secondary">{stage.statusLabel}</Badge>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <Button size="sm" variant="outline-secondary" onClick={() => handleViewStage(stage.code)}>
                              Chi tiết
                            </Button>
                            {stage.canStart && (
                              <Button size="sm" variant="dark" onClick={() => handleStartStage(stage.code)}>
                                Bắt đầu
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                <div>
                  <strong>Bắt đầu sản xuất</strong>
                  <p className="text-muted mb-0">Kiểm tra thông tin và khởi động kế hoạch sản xuất bổ sung.</p>
                </div>
                <Button variant="dark">Bắt đầu làm việc</Button>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionReworkOrderDetail;

