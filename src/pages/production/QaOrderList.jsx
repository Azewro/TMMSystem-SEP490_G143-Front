import React, { useState, useMemo } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

// Mock data cho danh sách đơn hàng cần QA kiểm tra
const MOCK_QA_ORDERS = [
  {
    id: 'LOT-002',
    productName: 'Khăn mặt cotton',
    size: '30x50cm',
    quantity: 2000,
    expectedStartDate: '2025-11-18',
    expectedFinishDate: '2025-12-01',
    status: 'NHUOM_CHO_KIEM_TRA',
    statusLabel: 'Nhuộm chờ kiểm tra',
  },
  {
    id: 'LOT-003',
    productName: 'Khăn spa trắng',
    size: '50x100cm',
    quantity: 1500,
    expectedStartDate: '2025-11-15',
    expectedFinishDate: '2025-11-28',
    status: 'DANG_LAM',
    statusLabel: 'đang làm',
  },
  {
    id: 'LOT-004',
    productName: 'Khăn khách sạn',
    size: '60x120cm',
    quantity: 800,
    expectedStartDate: '2025-11-10',
    expectedFinishDate: '2025-11-25',
    status: 'HOAN_THANH',
    statusLabel: 'Hoàn thành',
  },
];

const getStatusVariant = (status) => {
  switch (status) {
    case 'NHUOM_CHO_KIEM_TRA':
      return 'warning';
    case 'DANG_LAM':
      return 'info';
    case 'HOAN_THANH':
      return 'success';
    default:
      return 'secondary';
  }
};

const QaOrderList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return MOCK_QA_ORDERS;
    const term = searchTerm.toLowerCase();
    return MOCK_QA_ORDERS.filter(
      (o) =>
        o.id.toLowerCase().includes(term) ||
        o.productName.toLowerCase().includes(term),
    );
  }, [searchTerm]);

  const handleInspect = (order) => {
    navigate(`/qa/orders/${order.id}`);
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
            <h4 className="mb-3">Danh sách đơn hàng</h4>
            <p className="text-muted mb-3">
              Quản lý và theo dõi đơn hàng cần kiểm tra chất lượng.
            </p>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Tìm kiếm theo mã lô hàng hoặc mô tả..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>STT</th>
                      <th>Mã lô</th>
                      <th>Tên sản phẩm</th>
                      <th>Kích thước</th>
                      <th>Số lượng</th>
                      <th>Ngày bắt đầu dự kiến</th>
                      <th>Ngày kết thúc dự kiến</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 120 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => (
                      <tr key={order.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{order.id}</strong>
                        </td>
                        <td>{order.productName}</td>
                        <td>{order.size}</td>
                        <td>{order.quantity.toLocaleString('vi-VN')}</td>
                        <td>{order.expectedStartDate}</td>
                        <td>{order.expectedFinishDate}</td>
                        <td>
                          <Badge bg={getStatusVariant(order.status)}>
                            {order.statusLabel}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            size="sm"
                            variant="dark"
                            onClick={() => handleInspect(order)}
                          >
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

export default QaOrderList;


