import React from 'react';
import { Container, Card, Table, Button, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

// Mock chi tiết đơn hàng cho leader
const MOCK_ORDER_DETAIL = {
  id: 'LOT-002',
  productName: 'Khăn mặt cotton',
  size: '30x30cm',
  quantity: 2000,
  expectedDeliveryDate: '2025-11-18',
  expectedFinishDate: '2025-12-01',
  customerName: 'Công ty ABC',
  status: 'CHO_KIEM_TRA',
  statusLabel: 'chờ kiểm tra',
  stage: {
    name: 'Cuồng mắc',
    assignee: 'Nguyễn Văn A',
    status: 'CHO_BAT_DAU',
    statusLabel: 'Chờ bắt đầu'
  }
};

const LeaderOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const order = {
    ...MOCK_ORDER_DETAIL,
    id: orderId || MOCK_ORDER_DETAIL.id
  };

  const handleBack = () => {
    navigate('/leader/orders');
  };

  const handleViewStage = () => {
    navigate(`/leader/orders/${order.id}/progress`);
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="leader" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={handleBack}>
              &larr; Quay lại danh sách
            </Button>

            <Card className="shadow-sm mb-3">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  {/* QR mock */}
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
                      color: '#adb5bd'
                    }}
                  >
                    QR
                  </div>
                  <div>
                    <div className="text-muted small mb-1">Mã lô</div>
                    <h5 className="mb-1">{order.id}</h5>
                    <div className="text-muted small">
                      {order.size} • {order.quantity.toLocaleString('vi-VN')} sản phẩm
                    </div>
                  </div>
                </div>

                <div className="text-end">
                  <div className="mb-1">
                    <span className="text-muted small">Tên sản phẩm</span>
                    <div className="fw-semibold">{order.productName}</div>
                  </div>
                  <div className="mb-1">
                    <span className="text-muted small">Ngày bắt đầu dự kiến</span>
                    <div>{order.expectedDeliveryDate}</div>
                  </div>
                  <div className="mb-1">
                    <span className="text-muted small">Ngày kết thúc dự kiến</span>
                    <div>{order.expectedFinishDate}</div>
                  </div>
                  <div>
                    <span className="text-muted small me-2">Trạng thái</span>
                    <Badge bg="secondary">{order.statusLabel}</Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <div className="p-3 border-bottom">
                  <strong>Công đoạn của bạn</strong>
                </div>
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Công đoạn</th>
                      <th>Người phụ trách</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 120 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{order.stage.name}</td>
                      <td>{order.stage.assignee}</td>
                      <td>
                        <Badge bg="secondary">{order.stage.statusLabel}</Badge>
                      </td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-dark" onClick={handleViewStage}>
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
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

export default LeaderOrderDetail;


