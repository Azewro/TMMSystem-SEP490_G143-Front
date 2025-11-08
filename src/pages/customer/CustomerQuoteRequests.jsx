import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { rfqService } from '../../api/rfqService';
import { useNavigate } from 'react-router-dom';
import '../../styles/CustomerQuoteRequests.css';

const CustomerQuoteRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomerRfqs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await rfqService.getRfqs({ customerId: user.customerId });
      const sortedData = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRfqs(sortedData);
    } catch (err) {
      setError('Lỗi khi tải danh sách yêu cầu báo giá.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.customerId) {
      fetchCustomerRfqs();
    } else if (!user) {
      setLoading(false);
      setError('Bạn cần đăng nhập để xem các yêu cầu báo giá.');
    }
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'SENT': return 'info';
      case 'QUOTED': return 'primary';
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'light';
    }
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1 p-4 customer-quote-requests-page" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Yêu cầu báo giá của tôi</h2>
            <Card>
              <Card.Header>
                Danh sách các yêu cầu báo giá đã tạo
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center"><Spinner animation="border" /></div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Mã RFQ</th>
                        <th>Ngày Tạo</th>
                        <th>Trạng Thái</th>
                        <th>Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfqs.length > 0 ? rfqs.map(rfq => {
                        const rfqStatus = rfq.status || 'DRAFT'; // Default to DRAFT
                        return (
                          <tr key={rfq.id}>
                            <td>{rfq.id}</td>
                            <td>{new Date(rfq.createdAt).toLocaleDateString()}</td>
                            <td><Badge bg={getStatusBadge(rfqStatus)}>{rfqStatus}</Badge></td>
                            <td>
                              <Button variant="info" size="sm" onClick={() => navigate(`/customer/quotations/${rfq.id}`)}>
                                Xem chi tiết
                              </Button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan="4" className="text-center">Bạn chưa có yêu cầu báo giá nào.</td>
                        </tr>
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

export default CustomerQuoteRequests;
