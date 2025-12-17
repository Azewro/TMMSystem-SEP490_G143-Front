import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner, Form, InputGroup, Row, Col, Modal } from 'react-bootstrap';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quotationService } from '../../api/quotationService';
import { userService } from '../../api/userService';
import { customerService } from '../../api/customerService';
import { orderService } from '../../api/orderService';
import { contractService } from '../../api/contractService';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import { getSalesQuoteStatus } from '../../utils/statusMapper';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

// Helper function to extract date from quotationNumber (format: QUO-YYYYMMDD-XXX)
const getDateFromQuotationNumber = (quotationNumber) => {
  if (!quotationNumber) return null;
  const match = quotationNumber.match(/QUO-(\d{4})(\d{2})(\d{2})-/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month}-${day}`;
  }
  return null;
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

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
    return value;
  }
};

const QuotesList = () => {
  const navigate = useNavigate();
  const [allQuotes, setAllQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Order detail modal state
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetailData, setOrderDetailData] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);

  // Search, Filter and Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Sort state
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Handle sort click - cycles: asc → desc → default
  const handleSort = (column) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // Reset to default (no sort)
        setSortColumn('');
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get sort icon for column
  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <FaSort className="ms-1 text-muted" style={{ opacity: 0.5 }} />;
    }
    return sortDirection === 'asc'
      ? <FaSortUp className="ms-1 text-primary" />
      : <FaSortDown className="ms-1 text-primary" />;
  };

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

  // Sort quotes based on sortColumn and sortDirection
  const sortedQuotes = useMemo(() => {
    if (!sortColumn) return allQuotes;

    return [...allQuotes].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'quotationNumber':
          aValue = a.quotationNumber || '';
          bValue = b.quotationNumber || '';
          break;
        case 'customer':
          aValue = a.customer?.contactPerson || a.customer?.companyName || '';
          bValue = b.customer?.contactPerson || b.customer?.companyName || '';
          break;
        case 'creator':
          aValue = a.creator?.name || '';
          bValue = b.creator?.name || '';
          break;
        case 'totalAmount':
          aValue = parseFloat(a.totalAmount) || 0;
          bValue = parseFloat(b.totalAmount) || 0;
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          return 0;
      }

      const comparison = aValue.localeCompare(bValue, 'vi');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [allQuotes, sortColumn, sortDirection]);

  useEffect(() => {
    fetchAndEnrichQuotes();
  }, [fetchAndEnrichQuotes, currentPage]);

  const handleViewDetail = (quote) => {
    navigate(`/sales/quotations/${quote.id}`);
  };

  const handleViewOrder = async (quote) => {
    setOrderDetailModalOpen(true);
    setOrderDetailLoading(true);
    setOrderDetailData(null);
    setSelectedContract(null);

    try {
      // Directly get order details by quotation ID using new endpoint
      const orderDetails = await contractService.getContractByQuotationId(quote.id);

      if (orderDetails) {
        // orderDetails contains both contract info and order items
        setSelectedContract({
          contractNumber: orderDetails.contractNumber,
          status: orderDetails.status,
          deliveryDate: orderDetails.deliveryDate,
          totalAmount: orderDetails.totalAmount
        });
        setOrderDetailData(orderDetails);
      } else {
        toast.error('Không tìm thấy đơn hàng cho báo giá này');
        setOrderDetailModalOpen(false);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Lỗi khi tìm đơn hàng');
      setOrderDetailModalOpen(false);
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const closeOrderDetailModal = () => {
    setOrderDetailModalOpen(false);
    setOrderDetailData(null);
    setSelectedContract(null);
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
                      <div className="custom-datepicker-wrapper">
                        <DatePicker
                          selected={parseDateString(createdDateFilter)}
                          onChange={(date) => {
                            if (date) {
                              // Format to yyyy-MM-dd for backend/state compatibility
                              setCreatedDateFilter(formatDateForBackend(date));
                            } else {
                              setCreatedDateFilter('');
                            }
                            setCurrentPage(1);
                          }}
                          onChangeRaw={(e) => {
                            if (e.target.value === '' || e.target.value === null) {
                              setCreatedDateFilter('');
                              setCurrentPage(1);
                            }
                          }}
                          dateFormat="dd/MM/yyyy"
                          locale="vi"
                          className="form-control"
                          placeholderText="dd/mm/yyyy"
                          isClearable
                          todayButton="Hôm nay"
                        />
                      </div>
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
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('quotationNumber')}
                          >
                            Mã báo giá {getSortIcon('quotationNumber')}
                          </th>
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('customer')}
                          >
                            Khách hàng {getSortIcon('customer')}
                          </th>
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('creator')}
                          >
                            Người tạo {getSortIcon('creator')}
                          </th>
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('totalAmount')}
                          >
                            Tổng tiền {getSortIcon('totalAmount')}
                          </th>
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('status')}
                          >
                            Trạng thái {getSortIcon('status')}
                          </th>
                          <th style={{ width: 200 }} className="text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedQuotes.length > 0 ? sortedQuotes.map(quote => {
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

      {/* Order Detail Modal */}
      <Modal
        show={orderDetailModalOpen}
        onHide={closeOrderDetailModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {orderDetailLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" /> Đang tải chi tiết đơn hàng...
            </div>
          ) : orderDetailData && selectedContract ? (
            <div>
              {/* Customer Information */}
              <Card className="mb-3">
                <Card.Header>
                  <strong>Thông tin khách hàng</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-2"><strong>Tên khách hàng:</strong> {orderDetailData.customerInfo?.customerName || selectedContract.customerName || 'N/A'}</p>
                      <p className="mb-2"><strong>Công ty:</strong> {orderDetailData.customerInfo?.companyName || 'N/A'}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-2"><strong>Số điện thoại:</strong> {orderDetailData.customerInfo?.phoneNumber || 'N/A'}</p>
                      <p className="mb-2"><strong>Email:</strong> {orderDetailData.customerInfo?.email || 'N/A'}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Order Information */}
              <Card className="mb-3">
                <Card.Header>
                  <strong>Thông tin đơn hàng</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-2"><strong>Mã đơn hàng:</strong> {selectedContract.contractNumber || orderDetailData.contractNumber}</p>
                      <p className="mb-2"><strong>Ngày giao hàng:</strong> {formatDate(selectedContract.deliveryDate || orderDetailData.deliveryDate)}</p>
                      <p className="mb-2"><strong>Tổng giá trị:</strong> <span className="text-success fw-semibold">{formatCurrency(selectedContract.totalAmount || orderDetailData.totalAmount)}</span></p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-2"><strong>Trạng thái:</strong>
                        <Badge bg={selectedContract.status === 'APPROVED' ? 'success' : 'info'} className="ms-2">
                          {selectedContract.status === 'APPROVED' ? 'Hợp đồng đã ký được phê duyệt' : selectedContract.status}
                        </Badge>
                      </p>
                    </Col>
                  </Row>

                  {/* Order Items Table */}
                  {orderDetailData.orderItems && orderDetailData.orderItems.length > 0 && (
                    <div className="mt-3">
                      <h6 className="mb-2">Danh sách sản phẩm:</h6>
                      <Table size="sm" bordered>
                        <thead className="table-light">
                          <tr>
                            <th>Sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetailData.orderItems.map((item, index) => (
                            <tr key={item.productId || index}>
                              <td>{item.productName}</td>
                              <td>{item.quantity?.toLocaleString('vi-VN')}</td>
                              <td>{formatCurrency(item.unitPrice)}</td>
                              <td>{formatCurrency(item.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          ) : (
            <Alert variant="warning">Không tìm thấy chi tiết đơn hàng.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeOrderDetailModal}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QuotesList;