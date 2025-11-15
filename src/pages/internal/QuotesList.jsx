import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner, Form, InputGroup } from 'react-bootstrap';
import { FaEye, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';
import { quotationService } from '../../api/quotationService';
import { userService } from '../../api/userService'; // Import userService
import { customerService } from '../../api/customerService'; // Import customerService
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
    case 'DRAFT': return 'Chờ gửi khách hàng';
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
  if (!iso) return '';
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

const QuotesList = () => {
  const navigate = useNavigate();
  const [allQuotes, setAllQuotes] = useState([]); // Holds all quotes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search, Filter and Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const fetchAndEnrichQuotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Convert 1-based page to 0-based for backend
      const page = currentPage - 1;
      const [quotesResponse, customersData, usersData] = await Promise.all([
        quotationService.getAllQuotes(page, ITEMS_PER_PAGE, searchTerm || undefined, statusFilter || undefined),
        customerService.getAllCustomers(), // Use customerService instead of quoteService
        userService.getAllUsers(0, 1000) // Get all users for enrichment (with pagination)
      ]);

      // Handle PageResponse
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

      // Handle PageResponse for usersData
      let usersArray = [];
      if (usersData && usersData.content) {
        usersArray = usersData.content;
      } else if (Array.isArray(usersData)) {
        usersArray = usersData;
      }

      // Handle customersData - could be array or PageResponse
      let customersArray = [];
      if (customersData && customersData.content) {
        customersArray = customersData.content;
      } else if (Array.isArray(customersData)) {
        customersArray = customersData;
      }

      if (Array.isArray(customersArray) && Array.isArray(usersArray)) {
        // Create maps with both string and number keys to handle type mismatches
        const customerMap = new Map();
        customersArray.forEach(c => {
          if (c.id != null) {
            customerMap.set(c.id, c);
            customerMap.set(String(c.id), c); // Also add as string
            customerMap.set(Number(c.id), c); // Also add as number
          }
        });
        
        const userMap = new Map();
        usersArray.forEach(u => {
          if (u.id != null) {
            userMap.set(u.id, u);
            userMap.set(String(u.id), u); // Also add as string
            userMap.set(Number(u.id), u); // Also add as number
          }
        });

        const enrichedQuotes = quotesData.map(quote => {
          // Try multiple ways to get customer
          const customer = customerMap.get(quote.customerId) 
            || customerMap.get(String(quote.customerId))
            || customerMap.get(Number(quote.customerId));
            
          const creator = userMap.get(quote.createdById)
            || userMap.get(String(quote.createdById))
            || userMap.get(Number(quote.createdById));
          
          // Debug log to check enrichment
          if (!customer && quote.customerId) {
            console.warn(`Customer not found for quote ${quote.id}`, {
              quoteCustomerId: quote.customerId,
              quoteCustomerIdType: typeof quote.customerId,
              availableCustomerIds: Array.from(customerMap.keys()).slice(0, 10),
              customersCount: customersArray.length
            });
          }
          
          return {
            ...quote,
            customer: customer,
            creator: creator
          };
        });

        setAllQuotes(enrichedQuotes);
      } else {
        console.warn('API returned non-array data for customers or users.', { 
          customersData, 
          usersData,
          customersDataType: typeof customersData,
          customersDataIsArray: Array.isArray(customersData),
          customersDataContent: customersData?.content
        });
        setAllQuotes(quotesData); // Still set quotes even if enrichment fails
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setError('Không thể tải danh sách báo giá: ' + (e?.message || 'Lỗi không xác định'));
      toast.error('Không thể tải danh sách báo giá: ' + (e?.message || 'Lỗi không xác định'));
      setAllQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);
  
  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchAndEnrichQuotes();
  }, [fetchAndEnrichQuotes, currentPage]);

  const handleViewDetail = (quote) => {
    navigate(`/sales/quotations/${quote.id}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Note: Search and filter are now server-side, no client-side filtering needed

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="sales" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Danh sách Báo giá</h2>

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Card className="shadow-sm">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <span>Các báo giá đã được tạo</span>
                  <div className="d-flex gap-2">
                    <div style={{ width: '300px' }}>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          placeholder="Tìm theo mã báo giá, khách hàng, người tạo..."
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />
                        <InputGroup.Text>
                          <FaSearch />
                        </InputGroup.Text>
                      </InputGroup>
                    </div>
                    <Form.Select
                      style={{ width: '200px' }}
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="DRAFT">Chờ gửi khách hàng</option>
                      <option value="SENT">Đã gửi</option>
                      <option value="ACCEPTED">Đã chấp nhận</option>
                      <option value="REJECTED">Đã từ chối</option>
                      <option value="EXPIRED">Hết hạn</option>
                      <option value="CANCELED">Đã hủy</option>
                      <option value="ORDER_CREATED">Đã tạo đơn hàng</option>
                    </Form.Select>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Mã báo giá</th>
                      <th>Khách hàng</th>
                      <th>Người tạo</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 140 }} className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr><td colSpan={6} className="text-center py-4">
                        <Spinner animation="border" size="sm" className="me-2" />
                        Đang tải...
                      </td></tr>
                    )}
                    {!loading && error && (
                      <tr><td colSpan={6} className="text-center py-4 text-muted">
                        Không thể hiển thị dữ liệu do lỗi
                      </td></tr>
                    )}
                    {!loading && !error && allQuotes.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-4 text-muted">
                        {totalElements === 0 
                          ? 'Chưa có báo giá nào.' 
                          : 'Không tìm thấy báo giá phù hợp với bộ lọc.'}
                      </td></tr>
                    )}
                    {!loading && !error && allQuotes.map((quote) => {
                      // Debug: Log customer info
                      if (quote.customerId && !quote.customer) {
                        console.log('Quote missing customer:', {
                          quoteId: quote.id,
                          customerId: quote.customerId,
                          quote: quote
                        });
                      }
                      
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
                          <td>{quote.creator?.name || '—'}</td>
                          <td className="text-success fw-semibold">
                            {formatCurrency(quote.totalAmount)}
                          </td>
                          <td>
                            <Badge bg={getStatusBadge(quote.status)} className="px-2 py-1">
                              {getStatusText(quote.status)}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button 
                              size="sm" 
                              variant="primary"
                              onClick={() => handleViewDetail(quote)}
                            >
                              <FaEye className="me-1" /> Chi tiết
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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

export default QuotesList;