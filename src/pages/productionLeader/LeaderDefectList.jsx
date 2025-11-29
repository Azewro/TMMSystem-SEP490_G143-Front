import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';

const severityConfig = {
  MINOR: { label: 'Lỗi nhẹ', variant: 'warning' },
  MAJOR: { label: 'Lỗi nặng', variant: 'danger' },
};

const statusLabel = {
  PENDING: 'Chưa xử lý',
  IN_PROGRESS: 'Đang sửa',
  RESOLVED: 'Đã xử lý',
};

const LeaderDefectList = () => {
  const navigate = useNavigate();
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDefects();
  }, []);

  const fetchDefects = async () => {
    try {
      setLoading(true);
      // Get userId from sessionStorage (set during login in authService.internalLogin)
      // Fallback to localStorage for backward compatibility
      const leaderUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      const data = await productionService.getLeaderDefects(leaderUserId);
      setDefects(data);
    } catch (err) {
      console.error('Error fetching defects:', err);
      setError('Không thể tải danh sách lỗi');
    } finally {
      setLoading(false);
    }
  };

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

                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p className="mt-2">Đang tải...</p>
                  </div>
                ) : defects.length === 0 ? (
                  <Alert variant="info" className="mt-3">Không có lỗi nào cần xử lý</Alert>
                ) : (
                  <Table hover responsive className="mt-3 mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Mã đơn</th>
                        <th>Công đoạn</th>
                        <th>Hình ảnh</th>
                        <th>Mức độ</th>
                        <th>Mô tả</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {defects.map((defect) => (
                        <tr key={defect.id}>
                          <td>{defect.poNumber || 'N/A'}</td>
                          <td>{defect.stageType || 'N/A'}</td>
                          <td>
                            {defect.evidencePhoto ? (
                              <span className="text-primary" title="Có hình ảnh">
                                <i className="bi bi-image"></i> 📷
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <Badge bg={severityConfig[defect.severity]?.variant || 'secondary'}>
                              {severityConfig[defect.severity]?.label || defect.severity}
                            </Badge>
                          </td>
                          <td>{defect.description || 'Không có mô tả'}</td>
                          <td>{statusLabel[defect.status] || defect.status}</td>
                          <td className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => navigate(`/leader/orders/${defect.orderId}/progress`, {
                                state: {
                                  defectId: defect.id,
                                  severity: defect.severity
                                }
                              })}
                            >
                              Tạm dừng và sửa lỗi
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default LeaderDefectList;
