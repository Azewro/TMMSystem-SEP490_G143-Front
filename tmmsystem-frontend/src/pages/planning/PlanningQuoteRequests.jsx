import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Table, Button, Badge, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import PlanningSidebar from '../../components/common/PlanningSidebar';
import { quoteService } from '../../api/quoteService';
import '../../styles/PlanningQuoteRequests.css';

const STATUS_DISPLAY = {
  FORWARDED_TO_PLANNING: { label: 'Chờ xác nhận', variant: 'warning' },
  RECEIVED_BY_PLANNING: { label: 'Đã nhận', variant: 'info' },
  QUOTED: { label: 'Đã báo giá', variant: 'success' }
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

        const customerMap = Object.fromEntries(customers.map(c => [c.id, c]));

        const filtered = rfqs
          .filter(rfq => ['FORWARDED_TO_PLANNING', 'RECEIVED_BY_PLANNING', 'QUOTED'].includes(rfq.status))
          .map(rfq => {
            const customer = customerMap[rfq.customerId] || {};
            const createdAt = rfq.createdAt ? new Date(rfq.createdAt) : null;
            return {
              id: rfq.id,
              status: rfq.status,
              rfqCode: rfq.rfqNumber || `RFQ-${rfq.id}`,
              productCount: rfq.details?.length || 0,
              createdAt,
              createdDate: createdAt ? createdAt.toLocaleDateString('vi-VN') : '—',
              customerName: customer.contactPerson || customer.fullName || '—'
            };
          })
          .sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.getTime() - a.createdAt.getTime();
          });

        setRfqRequests(filtered);
      } catch (err) {
        console.error('Error fetching planning RFQs:', err);
        setError(err.message || 'Không thể tải danh sách yêu cầu báo giá. Vui lòng thử lại.');
        setRfqRequests([]);
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

  const handleViewDetails = (request) => {
    navigate(`/planning/rfqs/${request.id}`);
  };

  return (
    <div className="planning-layout">
      <Header />

      <div className="d-flex">
        <PlanningSidebar />

        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="planning-quote-requests-page">
              <div className="page-header mb-4">
                <Row className="align-items-center">
                  <Col>
                    <h1 className="page-title mb-0">RFQ chờ xử lý</h1>
                  </Col>
                  <Col xs="auto">
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="status-filter"
                      style={{ width: '220px' }}
                    >
                      <option value="">Tất cả trạng thái</option>
                      {Object.entries(STATUS_DISPLAY).map(([value, { label }]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>
              </div>

              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <div className="table-card bg-white rounded shadow-sm">
                <Table responsive className="planning-rfq-table mb-0">
                  <thead className="table-header">
                    <tr>
                      <th className="text-center" style={{ width: '80px' }}>#</th>
                      <th style={{ width: '150px' }}>Mã RFQ</th>
                      <th className="text-center" style={{ width: '120px' }}>Số lượng dòng</th>
                      <th className="text-center" style={{ width: '150px' }}>Ngày tạo</th>
                      <th style={{ minWidth: '200px' }}>Khách hàng</th>
                      <th className="text-center" style={{ width: '180px' }}>Trạng thái</th>
                      <th className="text-center" style={{ width: '100px' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <Spinner animation="border" size="sm" className="me-2" />
                          Đang tải dữ liệu...
                        </td>
                      </tr>
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          {statusFilter ? 'Không có RFQ trong trạng thái này' : 'Chưa có RFQ nào được chuyển tới'}
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request, index) => {
                        const display = STATUS_DISPLAY[request.status] || STATUS_DISPLAY.FORWARDED_TO_PLANNING;
                        return (
                          <tr key={request.id} className="table-row">
                            <td className="text-center fw-bold">{index + 1}</td>
                            <td><span className="rfq-code">{request.rfqCode}</span></td>
                            <td className="text-center">{request.productCount}</td>
                            <td className="text-center">{request.createdDate}</td>
                            <td>{request.customerName}</td>
                            <td className="text-center">
                              <Badge bg={display.variant} className="status-badge">{display.label}</Badge>
                            </td>
                            <td className="text-center">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                                className="view-button"
                              >
                                <FaEye className="me-1" /> Xem
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default PlanningQuoteRequests;
