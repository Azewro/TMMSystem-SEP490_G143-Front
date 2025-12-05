import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import api from '../../api/apiConfig';
import { toast } from 'react-hot-toast';
import { getStageTypeName } from '../../utils/statusMapper';

const severityConfig = {
  MINOR: { label: 'Lỗi nhẹ', variant: 'warning' },
  MAJOR: { label: 'Lỗi nặng', variant: 'danger' },
};

const statusConfig = {
  PENDING: { label: 'Chờ xử lý', variant: 'warning' },
  PROCESSED: { label: 'Đã xử lý', variant: 'success' },
  IN_PROGRESS: { label: 'Đang xử lý', variant: 'primary' },
  WAITING_REWORK: { label: 'Chờ sửa', variant: 'info' },
  REWORK_IN_PROGRESS: { label: 'Đang sửa', variant: 'primary' },
  WAITING_MATERIAL: { label: 'Chờ vật tư', variant: 'danger' }
};

const TechnicalDefectList = () => {
  const navigate = useNavigate();
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/v1/production/tech/defects');
      setDefects(response.data);
    } catch (error) {
      console.error("Error fetching defects:", error);
      toast.error("Không thể tải danh sách lỗi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

                {loading ? <Spinner animation="border" /> : (
                  <Table hover responsive className="mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Mã lô</th>
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
                      {defects.length === 0 ? (
                        <tr><td colSpan="8" className="text-center">Không có lỗi nào</td></tr>
                      ) : (
                        defects.map((defect) => {
                          const severity = severityConfig[defect.severity] || { label: defect.severity, variant: 'secondary' };
                          const status = statusConfig[defect.status] || { label: defect.status, variant: 'secondary' };
                          return (
                            <tr key={defect.id}>
                              <td>{defect.poNumber}</td>
                              <td>{defect.productName || 'N/A'}</td>
                              <td>{defect.size || 'N/A'}</td>
                              <td>{getStageTypeName(defect.stageType)}</td>
                              <td>
                                <Badge bg={severity.variant}>{severity.label}</Badge>
                              </td>
                              <td>
                                <Badge bg={status.variant}>{status.label}</Badge>
                              </td>
                              <td>{defect.createdAt ? new Date(defect.createdAt).toLocaleDateString('vi-VN') : ''}</td>
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
                        })
                      )}
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

export default TechnicalDefectList;
