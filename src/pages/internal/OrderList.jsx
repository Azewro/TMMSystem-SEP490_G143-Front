import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Badge, Button, Form, InputGroup, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import { quoteService } from '../../api/quoteService';
import { getSalesOrderStatus } from '../../utils/statusMapper';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'WAITING_SIGNATURE', label: 'Chờ ký hợp đồng' },
  { value: 'PENDING_APPROVAL', label: 'Chờ phê duyệt hợp đồng đã ký' },
  { value: 'APPROVED', label: 'Hợp đồng đã ký được phê duyệt' },
  { value: 'IN_PRODUCTION', label: 'Đang sản xuất' },
  { value: 'COMPLETED', label: 'Sản xuất xong' },
  { value: 'REJECTED', label: 'Hợp đồng đã ký bị từ chối' },
];

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
};

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');

  // Sort state
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Handle sort click
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
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

  useEffect(() => {
    const fetchAndEnrichOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const [quotesData, customersData] = await Promise.all([
          quoteService.getAllQuotes(),
          quoteService.getAllCustomers()
        ]);

        if (Array.isArray(quotesData) && Array.isArray(customersData)) {
          const customerMap = new Map(customersData.map(c => [c.id, c]));

          const orderLikeQuotes = quotesData
            .filter(q => q.status === 'ORDER_CREATED')
            .map(order => ({
              ...order,
              customer: customerMap.get(order.customerId),
            }));

          const sortedData = orderLikeQuotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(sortedData);
        } else {
          console.warn('API returned non-array data for quotes or customers.');
          setOrders([]);
        }
      } catch (e) {
        console.error('Fetch error:', e);
        setError('Không thể tải danh sách đơn hàng: ' + (e?.message || 'Lỗi không xác định'));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndEnrichOrders();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, createdDateFilter]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search
    if (searchTerm.trim()) {
      const normalizedKeyword = searchTerm.trim().replace(/\s+/g, ' ').toLowerCase();
      result = result.filter(x => {
        const num = (x.quotationNumber || x.id || '').toString().trim().toLowerCase();
        const rep = (x.customer?.contactPerson || x.customer?.companyName || '').trim().toLowerCase();
        return num.includes(normalizedKeyword) || rep.includes(normalizedKeyword);
      });
    }

    // Status Filter
    if (statusFilter) {
      result = result.filter(order => {
        const statusObj = getSalesOrderStatus(order.status);
        return statusObj.value === statusFilter;
      });
    }

    // Date Filter
    if (createdDateFilter) {
      result = result.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === createdDateFilter;
      });
    }

    return result;
  }, [searchTerm, statusFilter, createdDateFilter, orders]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Sort paginatedOrders
  const sortedOrders = useMemo(() => {
    if (!sortColumn) return paginatedOrders;

    return [...paginatedOrders].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'quotationNumber':
          aValue = a.quotationNumber || '';
          bValue = b.quotationNumber || '';
          break;
        case 'contactPerson':
          aValue = a.customer?.contactPerson || '';
          bValue = b.customer?.contactPerson || '';
          break;
        case 'createdDate':
          aValue = a.createdAt || '';
          bValue = b.createdAt || '';
          break;
        default:
          return 0;
      }

      const comparison = String(aValue).localeCompare(String(bValue), 'vi');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [paginatedOrders, sortColumn, sortDirection]);

  const handleViewDetail = (order) => {
    navigate(`/internal/orders/${order.id}`);
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid>
            <h2 className="mb-4">Danh sách Đơn hàng</h2>

            {/* Search and Filter Section */}
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
                          placeholder="Tìm theo mã đơn hàng, tên khách..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
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
                              setCreatedDateFilter(formatDateForBackend(date));
                            } else {
                              setCreatedDateFilter('');
                            }
                          }}
                          onChangeRaw={(e) => {
                            if (e.target.value === '' || e.target.value === null) {
                              setCreatedDateFilter('');
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
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                Danh sách các đơn hàng
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-5"><Spinner animation="border" /></div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : (
                  <>
                    <Table striped bordered hover responsive className="mb-0 align-middle">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>STT</th>
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('quotationNumber')}
                          >
                            Mã đơn hàng {getSortIcon('quotationNumber')}
                          </th>
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('contactPerson')}
                          >
                            Người đại diện {getSortIcon('contactPerson')}
                          </th>
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('createdDate')}
                          >
                            Ngày tạo đơn {getSortIcon('createdDate')}
                          </th>
                          <th>Trạng thái</th>
                          <th style={{ width: 140 }} className="text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedOrders.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-4 text-muted">
                            {orders.length === 0 ? 'Chưa có đơn hàng nào' : 'Không tìm thấy đơn hàng phù hợp'}
                          </td></tr>
                        ) : (
                          sortedOrders.map((order, idx) => {
                            const statusObj = getSalesOrderStatus(order.status);
                            return (
                              <tr key={order.id || idx}>
                                <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                <td className="fw-semibold text-primary">
                                  {order.quotationNumber || `ORDER-${order.id}`}
                                </td>
                                <td>{order.customer?.contactPerson || '—'}</td>
                                <td>{formatDate(order.createdAt)}</td>
                                <td>
                                  <Badge bg={statusObj.variant} className="px-2 py-1">
                                    {statusObj.label}
                                  </Badge>
                                </td>
                                <td className="text-center">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleViewDetail(order)}
                                  >
                                    Xem chi tiết
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </Table>
                    {totalPages > 1 && (
                      <div className="mt-3">
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

export default OrderList;
