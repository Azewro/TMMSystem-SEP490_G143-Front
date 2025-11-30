import React, { useEffect, useState, useMemo } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaEye, FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Pagination from '../../components/Pagination';
import { contractService } from '../../api/contractService';
import { useAuth } from '../../context/AuthContext';

import { getCustomerOrderStatus } from '../../utils/statusMapper';

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'WAITING_SIGNATURE', label: 'Chờ ký hợp đồng' },
  { value: 'PENDING_PROCESS', label: 'Chờ sản xuất' },
  { value: 'IN_PRODUCTION', label: 'Đang sản xuất' },
  { value: 'COMPLETED', label: 'Sản xuất xong' },
  { value: 'REJECTED', label: 'Đã từ chối' },
];

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
        // Convert 1-based page to 0-based for backend
        const page = currentPage - 1;
        const response = await contractService.getAllContracts(page, ITEMS_PER_PAGE, searchTerm || undefined, statusFilter || undefined);

        // Handle PageResponse
        let allContracts = [];
        if (response && response.content) {
          allContracts = response.content;
          setTotalPages(response.totalPages || 1);
          setTotalElements(response.totalElements || 0);
        } else if (Array.isArray(response)) {
          allContracts = response;
          setTotalPages(1);
          setTotalElements(response.length);
        }

        // Filter contracts for the current customer
        const customerOrders = allContracts.filter(
          (contract) => contract.customerId === parseInt(user.customerId, 10)
        );
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
  }, [user, currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    // Reset to page 1 when filters change
    if (user && user.customerId) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter]);

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

    return filtered;
  }, [orders, sortField, sortDirection]);

  // Note: Search and status filter are now server-side, only sorting remains client-side

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ms-1" style={{ opacity: 0.3 }} />;
    return sortDirection === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />;
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <h4 className="mb-3">Danh sách đơn hàng</h4>

            {/* Search and Filters */}
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Tìm theo mã đơn hàng, ngày tạo, ngày giao hàng..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
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
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
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
                    {loading ? (
                      <tr><td colSpan="6" className="text-center py-5"><Spinner animation="border" /></td></tr>
                    ) : error ? (
                      <tr><td colSpan="6" className="text-center py-4"><Alert variant="danger">{error}</Alert></td></tr>
                    ) : filteredAndSortedOrders.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-4 text-muted">
                        {totalElements === 0 ? 'Bạn chưa có đơn hàng nào.' : 'Không tìm thấy đơn hàng nào phù hợp với bộ lọc.'}
                      </td></tr>
                    ) : (
                      filteredAndSortedOrders.map((order) => {
                        const statusObj = getCustomerOrderStatus(order.status);
                        return (
                          <tr key={order.id}>
                            <td className="fw-semibold">{order.contractNumber || `HD-${order.id}`}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>{formatDate(order.deliveryDate)}</td>
                            <td><Badge bg={statusObj.variant}>{statusObj.label}</Badge></td>
                            <td>{formatCurrency(order.totalAmount)}</td>
                            <td className="text-center">
                              <Button size="sm" variant="outline-primary" onClick={() => navigate(`/customer/orders/${order.id}`)}>
                                <FaEye className="me-1" /> Xem
                              </Button>
                            </td>
                          </tr>
                        );
                      })
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
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrders;
