import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import api from '../../api/apiConfig';
import { toast } from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

const ITEMS_PER_PAGE = 10;

const statusConfig = {
  READY_SUPPLEMENTARY: { label: 'Chờ sản xuất bổ sung', variant: 'secondary' },
  WAITING_SUPPLEMENTARY: { label: 'Chờ sản xuất bổ sung', variant: 'secondary' },
  IN_SUPPLEMENTARY: { label: 'Đang sản xuất bổ sung', variant: 'primary' },
  SUPPLEMENTARY_CREATED: { label: 'Chờ sản xuất bổ sung', variant: 'secondary' },
  WAITING_PRODUCTION: { label: 'Chờ sản xuất bổ sung', variant: 'secondary' },
  IN_PROGRESS: { label: 'Đang sản xuất bổ sung', variant: 'primary' },
  COMPLETED: { label: 'Hoàn thành', variant: 'success' },
  PENDING: { label: 'Chờ xử lý', variant: 'warning' },
  APPROVED: { label: 'Đã phê duyệt', variant: 'success' },
};

const ProductionReworkOrders = () => {
  const navigate = useNavigate();
  const [reworkOrders, setReworkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Sort state
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const orderResponse = await api.get('/v1/production/manager/orders');
      const reworks = orderResponse.data.filter(o => o.poNumber && o.poNumber.includes('-REWORK'));
      setReworkOrders(reworks);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (orderId) => {
    if (!window.confirm("Bạn có chắc chắn muốn bắt đầu đơn hàng bổ sung này?")) return;
    try {
      await api.post(`/v1/production/orders/${orderId}/start-supplementary`);
      toast.success("Đã bắt đầu đơn hàng bổ sung");
      fetchData();
    } catch (error) {
      console.error("Error starting order:", error);
      toast.error("Không thể bắt đầu đơn hàng");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return reworkOrders.filter((order) => {
      const matchesSearch = !searchTerm ||
        (order.lotCode && order.lotCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.poNumber && order.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.productName && order.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = !statusFilter || order.executionStatus === statusFilter;

      let matchesDate = true;
      if (dateFilter && order.plannedStartDate) {
        matchesDate = order.plannedStartDate === dateFilter;
      } else if (dateFilter) {
        matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [reworkOrders, searchTerm, statusFilter, dateFilter]);

  // Sort and paginate
  const paginatedOrders = useMemo(() => {
    let sorted = [...filteredOrders];

    if (sortColumn) {
      sorted.sort((a, b) => {
        let aValue, bValue;

        switch (sortColumn) {
          case 'lotCode':
            aValue = a.lotCode || a.poNumber || '';
            bValue = b.lotCode || b.poNumber || '';
            break;
          case 'productName':
            aValue = a.productName || '';
            bValue = b.productName || '';
            break;
          case 'quantity':
            aValue = a.totalQuantity || 0;
            bValue = b.totalQuantity || 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'plannedStartDate':
            aValue = a.plannedStartDate || '';
            bValue = b.plannedStartDate || '';
            break;
          case 'status':
            aValue = a.executionStatus || '';
            bValue = b.executionStatus || '';
            break;
          default:
            return 0;
        }

        const comparison = String(aValue).localeCompare(String(bValue), 'vi');
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sorted.slice(startIndex, endIndex);
  }, [filteredOrders, sortColumn, sortDirection, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));

  const getRowNumber = (index) => {
    return (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="production" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <h3 className="mb-4" style={{ fontWeight: 600 }}>Quản lý sản xuất bổ sung</h3>

            {/* Search and Filter */}
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Tìm kiếm</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control
                          placeholder="Tìm kiếm theo mã lô, sản phẩm..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo ngày bắt đầu</Form.Label>
                      <div className="custom-datepicker-wrapper">
                        <DatePicker
                          selected={parseDateString(dateFilter)}
                          onChange={(date) => {
                            if (date) {
                              setDateFilter(formatDateForBackend(date));
                            } else {
                              setDateFilter('');
                            }
                          }}
                          onChangeRaw={(e) => {
                            if (e.target.value === '' || e.target.value === null) {
                              setDateFilter('');
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
                        <option value="">Tất cả trạng thái</option>
                        <option value="WAITING_PRODUCTION">Chờ sản xuất</option>
                        <option value="IN_PROGRESS">Đang sản xuất</option>
                        <option value="COMPLETED">Hoàn thành</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Header>
                Danh sách lệnh sản xuất bổ sung
              </Card.Header>
              <Card.Body>
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>STT</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('lotCode')}
                      >
                        Mã lô {getSortIcon('lotCode')}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('productName')}
                      >
                        Sản phẩm {getSortIcon('productName')}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('quantity')}
                      >
                        Số lượng {getSortIcon('quantity')}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('plannedStartDate')}
                      >
                        Ngày bắt đầu {getSortIcon('plannedStartDate')}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('status')}
                      >
                        Trạng thái {getSortIcon('status')}
                      </th>
                      <th style={{ width: 180 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-4">Không có lệnh bổ sung nào</td></tr>
                    ) : (
                      paginatedOrders.map((order, index) => (
                        <tr key={order.id}>
                          <td>{getRowNumber(index)}</td>
                          <td><strong>{order.lotCode || order.poNumber}</strong></td>
                          <td>{order.productName || 'N/A'}</td>
                          <td>{order.totalQuantity?.toLocaleString('vi-VN')}</td>
                          <td>{order.plannedStartDate}</td>
                          <td>
                            <Badge bg={statusConfig[order.executionStatus]?.variant || 'secondary'}>
                              {statusConfig[order.executionStatus]?.label || order.executionStatus}
                            </Badge>
                          </td>
                          <td>
                            <Button size="sm" variant="primary" onClick={() => navigate(`/production/orders/${order.id}`)} className="me-2">
                              Chi tiết
                            </Button>
                            {(order.executionStatus === 'WAITING_PRODUCTION' || order.executionStatus === 'READY_SUPPLEMENTARY') && (
                              <Button size="sm" variant="success" onClick={() => handleStart(order.id)}>
                                Bắt đầu
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionReworkOrders;
