import React from 'react';
import { Container, Card, Table, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const LEADER_DEFECTS = [
  {
    id: 'L0001',
    orderCode: 'DH001',
    product: 'Áo sơ mi nam',
    stage: 'Dệt',
    severity: 'minor',
    sentAt: '20/11/2025',
    status: 'waiting',
  },
  {
    id: 'L0002',
    orderCode: 'DH002',
    product: 'Quần lử nữ',
    stage: 'May',
    severity: 'minor',
    sentAt: '21/11/2025',
    status: 'in_progress',
  },
];

const severityConfig = {
  minor: { label: 'Lỗi nhẹ', variant: 'warning' },
  major: { label: 'Lỗi nặng', variant: 'danger' },
};

const statusLabel = {
  waiting: 'Chưa xử lý',
  in_progress: 'Đang sửa',
};

const LeaderDefectList = () => {
  const navigate = useNavigate();

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="leader" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-1">Danh Sách Lỗi (Leader)</h5>
                <small className="text-muted">Xem và xử lý các lỗi nhẹ được giao</small>

                <Table hover responsive className="mt-3 mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Mã lỗi</th>
                      <th>Sản phẩm</th>
                      <th>Công đoạn</th>
                      <th>Mức độ</th>
                      <th>Trạng thái</th>
                      <th>Ngày gửi</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEADER_DEFECTS.map((defect) => (
                      <tr key={defect.id}>
                        <td>{defect.id}</td>
                        <td>{defect.product}</td>
                        <td>{defect.stage}</td>
                        <td>
                          <Badge bg={severityConfig[defect.severity].variant}>{severityConfig[defect.severity].label}</Badge>
                        </td>
                        <td>{statusLabel[defect.status]}</td>
                        <td>{defect.sentAt}</td>
                        <td className="d-flex gap-2">
                          <Button size="sm" variant="outline-dark" onClick={() => navigate(`/leader/defects/${defect.id}`)}>
                            Xem chi tiết
                          </Button>
                          {defect.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="dark"
                              onClick={() => navigate(`/leader/orders/${defect.orderCode}/progress`)}
                            >
                              Cập nhật tiến độ
                            </Button>
                          )}
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

export default LeaderDefectList;

