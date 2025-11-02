import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Badge, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';

const QuoteRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rfqs, customers] = await Promise.all([
            quoteService.getAllQuoteRequests(),
            quoteService.getAllCustomers()
        ]);
        
        const customerMap = new Map(customers.map(c => [c.id, c]));

        const transformed = rfqs
          .map(rfq => ({
            ...rfq,
            customer: customerMap.get(rfq.customerId),
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setRequests(transformed);
        const uniqueStatuses = [...new Set(transformed.map(r => r.status))];
        setAvailableStatuses(uniqueStatuses);
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách yêu cầu.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredRequests = useMemo(() => {
    if (!statusFilter) return requests;
    return requests.filter(req => req.status === statusFilter);
  }, [requests, statusFilter]);

  return (
    <div className="internal-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar />
        <div className="flex-grow-1 layout-content" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid className="p-4">
            <h4 className="mb-3">Danh sách Yêu cầu Báo giá</h4>
            
            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="shadow-sm">
                <Card.Header className="bg-white p-3">
                    <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ maxWidth: '250px' }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        {availableStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                        ))}
                    </Form.Select>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table responsive hover className="mb-0 align-middle">
                        <thead className="table-light">
                        <tr>
                            <th className="text-center" style={{width: '5%'}}>#</th>
                            <th>Mã RFQ</th>
                            <th>Khách hàng</th>
                            <th>Ngày tạo</th>
                            <th className="text-center">Số sản phẩm</th>
                            <th>Trạng thái</th>
                            <th className="text-center">Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" /></td></tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-5 text-muted">Không có dữ liệu</td></tr>
                        ) : (
                            filteredRequests.map((req, index) => (
                            <tr key={req.id}>
                                <td className="text-center">{index + 1}</td>
                                <td><div className="fw-semibold">{req.rfqNumber}</div></td>
                                <td>
                                    <div>{req.customer?.contactPerson || 'N/A'}</div>
                                    <div className="small text-muted">{req.customer?.companyName || 'N/A'}</div>
                                </td>
                                <td>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                                <td className="text-center">{req.details?.length || 0}</td>
                                <td><Badge bg="secondary">{req.status}</Badge></td>
                                <td className="text-center">
                                <Button variant="outline-primary" size="sm" onClick={() => navigate(`/internal/rfqs/${req.id}`)}>
                                    <FaEye className="me-1" /> Xem
                                </Button>
                                </td>
                            </tr>
                            ))
                        )}
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

export default QuoteRequests;
