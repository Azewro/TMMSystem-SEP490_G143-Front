import React, { useState, useMemo, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Spinner, Tab, Tabs, Row, Col, Modal } from 'react-bootstrap';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import { productionService } from '../../api/productionService';
import { executionService } from '../../api/executionService';
import { orderService } from '../../api/orderService';
import apiClient from '../../api/apiConfig';
import { getLeaderStageStatusLabel, getLeaderOrderStatusFromStages, getStageTypeName } from '../../utils/statusMapper';
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
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('main'); // Track active tab
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // For WebSocket-triggered refresh
  const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');

  // Rework confirmation modal state (for supplementary orders)
  const [showReworkConfirmModal, setShowReworkConfirmModal] = useState(false);
  const [pendingReworkStage, setPendingReworkStage] = useState(null);
  const [pendingReworkOrder, setPendingReworkOrder] = useState(null);
  const [activeStagesInfo, setActiveStagesInfo] = useState(null);

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

              const activeStatuses = ['IN_PROGRESS', 'REWORK_IN_PROGRESS', 'READY_TO_PRODUCE', 'READY', 'WAITING', 'WAITING_QC', 'QC_IN_PROGRESS', 'WAITING_REWORK', 'QC_FAILED'];
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

              // Use getLeaderOrderStatusFromStages for status with stage name
              const dynamicStatus = getLeaderOrderStatusFromStages(orderDetail);

              // Also get stage-specific status for button logic
              const stageStatus = leaderStage
                ? getLeaderStageStatusLabel(leaderStage.status === 'PAUSED' ? 'PAUSED' : (leaderStage.executionStatus || leaderStage.status))
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
                  status: leaderStage.status === 'PAUSED' ? 'PAUSED' : (leaderStage.executionStatus || leaderStage.status),
                  statusLabel: stageStatus?.label || 'N/A',
                  statusVariant: stageStatus?.variant || 'secondary',
                  buttons: stageStatus?.buttons || [],
                  progress: leaderStage.progressPercent || 0,
                  isRework: leaderStage.isRework || false // Add isRework flag for rework button logic
                } : null,
                // Also check if order is a rework order (poNumber contains -REWORK)
                isReworkOrder: order.poNumber?.includes('-REWORK') || false
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
  }, [userId, refreshTrigger]);

  // Auto-refresh when page gains focus (user switches tabs)
  // This ensures Leader sees latest status after QA passes on another tab
  useEffect(() => {
    const handleFocus = () => {
      console.log('[LeaderOrderList] Window focused, triggering refetch...');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Filter out orders where Leader's assigned stage is PENDING (previous stages not completed)
      // These orders should not appear on Leader list per diagram
      const leaderStageStatus = o.leaderStage?.status;
      // Filter out PENDING stages (previous stages not completed)
      if (leaderStageStatus === 'PENDING') {
        return false;
      }

      // Filter out orders that PM hasn't started yet
      // User requirement: Only show orders when PM clicks "Start" -> Status is not WAITING_PRODUCTION
      if (o.orderStatus === 'WAITING_PRODUCTION' || o.orderStatus === 'PENDING_APPROVAL') {
        return false;
      }

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

      // Filter by status
      let matchesStatus = true;
      if (statusFilter) {
        const label = o.dynamicStatusLabel || '';
        matchesStatus = label.includes(statusFilter);
      }

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [searchTerm, startDateFilter, statusFilter, orders]);

  const handleStart = (order) => {
    navigate(`/leader/orders/${order.id}`);
  };

  const handleViewDetail = (order) => {
    navigate(`/leader/orders/${order.id}`);
  };

  // Helper function to start rework process
  const executeStartRework = async (stage, order, forceStop) => {
    try {
      const leaderUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      await apiClient.post(`/v1/production/stages/${stage.id}/start-rework?leaderUserId=${leaderUserId}&forceStop=${forceStop}`);
      toast.success('Đã bắt đầu sửa lỗi');
      navigate(`/leader/orders/${order.id}/progress`, { state: { stageId: stage.id } });
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Lỗi khi bắt đầu sửa lỗi';
      toast.error(msg);
    }
  };

  // Modal handlers for rework confirmation
  const handleConfirmForceStop = async () => {
    setShowReworkConfirmModal(false);
    if (pendingReworkStage && pendingReworkOrder) {
      await executeStartRework(pendingReworkStage, pendingReworkOrder, true);
    }
    setPendingReworkStage(null);
    setPendingReworkOrder(null);
    setActiveStagesInfo(null);
  };

  const handleCancelForceStop = () => {
    setShowReworkConfirmModal(false);
    setPendingReworkStage(null);
    setPendingReworkOrder(null);
    setActiveStagesInfo(null);
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
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo trạng thái</Form.Label>
                      <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">Tất cả trạng thái</option>
                        <option value="Sẵn sàng sản xuất">Sẵn sàng sản xuất</option>
                        <option value="Chờ đến lượt">Chờ đến lượt</option>
                        <option value="Đang làm">Đang làm</option>
                        <option value="Chờ kiểm tra">Chờ kiểm tra</option>
                        <option value="Đang kiểm tra">Đang kiểm tra</option>
                        {/* Lỗi nhẹ/nặng only for main orders, not supplementary */}
                        {activeTab === 'main' && <option value="lỗi nhẹ">Lỗi nhẹ</option>}
                        {activeTab === 'main' && <option value="lỗi nặng">Lỗi nặng</option>}
                        <option value="Tạm dừng">Tạm dừng</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Tabs defaultActiveKey="main" className="mb-3" onSelect={(k) => setActiveTab(k)}>
              <Tab eventKey="main" title="Lô sản xuất chính">
                <OrderTable
                  orders={mainOrders}
                  navigate={navigate}
                  executeStartRework={executeStartRework}
                  setPendingReworkStage={setPendingReworkStage}
                  setPendingReworkOrder={setPendingReworkOrder}
                  setActiveStagesInfo={setActiveStagesInfo}
                  setShowReworkConfirmModal={setShowReworkConfirmModal}
                />
              </Tab>
              <Tab eventKey="rework" title="Lô bổ sung (Sửa lỗi)">
                <OrderTable
                  orders={reworkOrders}
                  navigate={navigate}
                  isRework={true}
                  executeStartRework={executeStartRework}
                  setPendingReworkStage={setPendingReworkStage}
                  setPendingReworkOrder={setPendingReworkOrder}
                  setActiveStagesInfo={setActiveStagesInfo}
                  setShowReworkConfirmModal={setShowReworkConfirmModal}
                />
              </Tab>
            </Tabs>

            {/* Rework Confirmation Modal */}
            <Modal show={showReworkConfirmModal} onHide={handleCancelForceStop} centered>
              <Modal.Header closeButton>
                <Modal.Title>Xác nhận tạm dừng công đoạn</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p className="fw-bold text-danger">Cảnh báo: Có công đoạn đang chạy sẽ bị tạm dừng!</p>
                {activeStagesInfo?.activeStages && activeStagesInfo.activeStages.length > 0 && (
                  <ul className="mb-3">
                    {activeStagesInfo.activeStages.map((s, i) => (
                      <li key={i}>
                        <strong>{getStageTypeName(s.stageType)}</strong> - {s.status} ({s.progressPercent || 0}%)
                      </li>
                    ))}
                  </ul>
                )}
                <p>Bạn có chắc chắn muốn tạm dừng các công đoạn này để bắt đầu sửa lỗi không?</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCancelForceStop}>Hủy</Button>
                <Button variant="danger" onClick={handleConfirmForceStop}>Xác nhận tạm dừng</Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </div>
      </div>
    </div>
  );
};

const OrderTable = ({ orders, navigate, isRework = false, executeStartRework, setPendingReworkStage, setPendingReworkOrder, setActiveStagesInfo, setShowReworkConfirmModal }) => {
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
          case 'status':
            // Sort by status priority for Leader per diagram
            const getStatusPriority = (label) => {
              if (!label) return 99;
              // 1. Sẵn sàng sản xuất xxx (most urgent - need to start)
              if (label.includes('Sẵn sàng sản xuất')) return 1;
              // 2. Chờ đến lượt xxx
              if (label.includes('Chờ đến lượt')) return 2;
              // 3. Đang làm xxx
              if (label.includes('Đang làm')) return 3;
              // 4. Chờ kiểm tra xxx
              if (label.includes('Chờ kiểm tra')) return 4;
              // 5. Đang kiểm tra xxx
              if (label.includes('Đang kiểm tra')) return 5;
              // 6. xxx lỗi nhẹ
              if (label.includes('lỗi nhẹ')) return 6;
              // 7. xxx lỗi nặng
              if (label.includes('lỗi nặng')) return 7;
              // 8. Tạm dừng
              if (label.includes('Tạm dừng')) return 8;
              // 9. Hoàn thành
              if (label.includes('Hoàn thành')) return 9;
              return 99;
            };
            aValue = getStatusPriority(a.dynamicStatusLabel);
            bValue = getStatusPriority(b.dynamicStatusLabel);
            const statusComparison = aValue - bValue;
            return sortDirection === 'asc' ? statusComparison : -statusComparison;
          default:
            return 0;
        }

        const comparison = String(aValue).localeCompare(String(bValue), 'vi');
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } else {
      // Default: sort by ID descending (newest first)
      sorted.sort((a, b) => (b.id || 0) - (a.id || 0));
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

              <th
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort('status')}
              >
                Trạng thái {getSortIcon('status')}
              </th>
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

                // Nếu PM chưa start lệnh: luôn "Đợi" -> REMOVED per user feedback, fallback to "Chờ sản xuất" from dynamicStatusLabel
                // if (orderLocked) {
                //   statusLabel = 'Đợi';
                //   statusVariant = 'secondary';
                // }

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
                        let filteredButtons = isWaitingForTurn
                          ? buttons.filter(btn => btn.action !== 'start')
                          : buttons;

                        // For IN_PROGRESS status, show both "Xem chi tiết" and "Cập nhật tiến độ" buttons
                        const isInProgress = stage && ['IN_PROGRESS', 'REWORK_IN_PROGRESS'].includes(stage.status);
                        if (isInProgress) {
                          return (
                            <div className="d-flex gap-1 justify-content-end flex-wrap">
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => navigate(`/leader/orders/${order.id}`)}
                              >
                                Xem chi tiết
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => navigate(`/leader/orders/${order.id}/progress`, { state: { stageId: stage.id } })}
                              >
                                Cập nhật tiến độ
                              </Button>
                            </div>
                          );
                        }

                        // For READY_TO_PRODUCE status, show "Xem chi tiết" and "Bắt đầu"/"Tạm dừng và Sửa lỗi" buttons
                        const isReadyToStart = stage && ['READY_TO_PRODUCE', 'READY', 'WAITING'].includes(stage.status) && !isWaitingForTurn;
                        // Check if this is a rework order - use different button/API
                        const isReworkStage = stage?.isRework || order.isReworkOrder || isRework;

                        if (isReadyToStart) {
                          if (isReworkStage) {
                            // Rework order - show "Tạm dừng và Sửa lỗi" button
                            const handleStartRework = async () => {
                              try {
                                // First check if there are active stages that need to be stopped
                                const checkResult = await apiClient.get(`/v1/production/stages/${stage.id}/check-rework`);

                                if (checkResult.data.hasActiveStages) {
                                  // Store pending info and show confirmation modal
                                  setPendingReworkStage(stage);
                                  setPendingReworkOrder(order);
                                  setActiveStagesInfo(checkResult.data);
                                  setShowReworkConfirmModal(true);
                                } else {
                                  // No active stages - start rework directly
                                  await executeStartRework(stage, order, false);
                                }
                              } catch (error) {
                                const msg = error.response?.data?.message || error.message || 'Lỗi khi kiểm tra trạng thái';
                                toast.error(msg);
                              }
                            };
                            return (
                              <div className="d-flex gap-1 justify-content-end flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => navigate(`/leader/orders/${order.id}`)}
                                >
                                  Xem chi tiết
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={handleStartRework}
                                >
                                  Tạm dừng và Sửa lỗi
                                </Button>
                              </div>
                            );
                          } else {
                            // Normal order - show "Bắt đầu" button
                            const handleStartStage = async () => {
                              try {
                                await executionService.startStage(stage.id, sessionStorage.getItem('userId') || localStorage.getItem('userId'));
                                toast.success('Đã bắt đầu công đoạn');
                                navigate(`/leader/orders/${order.id}/progress`, { state: { stageId: stage.id } });
                              } catch (error) {
                                const msg = error.response?.data?.message || error.message || 'Lỗi khi bắt đầu công đoạn';
                                if (msg.includes('BLOCKING')) {
                                  toast.error(msg.replace('java.lang.RuntimeException: BLOCKING: ', ''));
                                } else {
                                  toast.error(msg);
                                }
                              }
                            };
                            return (
                              <div className="d-flex gap-1 justify-content-end flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => navigate(`/leader/orders/${order.id}`)}
                                >
                                  Xem chi tiết
                                </Button>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={handleStartStage}
                                >
                                  Bắt đầu
                                </Button>
                              </div>
                            );
                          }
                        }

                        return !orderLocked && filteredButtons.length > 0 ? (
                          filteredButtons.map((btn, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              variant={btn.variant}
                              className="me-1"
                              onClick={() => {
                                if (btn.action === 'update' || btn.action === 'rework') {
                                  navigate(`/leader/orders/${order.id}/progress`, { state: { stageId: stage?.id } });
                                } else if (btn.action === 'start') {
                                  navigate(`/leader/orders/${order.id}`);
                                } else {
                                  navigate(`/leader/orders/${order.id}`);
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
                            onClick={() => navigate(`/leader/orders/${order.id}`)}
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
