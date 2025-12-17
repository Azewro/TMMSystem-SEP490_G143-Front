import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import { productionPlanService } from '../../api/productionPlanService';
import { FaSync, FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import '../../styles/QuoteRequests.css';
import { getPlanningPlanStatus } from '../../utils/statusMapper';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'READY_FOR_PLANNING', label: 'Chờ tạo' },
  { value: 'DRAFT', label: 'Chờ gửi' },
  { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' }
];

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
    return value;
  }
};

const ProductionLots = () => {
  const navigate = useNavigate();
  const [productionLots, setProductionLots] = useState([]);
  const [filteredLots, setFilteredLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryDateFilter, setDeliveryDateFilter] = useState('');

  // Sort state
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

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

  const loadProductionLots = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await productionPlanService.getProductionLots('');
      const sortedData = Array.isArray(data)
        ? data.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          if (dateB.getTime() !== dateA.getTime()) {
            return dateB - dateA;
          }
          // Fallback to ID if dates are equal or missing (assuming higher ID = newer)
          return (b.id || 0) - (a.id || 0);
        })
        : [];
      setProductionLots(sortedData);
      setFilteredLots(sortedData);
    } catch (err) {
      console.error('Failed to fetch production lots', err);
      setError(err.message || 'Không thể tải danh sách lô sản xuất.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProductionLots();
  }, [loadProductionLots]);

  // Client-side filtering
  useEffect(() => {
    let result = [...productionLots];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(lot =>
        (lot.lotCode && lot.lotCode.toLowerCase().includes(lowerTerm)) ||
        (lot.productName && lot.productName.toLowerCase().includes(lowerTerm))
      );
    }

    if (statusFilter) {
      result = result.filter(lot => {
        // READY_FOR_PLANNING is stored in lot.status (lot has no plan yet)
        // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED are stored in lot.currentPlanStatus
        if (statusFilter === 'READY_FOR_PLANNING') {
          return lot.status === 'READY_FOR_PLANNING';
        }
        // For other statuses, check currentPlanStatus
        return lot.currentPlanStatus === statusFilter;
      });
    }

    if (deliveryDateFilter) {
      result = result.filter(lot => {
        const dateVal = lot.deliveryDateTarget || lot.contractDateMin;
        if (!dateVal) return false;
        const date = new Date(dateVal).toISOString().split('T')[0];
        return date === deliveryDateFilter;
      });
    }

    setFilteredLots(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, deliveryDateFilter, productionLots]);

  const indexOfLastLot = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstLot = indexOfLastLot - ITEMS_PER_PAGE;
  const currentLots = filteredLots.slice(indexOfFirstLot, indexOfLastLot);
  const totalPages = Math.ceil(filteredLots.length / ITEMS_PER_PAGE);

  // Sort currentLots based on sortColumn and sortDirection
  const sortedLots = useMemo(() => {
    if (!sortColumn) return currentLots;

    return [...currentLots].sort((a, b) => {
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
        case 'deliveryDate':
          aValue = a.deliveryDateTarget || a.contractDateMin || '';
          bValue = b.deliveryDateTarget || b.contractDateMin || '';
          break;
        default:
          return 0;
      }

      const comparison = String(aValue).localeCompare(String(bValue), 'vi');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [currentLots, sortColumn, sortDirection]);

  const handleEditPlan = async (lot) => {
    try {
      let planId = lot.currentPlanId;

      // If no plan exists, create one from the lot
      if (!planId) {
        const newPlan = await productionPlanService.createPlanFromLot(lot.id);
        planId = newPlan.id;
      }

      navigate(`/planning/production-plans/${planId}`);
    } catch (err) {
      console.error('Failed to create or navigate to plan', err);
      setError(err.message || 'Lỗi khi tạo kế hoạch sản xuất từ lô.');
    }
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="planning" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-2">Danh sách Lô sản xuất (Gộp tự động)</h2>
                <p className="text-muted mb-0">Hệ thống tự động gộp các đơn hàng có cùng sản phẩm, ngày giao và ngày ký (chênh lệch ±1 ngày) để tối ưu hóa kế hoạch sản xuất.</p>
              </div>
              <Button variant="outline-primary" onClick={loadProductionLots} disabled={loading}>
                <FaSync className={loading ? 'fa-spin' : ''} />
                <span className="ms-2">Làm mới</span>
              </Button>
            </div>

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
                          placeholder="Tìm theo mã lô, tên sản phẩm..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo ngày giao</Form.Label>
                      <div className="custom-datepicker-wrapper">
                        <DatePicker
                          selected={parseDateString(deliveryDateFilter)}
                          onChange={(date) => {
                            if (date) {
                              setDeliveryDateFilter(formatDateForBackend(date));
                            } else {
                              setDeliveryDateFilter('');
                            }
                          }}
                          onChangeRaw={(e) => {
                            if (e.target.value === '' || e.target.value === null) {
                              setDeliveryDateFilter('');
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
                        {STATUS_FILTER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}

            <Card>
              <Card.Header>
                <strong>Danh Sách Lô Sản Xuất</strong>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-5"><Spinner animation="border" /></div>
                ) : filteredLots.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    <p className="mb-1">Không tìm thấy lô sản xuất nào phù hợp.</p>
                  </Alert>
                ) : (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
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
                          <th>Tổng SL</th>
                          <th>Đơn hàng</th>
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('deliveryDate')}
                          >
                            Ngày giao {getSortIcon('deliveryDate')}
                          </th>
                          <th>Trạng thái kế hoạch</th>
                          <th className="text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedLots.map((lot) => {
                          const planStatus = lot.currentPlanStatus
                            ? getPlanningPlanStatus(lot.currentPlanStatus)
                            : null;

                          // Determine button text and variant based on status
                          // READY_FOR_PLANNING -> Tạo kế hoạch sản xuất (Success)
                          // Others -> Xem chi tiết (Secondary)
                          const isReady = lot.status === 'READY_FOR_PLANNING';
                          const buttonText = isReady ? 'Tạo kế hoạch sản xuất' : 'Xem chi tiết';
                          const buttonVariant = isReady ? 'success' : 'secondary';

                          return (
                            <tr key={lot.id}>
                              <td className="fw-semibold text-primary">{lot.lotCode}</td>
                              <td>{lot.productName}</td>
                              <td>{lot.sizeSnapshot || '—'}</td>
                              <td>{lot.totalQuantity?.toLocaleString('vi-VN')}</td>
                              <td>
                                {lot.orderNumbers && lot.orderNumbers.length > 0 ? (
                                  lot.orderNumbers.map((orderNum, idx) => (
                                    <Badge key={idx} bg="light" text="dark" className="me-1 border">
                                      {orderNum}
                                    </Badge>
                                  ))
                                ) : lot.contractNumbers && lot.contractNumbers.length > 0 ? (
                                  lot.contractNumbers.map((contractNum, idx) => (
                                    <Badge key={idx} bg="light" text="dark" className="me-1 border">
                                      {contractNum}
                                    </Badge>
                                  ))
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td>{formatDate(lot.deliveryDateTarget || lot.contractDateMin)}</td>

                              <td>
                                {planStatus ? (
                                  <Badge bg={planStatus.variant}>{planStatus.label}</Badge>
                                ) : isReady ? (
                                  <Badge style={{ backgroundColor: '#6f42c1' }}>Chờ tạo</Badge>
                                ) : (
                                  <span className="text-muted small">Chưa có</span>
                                )}
                              </td>
                              <td className="text-center">
                                <Button
                                  variant={buttonVariant}
                                  size="sm"
                                  onClick={() => handleEditPlan(lot)}
                                >
                                  {buttonText}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
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

export default ProductionLots;