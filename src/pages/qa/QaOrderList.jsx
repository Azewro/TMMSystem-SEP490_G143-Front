import React, { useState, useMemo, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Spinner, Row, Col, Tab, Tabs } from 'react-bootstrap';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import { productionService } from '../../api/productionService';
import { getProductionOrderStatusFromStages } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

const ITEMS_PER_PAGE = 10;

const QaOrderList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await productionService.getQaOrders(qcUserId);

        if (!data || data.length === 0) {
          setOrders([]);
          return;
        }

        // Map backend data to match UI structure
        const mappedData = data.map(order => {
          // Use getProductionOrderStatusFromStages for overall order status (like PM page)
          const statusResult = getProductionOrderStatusFromStages(order);

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
    };
    if (qcUserId) {
      fetchOrders();
    } else {
      console.warn('QC User ID not found');
      setLoading(false);
    }
  }, [qcUserId]);

  // Reset page when filters or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDateFilter, activeTab]);

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

      return matchesSearch && matchesDate;
    });
  }, [searchTerm, startDateFilter, orders]);

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
            aValue = a.statusLabel || '';
            bValue = b.statusLabel || '';
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
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleInspect(order)}
                                >
                                  Xem kế hoạch
                                </Button>
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
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleInspect(order)}
                                >
                                  Xem kế hoạch
                                </Button>
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
