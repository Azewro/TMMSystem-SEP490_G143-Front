import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import api from '../../api/apiConfig';
import MaterialRequestApprovalModal from '../../components/production/MaterialRequestApprovalModal';
import { toast } from 'react-hot-toast';

const ProductionFiberRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Pending Material Requests
      const reqResponse = await api.get('/v1/execution/material-requisitions?status=PENDING');
      setRequests(reqResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveClick = (req) => {
    setSelectedRequest(req);
    setShowModal(true);
  };

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

                {loading ? <Spinner animation="border" /> : (
                  <Table hover responsive className="mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Mã YC</th>
                        <th>Công đoạn</th>
                        <th>Người yêu cầu</th>
                        <th>Ghi chú</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.length === 0 ? (
                        <tr><td colSpan="6" className="text-center">Không có yêu cầu nào</td></tr>
                      ) : (
                        requests.map(req => (
                          <tr key={req.id}>
                            <td>{req.requisitionNumber}</td>
                            <td>{req.stageType || req.stageName}</td>
                            <td>{req.requestedByName || req.requestedBy?.fullName || 'N/A'}</td>
                            <td>{req.notes}</td>
                            <td><Badge bg="warning">Chờ duyệt</Badge></td>
                            <td>
                              <Button size="sm" variant="primary" onClick={() => handleApproveClick(req)}>
                                Xem & Duyệt
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>

            <MaterialRequestApprovalModal
              show={showModal}
              onHide={() => setShowModal(false)}
              request={selectedRequest}
              onSuccess={fetchData}
            />
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionFiberRequests;

