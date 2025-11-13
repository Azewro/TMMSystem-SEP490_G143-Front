import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner, Form, InputGroup } from 'react-bootstrap';
import { FaEye, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { quoteService } from '../../api/quoteService';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';

const getStatusBadge = (status) => {
  switch (status) {
    case 'DRAFT': return 'secondary';
    case 'SENT': return 'info';
    case 'ACCEPTED': return 'success';
    case 'REJECTED': return 'danger';
    case 'EXPIRED': return 'light';
    case 'CANCELED': return 'dark';
    case 'ORDER_CREATED': return 'primary';
    default: return 'light';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'DRAFT': return 'Chờ gửi';
    case 'SENT': return 'Đã gửi';
    case 'ACCEPTED': return 'Đã chấp nhận';
    case 'REJECTED': return 'Đã từ chối';
    case 'EXPIRED': return 'Hết hạn';
    case 'CANCELED': return 'Đã hủy';
    case 'ORDER_CREATED': return 'Đã tạo đơn hàng';
    default: return status;
  }
};

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
  const [currentPage, setCurrentPage] = useState(1);
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
      const data = await quoteService.getCustomerQuotations(customerId);
      const filteredData = (Array.isArray(data) ? data : []).filter(quote => quote.status !== 'DRAFT'); // Filter out DRAFT quotes
      const sortedData = filteredData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllQuotes(sortedData);
    } catch (e) {
      setError(e.message || 'Không thể tải báo giá của bạn');
      toast.error(e.message || 'Không thể tải báo giá của bạn');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

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

  const filteredQuotes = allQuotes.filter(quote => 
    quote.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastQuote = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstQuote = indexOfLastQuote - ITEMS_PER_PAGE;
  const currentQuotes = filteredQuotes.slice(indexOfFirstQuote, indexOfLastQuote);
  const totalPages = Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE);

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Danh sách báo giá của bạn</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="shadow-sm">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Các báo giá đã nhận</span>
                  <div style={{ width: '300px' }}>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Tìm theo mã báo giá..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                    </InputGroup>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-bold">Mã báo giá</th>
                      <th className="fw-bold">Ngày giao dự kiến</th>
                      <th className="fw-bold">Tổng tiền</th>
                      <th className="fw-bold">Trạng thái</th>
                      <th className="fw-bold text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" className="text-center py-4"><Spinner animation="border" /></td></tr>
                    ) : currentQuotes.length > 0 ? (
                      currentQuotes.map((quote) => (
                        <tr key={quote.id}>
                          <td className="fw-semibold text-primary">{quote.quotationNumber}</td>
                          <td>{formatDate(quote.validUntil)}</td>
                          <td className="text-success fw-semibold">{formatCurrency(quote.totalAmount)}</td>
                          <td>
                            <Badge bg={getStatusBadge(quote.status)}>{getStatusText(quote.status)}</Badge>
                          </td>
                          <td className="text-center">
                            <Button size="sm" variant="primary" onClick={() => handleViewDetail(quote.id)}>
                              <FaEye className="me-1" /> Chi tiết
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="text-center py-4 text-muted">Không có báo giá nào.</td></tr>
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
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default CustomerQuotations;