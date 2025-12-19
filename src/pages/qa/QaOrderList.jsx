import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Spinner, Row, Col, Tab, Tabs } from 'react-bootstrap';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import { productionService } from '../../api/productionService';
import { getQaOrderStatusFromStages, getButtonForStage } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';
import { useWebSocketContext } from '../../context/WebSocketContext';

registerLocale('vi', vi);

const ITEMS_PER_PAGE = 10;

const QaOrderList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const qcUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');

  // Tab state
  const [activeTab, setActiveTab] = useState('main');

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

  // Fetch orders using useCallback for WebSocket refresh
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productionService.getQaOrders(qcUserId);

      if (!data || data.length === 0) {
        setOrders([]);
        return;
      }

      // Map backend data to match UI structure
      const mappedData = data.map(order => {
        // Use getQaOrderStatusFromStages for QA-specific order status per diagram
        const statusResult = getQaOrderStatusFromStages(order);

        // Find the stage assigned to this QA for button logic
        const qaStage = (order.stages || []).find(s =>
          s.qcAssigneeId === Number(qcUserId) ||
          s.qcAssignee?.id === Number(qcUserId)
        );

        return {
          id: order.id,
          lotCode: order.lotCode || order.poNumber || order.id,
          poNumber: order.poNumber, // Keep original poNumber for rework filtering
          productName: order.productName || order.contract?.contractNumber || 'N/A',
          size: order.size || '-',
          quantity: order.totalQuantity || 0,
          expectedStartDate: order.plannedStartDate || order.expectedStartDate,
          expectedFinishDate: order.plannedEndDate || order.expectedFinishDate,
          status: order.executionStatus,
          statusLabel: statusResult.label,
          statusVariant: statusResult.variant,
          qaStage: qaStage, // Store QA stage for button logic
          stages: order.stages || [], // FIX: Include stages for button logic
          // Get leader name from first stage
          leaderName: order.stages?.[0]?.assignedLeader?.fullName || order.stages?.[0]?.assigneeName || 'Chưa phân công'
        };
      });
      setOrders(mappedData);
    } catch (error) {
      console.error('Error fetching QA orders:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [qcUserId]);

  // WebSocket subscription for real-time updates
  const { subscribe } = useWebSocketContext();
  useEffect(() => {
    const unsubscribe = subscribe('/topic/updates', (update) => {
      if (['PRODUCTION_ORDER', 'PRODUCTION_STAGE', 'QUALITY_ISSUE'].includes(update.entity)) {
        console.log('[QaOrderList] Received update, refreshing...', update);
        fetchOrders();
      }
    });
    return () => unsubscribe();
  }, [subscribe, fetchOrders]);

  // Initial fetch
  useEffect(() => {
    if (qcUserId) {
      fetchOrders();
    } else {
      console.warn('QC User ID not found');
      setLoading(false);
    }
  }, [qcUserId, fetchOrders]);

  // Reset page when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDateFilter, statusFilter, activeTab]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch = !searchTerm ||
        (o.lotCode && o.lotCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.productName && o.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesDate = true;
      if (startDateFilter) {
        const orderDate = o.expectedStartDate;
        if (orderDate) {
          matchesDate = orderDate === startDateFilter;
        } else {
          matchesDate = false;
        }
      }

      // Filter by status
      let matchesStatus = true;
      if (statusFilter) {
        matchesStatus = o.statusLabel && o.statusLabel.includes(statusFilter);
      }

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [searchTerm, startDateFilter, statusFilter, orders]);

  // Split orders into main and rework
  const mainOrders = useMemo(() => {
    return filteredOrders.filter(o => !o.lotCode?.includes('-REWORK') && !o.poNumber?.includes('-REWORK'));
  }, [filteredOrders]);

  const reworkOrders = useMemo(() => {
    return filteredOrders.filter(o => o.lotCode?.includes('-REWORK') || o.poNumber?.includes('-REWORK'));
  }, [filteredOrders]);

  // Get currently active orders based on tab
  const activeOrders = activeTab === 'main' ? mainOrders : reworkOrders;

  // Sort and paginate
  const paginatedOrders = useMemo(() => {
    let sorted = [...activeOrders];

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
          case 'quantity':
            aValue = a.quantity || 0;
            bValue = b.quantity || 0;
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          case 'startDate':
            aValue = a.expectedStartDate || '';
            bValue = b.expectedStartDate || '';
            break;
          case 'status':
            // Sort by status priority for QA per diagram
            const getStatusPriority = (label) => {
              if (!label) return 99;
              // 1. Chuẩn bị làm - PM started but Leader hasn't
              if (label.includes('Chuẩn bị làm')) return 1;
              // 2. Đang làm - Leader in progress
              if (label === 'Đang làm') return 2;
              // 3. Chờ kiểm tra xxx - Leader completed 100%
              if (label.includes('Chờ kiểm tra')) return 3;
              // 4. Đang kiểm tra xxx - KCS started inspection
              if (label.includes('Đang kiểm tra')) return 4;
              // 5. xxx lỗi nhẹ
              if (label.includes('lỗi nhẹ')) return 5;
              // 6. xxx lỗi nặng
              if (label.includes('lỗi nặng')) return 6;
              // 7. Tạm dừng
              if (label.includes('Tạm dừng')) return 7;
              // 8. Hoàn thành
              if (label.includes('Hoàn thành')) return 8;
              return 99;
            };
            aValue = getStatusPriority(a.statusLabel);
            bValue = getStatusPriority(b.statusLabel);
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
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
  }, [activeOrders, sortColumn, sortDirection, currentPage]);

  const totalPages = Math.max(1, Math.ceil(activeOrders.length / ITEMS_PER_PAGE));

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

  const handleInspect = (order) => {
    navigate(`/qa/orders/${order.id}`);
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="qa" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <h3 className="mb-4" style={{ fontWeight: 600 }}>Danh sách đơn hàng cần kiểm tra</h3>

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
                        <option value="Chờ kiểm tra">Chờ kiểm tra</option>
                        <option value="Đang kiểm tra">Đang kiểm tra</option>
                        <option value="Đang làm">Đang làm</option>
                        <option value="Đang sản xuất bổ sung">Đang sản xuất bổ sung</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3"
            >
              <Tab eventKey="main" title="Lô sản xuất chính">
                <Card className="shadow-sm">
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
                          <th style={{ width: 120 }}>Hành động</th>
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
                                <strong>{order.lotCode || order.id}</strong>
                              </td>
                              <td>{order.productName}</td>
                              <td>{order.size}</td>
                              <td>{order.quantity.toLocaleString('vi-VN')}</td>
                              <td>{order.expectedStartDate}</td>
                              <td>{order.expectedFinishDate}</td>
                              <td>{order.leaderName}</td>
                              <td>
                                <Badge bg={order.statusVariant}>
                                  {order.statusLabel}
                                </Badge>
                              </td>
                              <td className="text-end">
                                {(() => {
                                  // Find stage needing inspection (prioritize WAITING_QC/QC_IN_PROGRESS)
                                  // FIX: Don't rely on qaStage (which requires qcAssigneeId match)
                                  const renderStage = order.stages?.find(s =>
                                    ['WAITING_QC', 'QC_IN_PROGRESS'].includes(s.executionStatus)
                                  ) || order.qaStage || order.stages?.find(s =>
                                    ['QC_FAILED', 'QC_PASSED'].includes(s.executionStatus));
                                  const stageStatus = renderStage ? ((renderStage.status === 'PAUSED' ? 'PAUSED' : renderStage.executionStatus) || renderStage.status) : (order.executionStatus || order.status);

                                  // DEBUG LOG
                                  console.log('QA Button Debug:', order.lotCode, 'stages:', order.stages?.map(s => s.executionStatus), 'renderStage:', renderStage?.executionStatus, 'stageStatus:', stageStatus);

                                  const btnConfig = getButtonForStage(stageStatus, 'kcs');

                                  // Navigate to check page directly for QC_IN_PROGRESS, otherwise to order detail
                                  const handleClick = () => {
                                    if (['WAITING_QC', 'QC_IN_PROGRESS'].includes(stageStatus) && renderStage?.stageType) {
                                      // Navigate directly to check page for inspection
                                      navigate(`/qa/orders/${order.id}/stages/${renderStage.stageType}/check`);
                                    } else {
                                      // Default: go to order detail
                                      navigate(`/qa/orders/${order.id}`);
                                    }
                                  };

                                  return (
                                    <Button
                                      size="sm"
                                      variant={btnConfig.variant}
                                      onClick={handleClick}
                                    >
                                      {btnConfig.text}
                                    </Button>
                                  );
                                })()}
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
              </Tab>
              <Tab eventKey="rework" title="Lô bổ sung (Sửa lỗi)">
                <Card className="shadow-sm">
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
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('status')}
                          >
                            Trạng thái {getSortIcon('status')}
                          </th>
                          <th style={{ width: 120 }}>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedOrders.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="text-center py-4">Không có đơn hàng bổ sung nào</td>
                          </tr>
                        ) : (
                          paginatedOrders.map((order, index) => (
                            <tr key={order.id}>
                              <td>{getRowNumber(index)}</td>
                              <td>
                                <strong>{order.lotCode || order.id}</strong>
                              </td>
                              <td>{order.productName}</td>
                              <td>{order.size}</td>
                              <td>{order.quantity.toLocaleString('vi-VN')}</td>
                              <td>{order.expectedStartDate}</td>
                              <td>{order.expectedFinishDate}</td>
                              <td>
                                <Badge bg={order.statusVariant}>
                                  {order.statusLabel}
                                </Badge>
                              </td>
                              <td className="text-end">
                                {(() => {
                                  // Find stage needing inspection (prioritize WAITING_QC/QC_IN_PROGRESS)
                                  // FIX: Don't rely on qaStage (which requires qcAssigneeId match)
                                  const renderStage = order.stages?.find(s =>
                                    ['WAITING_QC', 'QC_IN_PROGRESS'].includes(s.executionStatus)
                                  ) || order.qaStage || order.stages?.find(s =>
                                    ['QC_FAILED', 'QC_PASSED'].includes(s.executionStatus));
                                  const stageStatus = renderStage ? (renderStage.executionStatus || renderStage.status) : (order.executionStatus || order.status);

                                  // Get button configuration from shared helper
                                  // 'kcs' role triggers QA/KCS specific button logic (Inspect/Detail)
                                  const btnConfig = getButtonForStage(stageStatus, 'kcs');

                                  // Navigate to check page directly for QC_IN_PROGRESS, otherwise to order detail
                                  const handleClick = () => {
                                    if (['WAITING_QC', 'QC_IN_PROGRESS'].includes(stageStatus) && renderStage?.stageType) {
                                      // Navigate directly to check page for inspection
                                      navigate(`/qa/orders/${order.id}/stages/${renderStage.stageType}/check`);
                                    } else {
                                      // Default: go to order detail
                                      navigate(`/qa/orders/${order.id}`);
                                    }
                                  };

                                  return (
                                    <Button
                                      size="sm"
                                      variant={btnConfig.variant}
                                      onClick={handleClick}
                                    >
                                      {btnConfig.text}
                                    </Button>
                                  );
                                })()}
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
              </Tab>
            </Tabs>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QaOrderList;
