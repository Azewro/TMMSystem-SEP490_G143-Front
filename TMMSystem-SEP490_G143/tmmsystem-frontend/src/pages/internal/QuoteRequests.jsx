import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import '../../styles/QuoteRequests.css';
import { quoteService } from '../../api/quoteService';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS = {
  DRAFT: { label: 'Chờ xử lý', color: 'warning' },
  SENT: { label: 'Đã gửi', color: 'primary' },
  RECEIVED_BY_PLANNING: { label: 'Đã chuyển kế hoạch', color: 'info' },
  QUOTED: { label: 'Đã báo giá', color: 'secondary' },
  APPROVED: { label: 'Đã duyệt', color: 'success' },
  REJECTED: { label: 'Từ chối', color: 'danger' }
};

const statusOptions = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Chờ xử lý' },
  { value: 'SENT', label: 'Đã gửi' },
  { value: 'RECEIVED_BY_PLANNING', label: 'Đã chuyển kế hoạch' },
  { value: 'QUOTED', label: 'Đã báo giá' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' }
];

const QuoteRequests = () => {
  const navigate = useNavigate();
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const [rfqs, customers] = await Promise.all([
          quoteService.getAllQuoteRequests(),
          quoteService.getAllCustomers()
        ]);

        const customerMap = new Map();
        customers.forEach((customer) => customerMap.set(customer.id, customer));

        const enrichedRfqs = rfqs.map((rfq) => {
          const customer = customerMap.get(rfq.customerId);
          return {
            id: rfq.id,
            code: rfq.rfqNumber || `RFQ-${rfq.id}`,
            customerName: customer?.contactPerson || `Khách hàng #${rfq.customerId}`,
            company: customer?.companyName || customer?.businessName || '—',
            createdDate: rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString('vi-VN') : '—',
            itemCount: rfq.details?.length || 0,
            status: rfq.status
          };
        });

        setQuoteRequests(enrichedRfqs.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)));
      } catch (err) {
        console.error('Failed to load quote requests', err);
        setError(err.message || 'Không thể tải danh sách yêu cầu báo giá.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'ALL') return quoteRequests;
    return quoteRequests.filter((request) => request.status === statusFilter);
  }, [quoteRequests, statusFilter]);

  const handleViewDetails = (request) => {
    navigate(`/internal/rfq/${request.id}`);
  };

  return (
    <div className="internal-layout">
      <Header />

      <div className="d-flex">
        <InternalSidebar />

        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="quote-requests-dashboard">
              <div className="dashboard-header mb-4 d-flex justify-content-between align-items-center">
                <h1 className="dashboard-title mb-0">Danh sách yêu cầu báo giá</h1>

                <Form.Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  style={{ width: 240 }}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </div>

              {error && (
                <Alert variant="danger" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}

              <Card className="quote-table-card shadow-sm">
                <Card.Body className="p-0">
                  <Table responsive hover className="quote-requests-table mb-0">
                    <thead className="table-header">
                      <tr>
                        <th style={{ width: '60px' }}>#</th>
                        <th style={{ width: '160px' }}>Mã RFQ</th>
                        <th>Khách hàng</th>
                        <th style={{ width: '220px' }}>Công ty</th>
                        <th style={{ width: '140px' }}>Ngày tạo</th>
                        <th style={{ width: '120px' }} className="text-center">Số sản phẩm</th>
                        <th style={{ width: '160px' }}>Trạng thái</th>
                        <th style={{ width: '120px' }} className="text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="text-center py-4">
                            <Spinner animation="border" size="sm" className="me-2" /> Đang tải dữ liệu...
                          </td>
                        </tr>
                      ) : filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-4 text-muted">
                            {statusFilter === 'ALL' ? 'Chưa có yêu cầu báo giá nào.' : 'Không có yêu cầu nào ở trạng thái này.'}
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((request, index) => {
                          const statusConfig = STATUS_LABELS[request.status] || STATUS_LABELS.DRAFT;
                          return (
                            <tr key={request.id}>
                              <td>{index + 1}</td>
                              <td className="fw-semibold">{request.code}</td>
                              <td>{request.customerName}</td>
                              <td>{request.company}</td>
                              <td>{request.createdDate}</td>
                              <td className="text-center">{request.itemCount}</td>
                              <td>
                                <Badge bg={statusConfig.color}>{statusConfig.label}</Badge>
                              </td>
                              <td className="text-center">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleViewDetails(request)}
                                >
                                  <FaEye className="me-2" /> Chi tiết
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QuoteRequests;
