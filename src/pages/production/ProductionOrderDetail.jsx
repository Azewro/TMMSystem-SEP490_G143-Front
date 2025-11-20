import React from 'react';
import { Container, Card, Table, Button, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

// Mock chi tiết đơn hàng cho Production Manager
const MOCK_PM_ORDER = {
  id: 'ORD-2025-001',
  lotCode: 'LOT-001',
  productName: 'Khăn tắm cao cấp',
  size: '70x140cm',
  quantity: 1000,
  expectedStartDate: '2025-11-20',
  expectedFinishDate: '2025-12-05',
  statusLabel: 'Chờ sản xuất',
  stages: [
    { code: 'CUONG_MAC', name: 'Cuồng mắc', assignee: 'Nguyễn Văn A', statusLabel: 'Chờ cuồng mắc làm' },
    { code: 'DET', name: 'Dệt', assignee: 'Trần Thị B', statusLabel: 'Chờ dệt làm' },
    // Công đoạn Nhuộm là outsource nhưng PM vẫn là người chịu trách nhiệm
    { code: 'NHUOM', name: 'Nhuộm', assignee: 'Production Manager', statusLabel: 'Nhuộm chờ kiểm tra' },
    { code: 'CAT', name: 'Cắt', assignee: 'Phạm Thị D', statusLabel: 'Chờ cắt làm' },
    { code: 'MAY', name: 'May', assignee: 'Hoàng Văn E', statusLabel: 'Chờ may làm' },
    { code: 'DONG_GOI', name: 'Đóng gói', assignee: 'Võ Thị F', statusLabel: 'Chờ đóng gói làm' },
  ],
};

const ProductionOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const order = {
    ...MOCK_PM_ORDER,
    id: orderId || MOCK_PM_ORDER.id,
  };

  const handleBack = () => {
    navigate('/production/orders');
  };

  const handleViewStage = (stageCode) => {
    navigate(`/production/orders/${order.id}/stages/${stageCode}`);
  };

  const handleStartProduction = () => {
    // Bắt đầu từ công đoạn Nhuộm (outsource nhưng PM chịu trách nhiệm)
    navigate(`/production/orders/${order.id}/stages/NHUOM`);
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="production" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <Button variant="link" className="btn-back-link mb-3" onClick={handleBack}>
              <span>&larr;</span>
              <span>Quay lại danh sách</span>
            </Button>

            {/* Thông tin đơn hàng */}
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="row g-4 align-items-center">
                  <div className="col-md-4 d-flex gap-3 align-items-center">
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
                      <div className="text-muted small mb-1">Mã đơn hàng</div>
                      <h5 className="mb-1">{order.id}</h5>
                      <div className="text-muted small">
                        Mã lô {order.lotCode}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-8">
                    <div className="row g-2 order-info-grid">
                      <div className="col-sm-6">
                        <div className="text-muted small">Tên sản phẩm</div>
                        <div className="fw-semibold">{order.productName}</div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-muted small">Ngày bắt đầu dự kiến</div>
                        <div>{order.expectedStartDate}</div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-muted small">Kích thước</div>
                        <div>{order.size}</div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-muted small">Ngày kết thúc dự kiến</div>
                        <div>{order.expectedFinishDate}</div>
                      </div>
                      <div className="col-sm-6">
                        <div className="text-muted small">Số lượng</div>
                        <div>{order.quantity.toLocaleString('vi-VN')} sản phẩm</div>
                      </div>
                      <div className="col-sm-6 d-flex flex-column">
                        <div className="text-muted small mb-1">Trạng thái</div>
                        <Badge bg="secondary" className="status-badge align-self-start">
                          {order.statusLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Bảng các công đoạn sản xuất */}
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
                      <th>Trạng thái</th>
                      <th style={{ width: 160 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.stages.map((stage) => (
                      <tr key={stage.code}>
                        <td>{stage.name}</td>
                        <td>{stage.assignee}</td>
                        <td>
                          <Badge bg="secondary">{stage.statusLabel}</Badge>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              className="btn-pill-outline"
                              onClick={() => handleViewStage(stage.code)}
                            >
                              Chi tiết
                            </Button>
                            {stage.code === 'NHUOM' && (
                              <Button
                                size="sm"
                                variant="dark"
                                className="btn-pill-primary"
                                onClick={() => handleViewStage(stage.code)}
                              >
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

            <div className="d-flex justify-content-end mt-4">
              <Button
                size="lg"
                variant="dark"
                className="px-4"
                onClick={handleStartProduction}
              >
                Bắt đầu sản xuất
              </Button>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionOrderDetail;


