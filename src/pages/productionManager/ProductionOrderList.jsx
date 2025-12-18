import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Spinner, Row, Col } from 'react-bootstrap';
import { FaSearch, FaSortUp, FaSortDown, FaSort, FaWifi } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import { useNavigate } from 'react-router-dom';
import { productionService } from '../../api/productionService';
import { getStatusLabel, getStatusVariant, getProductionOrderStatusFromStages } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';
import useWebSocket from '../../hooks/useWebSocket';

registerLocale('vi', vi);



const ITEMS_PER_PAGE = 10;

const ProductionOrderList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch orders function (extracted for reuse)
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productionService.getManagerOrders();
      const mappedData = data.map(order => {
        const statusResult = getProductionOrderStatusFromStages(order);
        const isStarted = order.executionStatus &&
          !['WAITING_PRODUCTION', 'PENDING', 'PENDING_APPROVAL'].includes(order.executionStatus);
        const firstStage = order.stages && order.stages.length > 0 ? order.stages[0] : null;
        const leaderName = firstStage?.assignedLeader?.fullName || firstStage?.assigneeName || 'Chưa phân công';

        return {
          id: order.id,
          lotCode: (order.poNumber || "").replace('PO-', 'LOT-'),
          productName: order.productName || order.contract?.contractNumber || 'N/A',
          size: order.size || '-',
          quantity: order.totalQuantity || 0,
          expectedStartDate: order.expectedStartDate || order.plannedStartDate,
          expectedFinishDate: order.expectedFinishDate || order.plannedEndDate,
          status: order.executionStatus || order.status,
          statusLabel: statusResult.label,
          statusVariant: statusResult.variant,
          pendingMaterialRequestId: order.pendingMaterialRequestId,
          isStarted: isStarted,
          poNumber: order.poNumber,
          leaderName: leaderName
        };
      }).filter(o => !o.poNumber || !o.poNumber.includes('REWORK'));
      setOrders(mappedData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket({
    onOrderUpdate: useCallback(() => {
      console.log('[ProductionOrderList] Received order update, refreshing...');
      fetchOrders();
    }, [fetchOrders]),
  });

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDateFilter, statusFilter]);

  const handleStartWorkOrder = async (orderId) => {
    try {
      await productionService.startWorkOrder(orderId);
      toast.success('Đã bắt đầu lệnh làm việc');
      // Refresh orders from API to get accurate status from backend
      await fetchOrders();
    } catch (error) {
      console.error('Error starting work order:', error);
      toast.error(error.response?.data?.message || error.message || 'Không thể bắt đầu lệnh làm việc');
    }
  };

  const handleViewPlan = (orderId) => {
    navigate(`/production/orders/${orderId}`);
  };

  const handleViewMaterialRequest = (requestId) => {
    navigate(`/production/fiber-requests/${requestId}`);
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchTerm ||
        String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.lotCode && order.lotCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.productName && order.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filter by status
      let matchesStatus = true;
      if (statusFilter) {
        // Use includes() because statusLabel may contain stage name (e.g., "Đang Dệt")
        matchesStatus = order.statusLabel && order.statusLabel.includes(statusFilter);
      }

      // Filter by start date
      let matchesDate = true;
      if (startDateFilter) {
        const orderDate = order.expectedStartDate;
        if (orderDate) {
          matchesDate = orderDate === startDateFilter;
        } else {
          matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, startDateFilter, statusFilter]);

  // Sort and paginate orders
  const paginatedOrders = useMemo(() => {
    // First, sort all filtered orders
    let sorted = [...filteredOrders];

    if (sortColumn) {
      sorted.sort((a, b) => {
        let aValue, bValue;

        switch (sortColumn) {
          case 'lotCode':
            aValue = a.lotCode || '';
            bValue = b.lotCode || '';
            break;
          case 'productName':
            aValue = a.productName || '';
            bValue = b.productName || '';
            break;
          case 'startDate':
            aValue = a.expectedStartDate || '';
            bValue = b.expectedStartDate || '';
            break;
          case 'status':
            // Sort by status priority based on teammate's state diagram
            const getStatusPriority = (label) => {
              if (!label) return 99;
              if (label.includes('Chờ sản xuất') && !label.includes('bổ sung')) return 1;
              if (label.includes('Chờ đến lượt')) return 2;
              if (label.includes('Sẵn sàng')) return 3;
              if (label === 'Đang làm') return 4;  // Exact match for Đang làm
              if (label.includes('Tạm dừng')) return 5;
              if (label.includes('Chờ phê duyệt cấp sợi')) return 6;
              if (label.includes('Chờ sản xuất bổ sung')) return 7;
              if (label.includes('Đang sản xuất bổ sung')) return 8;
              if (label.includes('Hoàn thành')) return 9;
              return 99;
            };
            aValue = getStatusPriority(a.statusLabel);
            bValue = getStatusPriority(b.statusLabel);
            const statusComparison = aValue - bValue;
            return sortDirection === 'asc' ? statusComparison : -statusComparison;
          default:
            return 0;
        }

        const comparison = String(aValue).localeCompare(String(bValue), 'vi');
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Then, apply pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sorted.slice(startIndex, endIndex);
  }, [filteredOrders, sortColumn, sortDirection, currentPage]);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));

  // Calculate correct STT based on current page
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
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <h3 className="mb-4" style={{ fontWeight: 600 }}>
              Quản lý sản xuất
              {isConnected && (
                <FaWifi className="ms-2 text-success" title="Real-time updates enabled" style={{ fontSize: '0.6em' }} />
              )}
            </h3>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Tìm kiếm</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control
                          placeholder="Tìm theo mã lô..."
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
                          selected={parseDateString(startDateFilter)}
                          onChange={(date) => {
                            if (date) {
                              setStartDateFilter(formatDateForBackend(date));
                            } else {
                              setStartDateFilter('');
                            }
                            setCurrentPage(1);
                          }}
                          onChangeRaw={(e) => {
                            if (e.target.value === '' || e.target.value === null) {
                              setStartDateFilter('');
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
                        <option value="Chờ sản xuất">Chờ sản xuất</option>
                        <option value="Chờ đến lượt">Chờ đến lượt</option>
                        <option value="Sẵn sàng sản xuất">Sẵn sàng sản xuất</option>
                        <option value="Đang làm">Đang làm</option>
                        <option value="Tạm dừng">Tạm dừng</option>
                        <option value="Chờ phê duyệt cấp sợi">Chờ phê duyệt cấp sợi</option>
                        <option value="Chờ sản xuất bổ sung">Chờ sản xuất bổ sung</option>
                        <option value="Đang sản xuất bổ sung">Đang sản xuất bổ sung</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Header>
                Danh sách lệnh sản xuất
              </Card.Header>
              <Card.Body>
                <Table responsive className="mb-0 align-middle">
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
                        Tên sản phẩm {getSortIcon('productName')}
                      </th>
                      <th>Kích thước</th>
                      <th>Số lượng</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('startDate')}
                      >
                        Ngày bắt đầu dự kiến {getSortIcon('startDate')}
                      </th>
                      <th>Ngày kết thúc dự kiến</th>
                      <th>Leader phụ trách</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('status')}
                      >
                        Trạng thái {getSortIcon('status')}
                      </th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-4">Không có đơn hàng nào</td>
                      </tr>
                    ) : (
                      paginatedOrders.map((order, index) => (
                        <tr key={order.id}>
                          <td>{getRowNumber(index)}</td>
                          <td>
                            <strong>{order.lotCode}</strong>
                          </td>
                          <td>{order.productName}</td>
                          <td>{order.size}</td>
                          <td>{order.quantity.toLocaleString('vi-VN')}</td>
                          <td>{order.expectedStartDate}</td>
                          <td>{order.expectedFinishDate}</td>
                          <td>{order.leaderName}</td>
                          <td>
                            <Badge bg={order.statusVariant || getStatusVariant(order.status)}>
                              {order.statusLabel}
                            </Badge>
                          </td>
                          <td className="text-end">
                            {order.pendingMaterialRequestId ? (
                              <Button
                                size="sm"
                                variant="warning"
                                className="me-2"
                                onClick={() => handleViewMaterialRequest(order.pendingMaterialRequestId)}
                              >
                                Xem yêu cầu
                              </Button>
                            ) : null}
                            {!order.isStarted ? (
                              <Button
                                size="sm"
                                variant="dark"
                                onClick={() => handleStartWorkOrder(order.id)}
                              >
                                Bắt đầu lệnh
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleViewPlan(order.id)}
                              >
                                Xem kế hoạch
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

export default ProductionOrderList;
