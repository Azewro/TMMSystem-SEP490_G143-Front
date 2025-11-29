import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaEye, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { quotationService } from '../../api/quotationService';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import { getCustomerQuoteStatus } from '../../utils/statusMapper';
import '../../styles/CustomerQuoteRequests.css';

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
};

const formatCurrency = (amount) => {
  if (!amount) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const CustomerQuotations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customerId = user?.customerId;

  const [allQuotes, setAllQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' or 'validUntil'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [selectedDate, setSelectedDate] = useState(''); // For date-based sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const fetchCustomerQuotes = useCallback(async () => {
    if (!customerId) {
      setError('Không tìm thấy thông tin khách hàng.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Normalize search term: trim and replace multiple spaces with single space
      const normalizedSearch = debouncedSearchTerm
        ? debouncedSearchTerm.trim().replace(/\s+/g, ' ')
        : undefined;

      // Convert 1-based page to 0-based for backend
      const page = currentPage - 1;

      // Prepare sort parameters
      let finalSortBy = sortBy;
      let finalSortOrder = sortOrder;

      // If sorting by date and a specific date is selected, backend will handle it
      // For now, we just pass sortBy and sortOrder to backend

      const response = await quotationService.getCustomerQuotations(
        customerId,
        page,
        ITEMS_PER_PAGE,
        normalizedSearch,
        statusFilter || undefined,
        finalSortBy,
        finalSortOrder,
        selectedDate || undefined
      );

      // Handle PageResponse
      let quotes = [];
      if (response && response.content) {
        quotes = response.content;
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        quotes = response;
        setTotalPages(1);
        setTotalElements(response.length);
      }

      // Filter out DRAFT quotes (backend should handle this, but keep as safety)
      const filteredData = quotes.filter(quote => quote.status !== 'DRAFT');

      setAllQuotes(filteredData);
    } catch (e) {
      setError(e.message || 'Không thể tải báo giá của bạn');
      toast.error(e.message || 'Không thể tải báo giá của bạn');
    } finally {
      setLoading(false);
    }
  }, [customerId, currentPage, debouncedSearchTerm, statusFilter, sortBy, sortOrder, selectedDate]);

  // Debounce search term
  useEffect(() => {
    // If searchTerm is empty, update debouncedSearchTerm immediately
    // Otherwise, wait 500ms after user stops typing
    if (!searchTerm || searchTerm.trim() === '') {
      setDebouncedSearchTerm('');
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Reset to page 1 when filters or search change
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, sortBy, sortOrder, selectedDate]);

  useEffect(() => {
    fetchCustomerQuotes();
  }, [fetchCustomerQuotes]);

  const handleViewDetail = (quoteId) => {
    navigate(`/customer/quotations/${quoteId}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Note: Search is now server-side, no client-side filtering needed

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1 p-4 customer-quote-requests-page" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Danh sách báo giá của bạn</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Search and Filter */}
            <Card className="mb-3">
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Tìm theo mã báo giá..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="SENT">Đã gửi</option>
                      <option value="ACCEPTED">Đã chấp nhận</option>
                      <option value="REJECTED">Đã từ chối</option>
                      <option value="EXPIRED">Hết hạn</option>
                      <option value="CANCELED">Đã hủy</option>
                      <option value="ORDER_CREATED">Đã tạo đơn hàng</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="createdAt">Sắp xếp theo ngày tạo</option>
                      <option value="validUntil">Sắp xếp theo ngày giao hàng</option>
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Select
                      value={sortOrder}
                      onChange={(e) => {
                        setSortOrder(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="desc">Giảm dần</option>
                      <option value="asc">Tăng dần</option>
                    </Form.Select>
                  </Col>
                  {sortBy === 'validUntil' && (
                    <Col md={3}>
                      <Form.Control
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Chọn ngày"
                      />
                    </Col>
                  )}
                </Row>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                Danh sách các báo giá đã nhận
              </Card.Header>
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center p-5"><Spinner animation="border" /></div>
                ) : (
                  <>
                    <Table striped bordered hover responsive className="mb-0">
                      <thead>
                        <tr>
                          <th>Mã báo giá</th>
                          <th>Ngày giao dự kiến</th>
                          <th>Tổng tiền</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allQuotes.length > 0 ? (
                          allQuotes.map((quote) => {
                            const statusObj = getCustomerQuoteStatus(quote.status);
                            return (
                              <tr key={quote.id}>
                                <td className="fw-semibold">{quote.quotationNumber}</td>
                                <td>{formatDate(quote.validUntil)}</td>
                                <td className="text-success fw-semibold">{formatCurrency(quote.totalAmount)}</td>
                                <td>
                                  <Badge bg={statusObj.variant}>{statusObj.label}</Badge>
                                </td>
                                <td>
                                  <div className="d-flex gap-2 justify-content-center">
                                    <Button size="sm" variant="outline-primary" onClick={() => handleViewDetail(quote.id)}>
                                      Chi tiết
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-muted">
                              {totalElements === 0 ? 'Không có báo giá nào.' : 'Không tìm thấy báo giá phù hợp với bộ lọc.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                    {totalPages > 1 && (
                      <div className="p-3">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                        />
                      </div>
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

export default CustomerQuotations;