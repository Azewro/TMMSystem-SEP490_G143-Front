import React, { useState, useMemo, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Spinner, Tab, Tabs, Row, Col } from 'react-bootstrap';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import { productionService } from '../../api/productionService';
import { orderService } from '../../api/orderService';
import { getLeaderStageStatusLabel, getProductionOrderStatusFromStages, getStageTypeName } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

const ITEMS_PER_PAGE = 10;

const LeaderOrderList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        if (!userId) {
          toast.error('Không tìm thấy thông tin người dùng');
          setLoading(false);
          return;
        }

        const numericUserId = Number(userId);
        const ordersData = await productionService.getLeaderOrders(numericUserId);

        const ordersWithStages = await Promise.all(
          ordersData.map(async (order) => {
            try {
              const orderDetail = await orderService.getOrderById(order.id);
              const leaderStagesAll = (orderDetail.stages || [])
                .filter(stage =>
                  stage.assignedLeaderId === numericUserId ||
                  stage.assignedLeader?.id === numericUserId
                )
                .sort((a, b) => (a.stageSequence || 0) - (b.stageSequence || 0));

              const activeStatuses = ['IN_PROGRESS', 'REWORK_IN_PROGRESS', 'READY_TO_PRODUCE', 'READY', 'WAITING', 'WAITING_QC', 'QC_IN_PROGRESS', 'WAITING_REWORK'];
              const leaderStage =
                leaderStagesAll.find(s => activeStatuses.includes(s.executionStatus || s.status)) ||
                leaderStagesAll.find(s => (s.progressPercent ?? 0) < 100) ||
                leaderStagesAll[0];
              const orderStatus = orderDetail.executionStatus || orderDetail.status;
              const productName =
                orderDetail.productName ||
                orderDetail.contract?.productName ||
                orderDetail.productionOrderDetails?.[0]?.product?.name ||
                orderDetail.productionOrderDetails?.[0]?.productName ||
                orderDetail.contract?.contractNumber ||
                'N/A';

              // Use getProductionOrderStatusFromStages for dynamic label like PM page
              const dynamicStatus = getProductionOrderStatusFromStages(orderDetail);

              // Also get stage-specific status for button logic
              const stageStatus = leaderStage
                ? getLeaderStageStatusLabel(leaderStage.executionStatus || leaderStage.status)
                : null;

              return {
                ...order,
                productName,
                orderStatus,
                // Dynamic status label like PM page
                dynamicStatusLabel: dynamicStatus.label,
                dynamicStatusVariant: dynamicStatus.variant,
                // Get leader name from first stage
                leaderName: leaderStagesAll?.[0]?.assignedLeader?.fullName || leaderStagesAll?.[0]?.assigneeName || 'Chưa phân công',
                leaderStage: leaderStage ? {
                  id: leaderStage.id,
                  stageType: leaderStage.stageType,
                  status: leaderStage.executionStatus || leaderStage.status,
                  statusLabel: stageStatus?.label || 'N/A',
                  statusVariant: stageStatus?.variant || 'secondary',
                  buttons: stageStatus?.buttons || [],
                  progress: leaderStage.progressPercent || 0
                } : null
              };
            } catch (err) {
              console.warn(`Could not fetch detail for order ${order.id}:`, err);
              return {
                ...order,
                leaderStage: null
              };
            }
          })
        );

        setOrders(ordersWithStages);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Không thể tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch = !searchTerm ||
        (o.poNumber && o.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.contract?.contractNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.productName || '').toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDate = true;
      if (startDateFilter) {
        const orderDate = o.plannedStartDate;
        if (orderDate) {
          matchesDate = orderDate === startDateFilter;
        } else {
          matchesDate = false;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [searchTerm, startDateFilter, orders]);

  const handleStart = (order) => {
    navigate(`/leader/orders/${order.id}`);
  };

  const handleViewDetail = (order) => {
    navigate(`/leader/orders/${order.id}`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  const mainOrders = filteredOrders.filter(o => !o.poNumber.includes('-REWORK'));
  const reworkOrders = filteredOrders.filter(o => o.poNumber.includes('-REWORK'));

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="leader" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <h3 className="mb-4" style={{ fontWeight: 600 }}>Danh sách lô sản xuất</h3>

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
                          placeholder="Tìm kiếm theo mã lô hoặc sản phẩm..."
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
                          }}
                          onChangeRaw={(e) => {
                            if (e.target.value === '' || e.target.value === null) {
                              setStartDateFilter('');
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
                </Row>
              </Card.Body>
            </Card>

            <Tabs defaultActiveKey="main" className="mb-3">
              <Tab eventKey="main" title="Lô sản xuất chính">
                <OrderTable
                  orders={mainOrders}
                  handleStart={handleStart}
                  handleViewDetail={handleViewDetail}
                />
              </Tab>
              <Tab eventKey="rework" title="Lô bổ sung (Sửa lỗi)">
                <OrderTable
                  orders={reworkOrders}
                  handleStart={handleStart}
                  handleViewDetail={handleViewDetail}
                  isRework={true}
                />
              </Tab>
            </Tabs>
          </Container>
        </div>
      </div>
    </div>
  );
};

const OrderTable = ({ orders, handleStart, handleViewDetail, isRework = false }) => {
  // Sort state
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when orders change
  useEffect(() => {
    setCurrentPage(1);
  }, [orders]);

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

  // Sort and paginate
  const paginatedOrders = useMemo(() => {
    let sorted = [...orders];

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
          case 'startDate':
            aValue = a.plannedStartDate || '';
            bValue = b.plannedStartDate || '';
            break;
          case 'quantity':
            aValue = a.totalQuantity || 0;
            bValue = b.totalQuantity || 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
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
  }, [orders, sortColumn, sortDirection, currentPage]);

  const totalPages = Math.max(1, Math.ceil(orders.length / ITEMS_PER_PAGE));

  const getRowNumber = (index) => {
    return (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
  };

  return (
    <Card className="shadow-sm">
      <Card.Header>
        {isRework ? 'Danh sách lô bổ sung' : 'Danh sách lô sản xuất chính'}
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
                onClick={() => handleSort('startDate')}
              >
                Ngày bắt đầu {getSortIcon('startDate')}
              </th>
              <th>Ngày kết thúc</th>
              <th>Leader</th>
              <th>Trạng thái</th>
              <th style={{ width: 150 }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4">Không có lô sản xuất nào</td>
              </tr>
            ) : (
              paginatedOrders.map((order, index) => {
                const stage = order.leaderStage;
                const orderLocked = order.orderStatus === 'WAITING_PRODUCTION' || order.orderStatus === 'PENDING_APPROVAL';

                // Use dynamic status label like PM page (e.g., "Đang Nhuộm", "Chờ đến lượt Dệt")
                let statusLabel = order.dynamicStatusLabel || 'N/A';
                let statusVariant = order.dynamicStatusVariant || 'secondary';

                // Get buttons from stage status for action column
                const stageStatus = stage ? getLeaderStageStatusLabel(stage.status) : { buttons: [] };
                const buttons = stageStatus?.buttons || [];

                // Nếu PM chưa start lệnh: luôn "Đợi"
                if (orderLocked) {
                  statusLabel = 'Đợi';
                  statusVariant = 'secondary';
                }

                return (
                  <tr key={order.id}>
                    <td>{getRowNumber(index)}</td>
                    <td>
                      <strong>{order.lotCode || order.poNumber}</strong>
                      {isRework && <Badge bg="danger" className="ms-2">Rework</Badge>}
                    </td>
                    <td>{order.productName || order.contract?.contractNumber || 'N/A'}</td>
                    <td>{order.totalQuantity?.toLocaleString('vi-VN')}</td>
                    <td>{order.plannedStartDate}</td>
                    <td>{order.plannedEndDate}</td>
                    <td>{order.leaderName}</td>
                    <td>
                      <Badge bg={statusVariant}>
                        {statusLabel}
                      </Badge>
                    </td>
                    <td className="text-end">
                      {(() => {
                        // Filter buttons - hide 'start' action when waiting for turn (another lot using the machine)
                        const isWaitingForTurn = statusLabel.includes('Chờ đến lượt');
                        const filteredButtons = isWaitingForTurn
                          ? buttons.filter(btn => btn.action !== 'start')
                          : buttons;

                        return !orderLocked && filteredButtons.length > 0 ? (
                          filteredButtons.map((btn, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              variant={btn.variant}
                              className="me-1"
                              onClick={() => {
                                if (btn.action === 'start' || btn.action === 'update' || btn.action === 'rework') {
                                  handleStart(order);
                                } else {
                                  handleViewDetail(order);
                                }
                              }}
                            >
                              {btn.text}
                            </Button>
                          ))
                        ) : (
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => handleViewDetail(order)}
                          >
                            Xem chi tiết
                          </Button>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })
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
  );
};

export default LeaderOrderList;
