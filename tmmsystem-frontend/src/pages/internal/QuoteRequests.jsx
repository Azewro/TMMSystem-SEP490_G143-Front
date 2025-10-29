import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import '../../styles/QuoteRequests.css';
import { quoteService } from '../../api/quoteService';

const STATUS_DISPLAY = {
  DRAFT: { label: 'Chờ xử lý', variant: 'secondary' },
  SENT: { label: 'Đã gửi khách hàng', variant: 'info' },
  PRELIMINARY_CHECKED: { label: 'Đã kiểm tra sơ bộ', variant: 'primary' },
  FORWARDED_TO_PLANNING: { label: 'Đã chuyển kế hoạch', variant: 'warning' },
  RECEIVED_BY_PLANNING: { label: 'Kế hoạch đã nhận', variant: 'warning' },
  QUOTED: { label: 'Đã tạo báo giá', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'danger' }
};

const QuoteRequests = () => {
  const navigate = useNavigate();
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const rfqs = await quoteService.getAllQuoteRequests();
        const customers = await quoteService.getAllCustomers();
        const customerMap = Object.fromEntries(customers.map(c => [c.id, c]));

        const transformed = rfqs
          .filter(rfq => Boolean(rfq?.id))
          .map((rfq) => {
            const customer = customerMap[rfq.customerId] || {};
            const createdAt = rfq.createdAt ? new Date(rfq.createdAt) : null;
            return {
              id: rfq.id,
              rawStatus: rfq.status,
              rfqCode: rfq.rfqNumber || `RFQ-${rfq.id}`,
              customerName: customer.contactPerson || customer.fullName || customer.name || `Khách hàng ${rfq.customerId}`,
              company: customer.companyName || customer.company || customer.businessName || '—',
              createdAt,
              createdDate: createdAt ? createdAt.toLocaleDateString('vi-VN') : '—',
              productCount: rfq.details?.length || 0,
              status: STATUS_DISPLAY[rfq.status] || STATUS_DISPLAY.DRAFT,
            };
          })
          .sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.getTime() - a.createdAt.getTime();
          });

        setQuoteRequests(transformed);
      } catch (err) {
        console.error('Load RFQs failed', err);
        setError(err.message || 'Không thể tải danh sách yêu cầu báo giá');
        setQuoteRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRequests = useMemo(() => {
    if (!statusFilter) return quoteRequests;
    return quoteRequests.filter(req => req.rawStatus === statusFilter);
  }, [quoteRequests, statusFilter]);

  const handleViewDetails = (request) => {
    navigate(`/internal/rfqs/${request.id}`);
  };

  return (
    <div className="internal-layout">
      <Header />

      <div className="d-flex">
        <InternalSidebar />

        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="quote-requests-dashboard">
              <div className="dashboard-header mb-4">
                <h1 className="dashboard-title">Danh sách Yêu cầu Báo giá</h1>
              </div>

              {error && (
                <Alert variant="danger" className="mb-3" onClose={() => setError('')} dismissible>
                  {error}
                </Alert>
              )}

              <Row className="mb-4">
                <Col md={4} lg={3}>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="status-filter"
                  >
                    <option value="">Tất cả trạng thái</option>
                    {Object.entries(STATUS_DISPLAY).map(([value, { label }]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              <Card className="quote-table-card shadow-sm">
                <Card.Body className="p-0">
                  <Table responsive hover className="quote-requests-table mb-0">
                    <thead className="table-header">
                      <tr>
                        <th style={{ width: '50px' }}>#</th>
                        <th style={{ width: '150px' }}>Mã RFQ</th>
                        <th style={{ width: '200px' }}>Người đại diện</th>
                        <th style={{ width: '200px' }}>Công ty</th>
                        <th style={{ width: '140px' }}>Ngày tạo</th>
                        <th style={{ width: '160px' }}>Số dòng sản phẩm</th>
                        <th style={{ width: '160px' }}>Trạng thái</th>
                        <th style={{ width: '120px' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            <Spinner animation="border" size="sm" className="me-2" />
                            Đang tải dữ liệu...
                          </td>
                        </tr>
                      ) : filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4 text-muted">
                            {statusFilter ? 'Không có yêu cầu trong trạng thái này' : 'Chưa có yêu cầu báo giá nào'}
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((request, index) => (
                          <tr key={request.id}>
                            <td>{index + 1}</td>
                            <td><span className="rfq-code">{request.rfqCode}</span></td>
                            <td>{request.customerName}</td>
                            <td>{request.company}</td>
                            <td>{request.createdDate}</td>
                            <td className="text-center">{request.productCount}</td>
                            <td>
                              <Badge bg={request.status.variant} className="status-badge">
                                {request.status.label}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                                className="detail-button"
                                title="Chi tiết"
                              >
                                <FaEye />
                                <span className="ms-1">Chi tiết</span>
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <div className="pagination-info mt-3">
                <small className="text-muted">
                  Hiển thị {filteredRequests.length} / {quoteRequests.length} yêu cầu báo giá
                </small>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QuoteRequests;
