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
      { name: 'Cuồng mắc', owner: 'Nguyễn Văn A', status: 'N/A' },
      { name: 'Dệt', owner: 'Trần Thị B', status: 'N/A' },
      { name: 'Nhuộm', owner: 'Production Manager', status: 'N/A' },
      { name: 'Cắt', owner: 'Phạm Thị D', status: 'N/A' },
      { name: 'May', owner: 'Hoàng Văn E', status: 'N/A' },
      { name: 'Đóng gói', owner: 'Võ Thị F', status: 'N/A' },
    ],
  },
};

const ProductionReworkOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const order = useMemo(() => REWORK_ORDER_LIBRARY[orderId] || REWORK_ORDER_LIBRARY['LOT-2025-001'], [orderId]);

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
                <div className="d-flex justify-content-between flex-wrap gap-3">
                  <div>
                    <div className="text-muted small mb-1">Mã lô</div>
                    <h4 className="mb-1">{order.id}</h4>
                    <div className="text-muted">Tên sản phẩm: {order.product}</div>
                    <div className="text-muted">Kích thước: {order.size}</div>
                    <div className="text-muted">Số lượng: {order.quantity.toLocaleString('vi-VN')} sản phẩm</div>
                  </div>
                  <div className="text-end">
                    <Row className="g-2">
                      <Col xs={12}>
                        <div className="text-muted small">Ngày bắt đầu dự kiến</div>
                        <div className="fw-semibold">{order.startDate}</div>
                      </Col>
                      <Col xs={12}>
                        <div className="text-muted small">Ngày kết thúc dự kiến</div>
                        <div className="fw-semibold">{order.endDate}</div>
                      </Col>
                      <Col xs={12}>
                        <div className="text-muted small">Trạng thái</div>
                        <Badge bg="secondary">{order.status}</Badge>
                      </Col>
                    </Row>
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
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.stages.map((stage) => (
                      <tr key={stage.name}>
                        <td>{stage.name}</td>
                        <td>{stage.owner}</td>
                        <td>{stage.status}</td>
                        <td />
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
                  <p className="text-muted mb-0">Kiểm tra thông tin và khởi động kế hoạch sản xuất bù.</p>
                </div>
                <Button variant="dark">Bắt đầu sản xuất</Button>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionReworkOrderDetail;

