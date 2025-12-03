import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quotationService } from '../../api/quotationService';
import { userService } from '../../api/userService';
import { customerService } from '../../api/customerService';
import { orderService } from '../../api/orderService';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import { getSalesQuoteStatus } from '../../utils/statusMapper';

const formatCurrency = (amount) => {
  if (!amount) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const QuotesList = () => {
  const navigate = useNavigate();
  const [allQuotes, setAllQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search, Filter and Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const fetchAndEnrichQuotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const page = currentPage - 1;
      const [quotesResponse, customersData, usersData] = await Promise.all([
        quotationService.getSalesQuotations(page, ITEMS_PER_PAGE, searchTerm || undefined, statusFilter || undefined),
        customerService.getAllCustomers(),
        userService.getAllUsers(0, 1000)
      ]);

      let quotesData = [];
      if (quotesResponse && quotesResponse.content) {
        quotesData = quotesResponse.content;
        setTotalPages(quotesResponse.totalPages || 1);
        setTotalElements(quotesResponse.totalElements || 0);
      } else if (Array.isArray(quotesResponse)) {
        quotesData = quotesResponse;
        setTotalPages(1);
        setTotalElements(quotesResponse.length);
      }

      // Filter by created date (client-side)
      if (createdDateFilter) {
        quotesData = quotesData.filter(quote => {
          if (!quote.createdAt) return false;
          const quoteDate = new Date(quote.createdAt).toISOString().split('T')[0];
          return quoteDate === createdDateFilter;
        });
      }

      let usersArray = [];
      if (usersData && usersData.content) {
        usersArray = usersData.content;
      } else if (Array.isArray(usersData)) {
        usersArray = usersData;
      }

      let customersArray = [];
      if (customersData && customersData.content) {
        customersArray = customersData.content;
      } else if (Array.isArray(customersData)) {
        customersArray = customersData;
      }

      if (Array.isArray(customersArray) && Array.isArray(usersArray)) {
        const customerMap = new Map();
        customersArray.forEach(c => {
          if (c.id != null) {
            customerMap.set(c.id, c);
            customerMap.set(String(c.id), c);
            customerMap.set(Number(c.id), c);
          }
        });

        const userMap = new Map();
        usersArray.forEach(u => {
          if (u.id != null) {
            userMap.set(u.id, u);
            userMap.set(String(u.id), u);
            userMap.set(Number(u.id), u);
          }
        });

        const enrichedQuotes = quotesData.map(quote => {
          const customer = customerMap.get(quote.customerId)
            || customerMap.get(String(quote.customerId))
            || customerMap.get(Number(quote.customerId));

          const creator = userMap.get(quote.createdById)
            || userMap.get(String(quote.createdById))
            || userMap.get(Number(quote.createdById));

          return {
            ...quote,
            customer: customer,
            creator: creator
          };
        });

        setAllQuotes(enrichedQuotes);
      } else {
        setAllQuotes(quotesData);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setError('Không thể tải danh sách báo giá: ' + (e?.message || 'Lỗi không xác định'));
      toast.error('Không thể tải danh sách báo giá');
      setAllQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, createdDateFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, createdDateFilter]);

  useEffect(() => {
    fetchAndEnrichQuotes();
  }, [fetchAndEnrichQuotes, currentPage]);

  const handleViewDetail = (quote) => {
    navigate(`/sales/quotations/${quote.id}`);
  };

  const handleViewOrder = async (quote) => {
    try {
      // First check if quote has orderId directly
      if (quote.orderId) {
        navigate(`/internal/orders/${quote.orderId}`);
        return;
      }

      // If not, try to find order by quotation ID
      const allOrders = await orderService.getAllOrders();
      const order = allOrders.find(o => o.quotationId === quote.id || (o.quotation && o.quotation.id === quote.id));

      if (order) {
        navigate(`/internal/orders/${order.id}`);
      } else {
        toast.error('Không tìm thấy đơn hàng cho báo giá này');
      }
    } catch (error) {
      console.error('Error finding order:', error);
      toast.error('Lỗi khi tìm đơn hàng');
    }
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="sales" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Danh sách Báo giá</h2>

            {/* Search and Filter Section - Matching MyRfqs.jsx */}
            <Card className="mb-3">
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Tìm kiếm</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Tìm kiếm theo mã báo giá..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo ngày tạo</Form.Label>
                      <Form.Control
                        type="date"
                        value={createdDateFilter}
                        onChange={(e) => {
                          setCreatedDateFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo trạng thái</Form.Label>
                      <Form.Select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="">Tất cả trạng thái</option>
                        <option value="WAITING_QUOTE">Chờ báo giá</option>
                        <option value="RECEIVED">Đã nhận</option>
                        <option value="SENT">Chờ phê duyệt</option>
                        <option value="ACCEPTED">Đã duyệt</option>
                        <option value="REJECTED">Từ chối</option>
                        <option value="CANCELED">Đã hủy</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                Danh sách các báo giá
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center"><Spinner animation="border" /></div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Mã báo giá</th>
                          <th>Khách hàng</th>
                          <th>Người tạo</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                          <th style={{ width: 200 }} className="text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allQuotes.length > 0 ? allQuotes.map(quote => {
                          const statusObj = getSalesQuoteStatus(quote.status, quote);
                          return (
                            <tr key={quote.id}>
                              <td className="fw-semibold text-primary">
                                {quote.quotationNumber || `QUOTE-${quote.id}`}
                              </td>
                              <td>
                                {quote.customer
                                  ? (quote.customer.contactPerson || quote.customer.companyName || '—')
                                  : (quote.customerId ? `[ID: ${quote.customerId}]` : '—')
                                }
                              </td>
                              <td>
                                {quote.creator?.name || '—'}
                                <br />
                                <small className="text-muted">
                                  Role: {quote.creator?.role?.name || quote.creator?.roleName || 'N/A'}
                                </small>
                              </td>
                              <td className="text-success fw-semibold">
                                {formatCurrency(quote.totalAmount)}
                              </td>
                              <td>
                                <Badge bg={statusObj.variant} className="px-2 py-1">
                                  {statusObj.label}
                                </Badge>
                              </td>
                              <td className="text-center">
                                <div className="d-flex justify-content-center gap-2">
                                  {/* Logic hiển thị nút theo yêu cầu */}
                                  {statusObj.value === 'WAITING_QUOTE' && (
                                    // Chờ báo giá: Không có nút
                                    null
                                  )}

                                  {(statusObj.value === 'RECEIVED' || statusObj.value === 'SENT') && (
                                    // Đã nhận hoặc Chờ phê duyệt: Xem chi tiết
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => handleViewDetail(quote)}
                                    >
                                      Xem chi tiết
                                    </Button>
                                  )}

                                  {statusObj.value === 'ACCEPTED' && (
                                    // Đã duyệt: Xem chi tiết + Xem đơn hàng
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline-primary"
                                        onClick={() => handleViewDetail(quote)}
                                      >
                                        Xem chi tiết
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => handleViewOrder(quote)}
                                      >
                                        Xem đơn hàng
                                      </Button>
                                    </>
                                  )}

                                  {/* Fallback cho các trạng thái khác (nếu có) */}
                                  {['WAITING_QUOTE', 'RECEIVED', 'SENT', 'ACCEPTED'].indexOf(statusObj.value) === -1 && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => handleViewDetail(quote)}
                                    >
                                      Chi tiết
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="6" className="text-center">
                              {totalElements === 0
                                ? 'Chưa có báo giá nào.'
                                : 'Không tìm thấy báo giá phù hợp với bộ lọc.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QuotesList;