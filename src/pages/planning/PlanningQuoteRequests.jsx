import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Button, Badge, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import PlanningSidebar from '../../components/common/PlanningSidebar';
import { quoteService } from '../../api/quoteService';

const STATUS_DISPLAY = {
  FORWARDED_TO_PLANNING: { label: 'FORWARDED_TO_PLANNING', variant: 'warning' },
  RECEIVED_BY_PLANNING: { label: 'RECEIVED_BY_PLANNING', variant: 'info' },
  QUOTED: { label: 'QUOTED', variant: 'success' }
};

const PlanningQuoteRequests = () => {
  const navigate = useNavigate();
  const [rfqRequests, setRfqRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlanningRFQs = async () => {
      setLoading(true);
      setError('');

      try {
        const [rfqs, customers] = await Promise.all([
          quoteService.getAllQuoteRequests(),
          quoteService.getAllCustomers()
        ]);

        const customerMap = new Map(customers.map(c => [c.id, c]));

        const filtered = rfqs
          .filter(rfq => ['FORWARDED_TO_PLANNING', 'RECEIVED_BY_PLANNING', 'QUOTED'].includes(rfq.status))
          .map(rfq => {
            const customer = customerMap.get(rfq.customerId) || {};
            return {
              ...rfq,
              customerName: customer.contactPerson || customer.fullName || '—',
              statusInfo: STATUS_DISPLAY[rfq.status] || { label: rfq.status, variant: 'dark' },
            };
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setRfqRequests(filtered);
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách yêu cầu báo giá. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanningRFQs();
  }, []);

  const filteredRequests = useMemo(() => {
    if (!statusFilter) return rfqRequests;
    return rfqRequests.filter(r => r.status === statusFilter);
  }, [rfqRequests, statusFilter]);

  return (
    <div className="planning-layout">
      <Header />

      <div className="d-flex">
        <PlanningSidebar />

        <div className="flex-grow-1 layout-content" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid className="p-4">
            <h4 className="mb-3">Yêu cầu báo giá chờ xử lý</h4>
            
            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="shadow-sm">
                <Card.Header className="bg-white p-3">
                    <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ maxWidth: '250px' }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(STATUS_DISPLAY).map(([value, { label }]) => (
                        <option key={value} value={value}>{label}</option>
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
                                <td>{req.customerName}</td>
                                <td>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                                <td className="text-center">{req.details?.length || 0}</td>
                                <td><Badge bg={req.statusInfo.variant}>{req.statusInfo.label}</Badge></td>
                                <td className="text-center">
                                <Button variant="outline-primary" size="sm" onClick={() => navigate(`/planning/rfqs/${req.id}`)}>
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

export default PlanningQuoteRequests;
