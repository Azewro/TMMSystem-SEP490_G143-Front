import React, { useEffect, useState, useMemo } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch, FaSort, FaSortUp, FaSortDown, FaRedo } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Pagination from '../../components/Pagination';
import { contractService } from '../../api/contractService';
import { useAuth } from '../../context/AuthContext';
import { getCustomerOrderStatus } from '../../utils/statusMapper';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'WAITING_SIGNATURE', label: 'Chờ ký hợp đồng' },
  { value: 'PENDING_PROCESS', label: 'Chờ sản xuất' },
  { value: 'IN_PRODUCTION', label: 'Đang sản xuất' },
  { value: 'IN_PRODUCTION', label: 'Đang sản xuất' },
  { value: 'COMPLETED', label: 'Sản xuất xong' },
];

const REORDER_STATUSES = ['COMPLETED', 'SHIPPED', 'CANCELLED']; // Example statuses allowed for reorder, or maybe all? User didn't specify, assume all for now or COMPLETED. User said "Reorder", usually for completed orders. But let's allow for any order that has details.

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  try { return new Date(iso).toLocaleDateString('vi-VN'); } catch { return iso; }
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

const CustomerOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.customerId) {
        setError('Không tìm thấy thông tin khách hàng.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        // Fetch all contracts to filter client-side (because of complex status mapping)
        let allContracts = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await contractService.getAllContracts(page, ITEMS_PER_PAGE, searchTerm || undefined, undefined); // Don't send statusFilter to backend

          let pageContracts = [];
          if (response && response.content) {
            pageContracts = response.content;
          } else if (Array.isArray(response)) {
            pageContracts = response;
          }

          allContracts = [...allContracts, ...pageContracts];

          if (pageContracts.length < ITEMS_PER_PAGE) {
            hasMore = false;
          } else {
            page++;
          }
        }

        // Filter contracts for the current customer
        let customerOrders = allContracts.filter(
          (contract) => contract.customerId === parseInt(user.customerId, 10)
        );

        // Client-side Status Filter
        if (statusFilter) {
          customerOrders = customerOrders.filter(order => {
            const statusObj = getCustomerOrderStatus(order.status);
            return statusObj.value === statusFilter;
          });
        }

        // Client-side Date Filter
        if (createdDateFilter) {
          customerOrders = customerOrders.filter(order => {
            if (!order.createdAt) return false;
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            return orderDate === createdDateFilter;
          });
        }

        setTotalElements(customerOrders.length);
        setTotalPages(Math.ceil(customerOrders.length / ITEMS_PER_PAGE));
        setOrders(customerOrders);
      } catch (e) {
        setError(e.message || 'Không thể tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, searchTerm, statusFilter, createdDateFilter]); // Removed currentPage dependency as we handle pagination client-side now

  useEffect(() => {
    // Reset to page 1 when filters change
    if (user && user.customerId) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter, createdDateFilter]);

  // Filter and sort orders - Note: Search and status filter are now server-side
  // Only customerId filter and sorting remain client-side
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt || 0).getTime();
        bValue = new Date(b.createdAt || 0).getTime();
      } else if (sortField === 'deliveryDate') {
        aValue = new Date(a.deliveryDate || 0).getTime();
        bValue = new Date(b.deliveryDate || 0).getTime();
      } else {
        return 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    // Apply Pagination Slice here
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [orders, sortField, sortDirection, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
    setCurrentPage(1);
  };

  const handleReorder = async (orderId) => {
    try {
      const toastId = toast.loading('Đang chuẩn bị thông tin mua lại...');
      const details = await contractService.getOrderDetails(orderId);

      const reorderData = {
        contactPerson: details.customerInfo?.contactPerson || '',
        contactPhone: details.customerInfo?.phone || '',
        contactAddress: details.customerInfo?.shippingAddress || '',
        items: details.orderItems.map(item => ({
          productId: item.productId?.toString(),
          quantity: item.quantity,
          unit: 'cai', // Default or fetch if available
          productName: item.productName, // For display if needed
          standardDimensions: item.standardDimensions || ''
        }))
      };

      toast.dismiss(toastId);
      navigate('/customer/quote-request', { state: { reorderData } });
    } catch (error) {
      toast.error('Không thể lấy thông tin đơn hàng để mua lại.');
      console.error(error);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ms-1" style={{ opacity: 0.3 }} />;
    return sortDirection === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />;
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Danh sách đơn hàng</h2>

            {/* Search and Filter */}
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
                          placeholder="Tìm theo mã đơn hàng..."
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
                  <div className="text-center"><Spinner animation="border" /></div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Mã Đơn Hàng</th>
                          <th
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('createdAt')}
                            className="user-select-none"
                          >
                            Ngày Tạo {getSortIcon('createdAt')}
                          </th>
                          <th
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('deliveryDate')}
                            className="user-select-none"
                          >
                            Ngày Giao Dự Kiến {getSortIcon('deliveryDate')}
                          </th>
                          <th>Trạng Thái</th>
                          <th>Tổng Tiền</th>
                          <th className="text-center">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedOrders.length > 0 ? filteredAndSortedOrders.map((order) => {
                          const statusObj = getCustomerOrderStatus(order.status);
                          return (
                            <tr key={order.id}>
                              <td className="fw-semibold">{order.contractNumber || `HD-${order.id}`}</td>
                              <td>{formatDate(order.createdAt)}</td>
                              <td>{formatDate(order.deliveryDate)}</td>
                              <td><Badge bg={statusObj.variant}>{statusObj.label}</Badge></td>
                              <td>{formatCurrency(order.totalAmount)}</td>
                              <td className="text-center">
                                <Button size="sm" variant="primary" onClick={() => navigate(`/customer/orders/${order.id}`)} className="me-2 mb-1">
                                  Xem chi tiết
                                </Button>
                                <Button size="sm" variant="outline-success" onClick={() => handleReorder(order.id)} title="Mua lại đơn hàng này" className="mb-1">
                                  <FaRedo className="me-1" /> Mua lại
                                </Button>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="6" className="text-center">
                              {totalElements === 0
                                ? 'Bạn chưa có đơn hàng nào.'
                                : 'Không tìm thấy đơn hàng phù hợp với bộ lọc.'}
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

export default CustomerOrders;
