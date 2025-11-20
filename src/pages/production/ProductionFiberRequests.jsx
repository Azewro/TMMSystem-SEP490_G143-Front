import React from 'react';
import { Container, Card, Table, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const MOCK_FIBER_REQUESTS = [
  {
    lotCode: 'LOT-001',
    product: 'Áo sơ mi nam',
    stage: 'Dệt',
    fiberType: 'cotton',
    quantity: 100,
    requester: 'Tech - Trần Văn T',
    status: 'pending',
    createdAt: '20/11/2025',
  },
  {
    lotCode: 'LOT-002',
    product: 'Quần lử nữ',
    stage: 'Nhuộm',
    fiberType: 'polyester',
    quantity: 80,
    requester: 'Tech - Nguyễn Văn B',
    status: 'approved',
    createdAt: '21/11/2025',
  },
];

const statusConfig = {
  pending: { label: 'Chờ phê duyệt', variant: 'warning' },
  approved: { label: 'Đã phê duyệt', variant: 'success' },
};

const ProductionFiberRequests = () => {
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
                <div className="mb-3">
                  <h5 className="mb-1">Danh Sách Yêu Cầu Cấp Sợi (PM)</h5>
                  <small className="text-muted">Xem và phê duyệt yêu cầu từ Tech</small>
                </div>

                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Mã lô</th>
                      <th>Sản phẩm</th>
                      <th>Công đoạn lỗi</th>
                      <th>Loại sợi</th>
                      <th>Khối lượng (kg)</th>
                      <th>Người yêu cầu</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_FIBER_REQUESTS.map((item) => (
                      <tr key={item.lotCode}>
                        <td>{item.lotCode}</td>
                        <td>{item.product}</td>
                        <td>{item.stage}</td>
                        <td>{item.fiberType}</td>
                        <td>{item.quantity}</td>
                        <td>{item.requester}</td>
                        <td>
                          <Badge bg={statusConfig[item.status].variant}>{statusConfig[item.status].label}</Badge>
                        </td>
                        <td>{item.createdAt}</td>
                        <td>
                          <Button variant="outline-dark" size="sm" onClick={() => navigate(`/production/fiber-requests/${item.lotCode}`)}>
                            Chi tiết
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

export default ProductionFiberRequests;

