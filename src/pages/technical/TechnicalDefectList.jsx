import React from 'react';
import { Container, Card, Table, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const MOCK_DEFECTS = [
  {
    id: 'L0001',
    product: 'Áo sơ mi nam',
    size: 'L',
    stage: 'Dệt',
    severity: 'minor',
    status: 'pending',
    sentAt: '20/11/2025',
  },
  {
    id: 'L0002',
    product: 'Quần lử nữ',
    size: 'M',
    stage: 'Nhuộm',
    severity: 'major',
    status: 'pending',
    sentAt: '20/11/2025',
  },
];

const severityConfig = {
  minor: { label: 'Lỗi nhẹ', variant: 'warning' },
  major: { label: 'Lỗi nặng', variant: 'danger' },
};

const statusConfig = {
  pending: { label: 'Chờ xử lý', variant: 'warning' },
  resolved: { label: 'Đã xử lý', variant: 'success' },
};

const TechnicalDefectList = () => {
  const navigate = useNavigate();

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="technical" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                  <div>
                    <h5 className="mb-1">Danh Sách Lỗi (Tech)</h5>
                    <small className="text-muted">Quản lý và xử lý các lỗi từ KSC</small>
                  </div>
                </div>

                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Mã lỗi</th>
                      <th>Sản phẩm</th>
                      <th>Kích thước</th>
                      <th>Công đoạn lỗi</th>
                      <th>Mức độ</th>
                      <th>Trạng thái</th>
                      <th>Ngày gửi</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_DEFECTS.map((defect) => {
                      const severity = severityConfig[defect.severity];
                      const status = statusConfig[defect.status];
                      return (
                        <tr key={defect.id}>
                          <td>{defect.id}</td>
                          <td>{defect.product}</td>
                          <td>{defect.size}</td>
                          <td>{defect.stage}</td>
                          <td>
                            <Badge bg={severity.variant}>{severity.label}</Badge>
                          </td>
                          <td>
                            <Badge bg={status.variant}>{status.label}</Badge>
                          </td>
                          <td>{defect.sentAt}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-dark"
                              onClick={() => navigate(`/technical/defects/${defect.id}`)}
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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

export default TechnicalDefectList;

