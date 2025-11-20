import React from 'react';
import { Container, Card, Table, Badge, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const REWORK_ORDERS = [
  {
    id: 'LOT-001',
    product: 'Khăn tắm cao cấp',
    size: '70x140cm',
    quantity: 1000,
    startDate: '2025-11-20',
    endDate: '2025-12-05',
    status: 'waiting',
  },
  {
    id: 'LOT-002',
    product: 'Khăn mặt cotton',
    size: '30x30cm',
    quantity: 2000,
    startDate: '2025-11-18',
    endDate: '2025-12-01',
    status: 'ready',
  },
  {
    id: 'LOT-003',
    product: 'Khăn lau siêu thấm',
    size: '40x80cm',
    quantity: 1500,
    startDate: '2025-11-15',
    endDate: '2025-11-30',
    status: 'running',
  },
  {
    id: 'LOT-004',
    product: 'Khăn khách sạn',
    size: '60x120cm',
    quantity: 800,
    startDate: '2025-11-10',
    endDate: '2025-11-25',
    status: 'done',
  },
];

const statusConfig = {
  waiting: { label: 'Chờ sản xuất', variant: 'secondary' },
  ready: { label: 'Nguyên liệu sẵn sàng', variant: 'info' },
  running: { label: 'Máy đang làm', variant: 'primary' },
  done: { label: 'Hoàn thành', variant: 'success' },
};

const ProductionReworkOrders = () => {
  const navigate = useNavigate();

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="production" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-3 gap-3">
                  <div>
                    <h5 className="mb-1">Danh sách sản xuất bù</h5>
                    <small className="text-muted">Theo dõi tiến độ các lệnh sản xuất bù</small>
                  </div>
                  <div className="d-flex gap-2 w-100 w-lg-auto">
                    <Form.Control placeholder="Tìm kiếm theo mã lô hoặc mã lỗi..." />
                    <Form.Select defaultValue="">
                      <option value="">Tất cả trạng thái</option>
                      <option value="waiting">Chờ sản xuất</option>
                      <option value="ready">Nguyên liệu sẵn sàng</option>
                      <option value="running">Máy đang làm</option>
                      <option value="done">Hoàn thành</option>
                    </Form.Select>
                  </div>
                </div>

                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>STT</th>
                      <th>Mã lô</th>
                      <th>Tên sản phẩm</th>
                      <th>Kích thước</th>
                      <th>Số lượng</th>
                      <th>Ngày bắt đầu dự kiến</th>
                      <th>Ngày kết thúc dự kiến</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REWORK_ORDERS.map((order, index) => (
                      <tr key={order.id}>
                        <td>{index + 1}</td>
                        <td>{order.id}</td>
                        <td>{order.product}</td>
                        <td>{order.size}</td>
                        <td>{order.quantity.toLocaleString('vi-VN')}</td>
                        <td>{order.startDate}</td>
                        <td>{order.endDate}</td>
                        <td>
                          <Badge bg={statusConfig[order.status].variant}>{statusConfig[order.status].label}</Badge>
                        </td>
                        <td>
                          <Button size="sm" variant="outline-dark" onClick={() => navigate(`/production/rework-orders/${order.id}`)}>
                            Xem kế hoạch
                          </Button>
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

export default ProductionReworkOrders;

