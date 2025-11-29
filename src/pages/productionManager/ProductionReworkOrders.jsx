import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Form, Tab, Tabs, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import api from '../../api/apiConfig';
import MaterialRequestApprovalModal from '../../components/production/MaterialRequestApprovalModal';
import { toast } from 'react-hot-toast';

const statusConfig = {
  WAITING_PRODUCTION: { label: 'Chờ sản xuất', variant: 'secondary' },
  IN_PROGRESS: { label: 'Đang sản xuất', variant: 'primary' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  PENDING: { label: 'Chờ xử lý', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
};

const ProductionReworkOrders = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [reworkOrders, setReworkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Pending Material Requests
      const reqResponse = await api.get('/execution/material-requisitions?status=PENDING');
      setRequests(reqResponse.data);

      // Fetch Rework Orders (Assuming we can filter by type or just fetch all and filter client side)
      // For now fetching all orders and filtering by "-REWORK" in poNumber
      const orderResponse = await api.get('/production/manager/orders');
      const reworks = orderResponse.data.filter(o => o.poNumber && o.poNumber.includes('-REWORK'));
      setReworkOrders(reworks);

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
            <h4 className="mb-4">Quản lý Sản xuất Bổ sung & Cấp vật tư</h4>

            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
              <Tab eventKey="requests" title={`Yêu cầu cấp vật tư (${requests.length})`}>
                <Card className="shadow-sm">
                  <Card.Body>
                    {loading ? <Spinner animation="border" /> : (
                      <Table hover responsive className="align-middle">
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
                                <td>{req.stageName || req.productionStage?.stageType}</td>
                                <td>{req.requestedBy?.fullName || 'N/A'}</td>
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
              </Tab>

              <Tab eventKey="orders" title={`Lệnh sản xuất bổ sung (${reworkOrders.length})`}>
                <Card className="shadow-sm">
                  <Card.Body>
                    {loading ? <Spinner animation="border" /> : (
                      <Table hover responsive className="align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Mã lệnh</th>
                            <th>Sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Ngày bắt đầu</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reworkOrders.length === 0 ? (
                            <tr><td colSpan="6" className="text-center">Không có lệnh bổ sung nào</td></tr>
                          ) : (
                            reworkOrders.map(order => (
                              <tr key={order.id}>
                                <td>{order.poNumber}</td>
                                <td>{order.productName || 'N/A'}</td>
                                <td>{order.totalQuantity?.toLocaleString('vi-VN')}</td>
                                <td>{order.plannedStartDate}</td>
                                <td>
                                  <Badge bg={statusConfig[order.executionStatus]?.variant || 'secondary'}>
                                    {statusConfig[order.executionStatus]?.label || order.executionStatus}
                                  </Badge>
                                </td>
                                <td>
                                  <Button size="sm" variant="outline-dark" onClick={() => navigate(`/production/orders/${order.id}`)}>
                                    Chi tiết
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
              </Tab>
            </Tabs>

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

export default ProductionReworkOrders;

