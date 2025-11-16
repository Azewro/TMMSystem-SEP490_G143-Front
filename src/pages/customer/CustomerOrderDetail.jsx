import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Table, Badge, ListGroup } from 'react-bootstrap';
import Header from '../../components/common/Header';
import CustomerSidebar from '../../components/common/CustomerSidebar';

// Mock data for the order detail page
const mockOrder = {
  id: 'DH-2025-00123',
  orderDate: '17/11/2025',
  expectedDeliveryDate: '17/12/2025',
  status: 'IN_PRODUCTION',
  customerInfo: {
    name: 'Công ty TNHH ABC',
    contactPerson: 'Nguyễn Văn A',
    phone: '0987654321',
    shippingAddress: '123 Đường XYZ, Phường 1, Quận 1, TP. Hồ Chí Minh',
  },
  items: [
    { id: 1, productName: 'Khăn tắm cao cấp', quantity: 200, unitPrice: 150000, totalPrice: 30000000 },
    { id: 2, productName: 'Khăn mặt sợi tre', quantity: 500, unitPrice: 50000, totalPrice: 25000000 },
    { id: 3, productName: 'Thảm chân khách sạn', quantity: 150, unitPrice: 80000, totalPrice: 12000000 },
  ],
  summary: {
    subtotal: 67000000,
    shipping: 500000,
    total: 67500000,
  },
  history: [
    { status: 'Đang sản xuất', date: '20/11/2025', description: 'Đơn hàng đã được chuyển đến xưởng sản xuất.' },
    { status: 'Đã duyệt', date: '18/11/2025', description: 'Hợp đồng đã được giám đốc phê duyệt.' },
    { status: 'Chờ duyệt', date: '17/11/2025', description: 'Đã tạo đơn hàng, chờ giám đốc phê duyệt hợp đồng.' },
  ],
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'PENDING':
      return { variant: 'secondary', text: 'Chờ xử lý' };
    case 'APPROVED':
      return { variant: 'info', text: 'Đã duyệt' };
    case 'IN_PRODUCTION':
      return { variant: 'primary', text: 'Đang sản xuất' };
    case 'SHIPPED':
      return { variant: 'warning', text: 'Đang giao hàng' };
    case 'COMPLETED':
      return { variant: 'success', text: 'Hoàn thành' };
    case 'CANCELLED':
      return { variant: 'danger', text: 'Đã hủy' };
    default:
      return { variant: 'light', text: 'Không xác định' };
  }
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const CustomerOrderDetail = () => {
  const { id } = useParams(); // In a real app, you'd use this ID to fetch data
  const order = mockOrder; // Using mock data for now
  const statusInfo = getStatusBadge(order.status);

  return (
    <div>
      <Header />
      <div className="d-flex">
        <CustomerSidebar />
        <Container fluid className="p-4">
          <h2 className="mb-4">Chi tiết đơn hàng #{order.id}</h2>

          <Card className="mb-4">
            <Card.Header as="h5">Thông tin chung</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Ngày đặt hàng:</strong> {order.orderDate}</p>
                  <p><strong>Ngày giao dự kiến:</strong> {order.expectedDeliveryDate}</p>
                  <p className="mb-0">
                    <strong>Trạng thái:</strong> <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <p><strong>Người nhận:</strong> {order.customerInfo.contactPerson}</p>
                  <p className="mb-0"><strong>Địa chỉ giao hàng:</strong> {order.customerInfo.shippingAddress}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header as="h5">Chi tiết sản phẩm</Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sản phẩm</th>
                    <th className="text-end">Số lượng</th>
                    <th className="text-end">Đơn giá</th>
                    <th className="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.productName}</td>
                      <td className="text-end">{item.quantity.toLocaleString('vi-VN')}</td>
                      <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-end">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="text-end fw-bold">Tổng tiền hàng</td>
                    <td className="text-end fw-bold">{formatCurrency(order.summary.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="text-end">Phí vận chuyển</td>
                    <td className="text-end">{formatCurrency(order.summary.shipping)}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="text-end fw-bold fs-5">Tổng cộng</td>
                    <td className="text-end fw-bold fs-5">{formatCurrency(order.summary.total)}</td>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header as="h5">Lịch sử đơn hàng</Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {order.history.map((event, index) => (
                  <ListGroup.Item key={index}>
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold">{event.status}</span>
                      <span className="text-muted">{event.date}</span>
                    </div>
                    <p className="mb-0 text-muted small">{event.description}</p>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>

        </Container>
      </div>
    </div>
  );
};

export default CustomerOrderDetail;