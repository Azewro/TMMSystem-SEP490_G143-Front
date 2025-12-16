import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Modal, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import { productionService } from '../../api/productionService';
import { getStageTypeName } from '../../utils/statusMapper';
import api from '../../api/apiConfig';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

const ITEMS_PER_PAGE = 10;

const severityConfig = {
  MINOR: { label: 'Lỗi nhẹ', variant: 'warning' },
  MAJOR: { label: 'Lỗi nặng', variant: 'danger' },
};

// Status configuration per Leader Defect List diagram
// PROCESSED = Technical processed the issue and sent "Yêu cầu làm lại" to Leader
const statusConfig = {
  PENDING: { label: 'Chờ xử lý', variant: 'secondary', priority: 0 },
  PROCESSED: { label: 'Sẵn sàng sửa lỗi', variant: 'primary', priority: 1 },
  WAITING: { label: 'Chờ đến lượt sửa lỗi', variant: 'secondary', priority: 2 },
  IN_PROGRESS: { label: 'Đang xử lý', variant: 'info', priority: 3 },
  RESOLVED: { label: 'Đã xử lý', variant: 'success', priority: 4 },
};


const LeaderDefectList = () => {
  const navigate = useNavigate();
  const [allDefects, setAllDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingDefectId, setProcessingDefectId] = useState(null);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDefect, setPendingDefect] = useState(null);
  const [activeStagesInfo, setActiveStagesInfo] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
    fetchDefects();
  }, []);

  const fetchDefects = async () => {
    try {
      setLoading(true);
      const leaderUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      const data = await productionService.getLeaderDefects(leaderUserId);
      setAllDefects(data);
    } catch (err) {
      console.error('Error fetching defects:', err);
      toast.error('Không thể tải danh sách lỗi');
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, statusFilter]);

  // Filter defects
  const filteredDefects = useMemo(() => {
    return allDefects.filter((defect) => {
      const matchesSearch = !searchTerm ||
        (defect.batchNumber && defect.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (defect.poNumber && defect.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (defect.description && defect.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filter by status
      let matchesStatus = true;
      if (statusFilter) {
        const statusLabel = statusConfig[defect.status]?.label || defect.status;
        matchesStatus = statusLabel.includes(statusFilter);
      }

      // Filter by date
      let matchesDate = true;
      if (dateFilter && defect.createdAt) {
        const defectDate = defect.createdAt.split('T')[0];
        matchesDate = defectDate === dateFilter;
      } else if (dateFilter) {
        matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [allDefects, searchTerm, statusFilter, dateFilter]);

  // Sort and paginate
  const paginatedDefects = useMemo(() => {
    let sorted = [...filteredDefects];

    if (sortColumn) {
      sorted.sort((a, b) => {
        let aValue, bValue;

        switch (sortColumn) {
          case 'batchNumber':
            aValue = a.batchNumber || a.poNumber || '';
            bValue = b.batchNumber || b.poNumber || '';
            break;
          case 'stageType':
            aValue = getStageTypeName(a.stageType) || '';
            bValue = getStageTypeName(b.stageType) || '';
            break;
          case 'severity':
            aValue = a.severity === 'MAJOR' ? 1 : 2; // Major first
            bValue = b.severity === 'MAJOR' ? 1 : 2;
            const sevComparison = aValue - bValue;
            return sortDirection === 'asc' ? sevComparison : -sevComparison;
          case 'status':
            // Sort by status priority
            aValue = statusConfig[a.status]?.priority || 99;
            bValue = statusConfig[b.status]?.priority || 99;
            const statusComparison = aValue - bValue;
            return sortDirection === 'asc' ? statusComparison : -statusComparison;
          case 'createdAt':
            aValue = a.createdAt || '';
            bValue = b.createdAt || '';
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
  }, [filteredDefects, sortColumn, sortDirection, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredDefects.length / ITEMS_PER_PAGE));

  const getRowNumber = (index) => {
    return (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
  };

  const handleStartRework = async (defect) => {
    try {
      setProcessingDefectId(defect.id);

      // 1. Check if any stage is currently active
      const checkResult = await api.get(`/v1/production/stages/${defect.stageId}/check-rework`);

      if (checkResult.data.hasActiveStages) {
        // Store pending info and show confirmation modal
        setPendingDefect(defect);
        setActiveStagesInfo(checkResult.data);
        setShowConfirmModal(true);
      } else {
        // No active stages - start rework directly
        await startReworkAndNavigate(defect, false);
      }
    } catch (err) {
      console.error('Error checking before rework:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi kiểm tra trạng thái');
    } finally {
      setProcessingDefectId(null);
    }
  };

  const startReworkAndNavigate = async (defect, forceStop) => {
    try {
      const leaderUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      await api.post(`/v1/production/stages/${defect.stageId}/start-rework?leaderUserId=${leaderUserId}&forceStop=${forceStop}`);

      toast.success('Đã bắt đầu sửa lỗi');

      // Navigate to progress page
      navigate(`/leader/orders/${defect.orderId}/progress`, {
        state: {
          defectId: defect.id,
          severity: defect.severity
        }
      });
    } catch (err) {
      console.error('Error starting rework:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi bắt đầu sửa lỗi');
    }
  };

  const handleConfirmForceStop = async () => {
    setShowConfirmModal(false);
    if (pendingDefect) {
      await startReworkAndNavigate(pendingDefect, true);
    }
    setPendingDefect(null);
    setActiveStagesInfo(null);
  };

  const handleCancelForceStop = () => {
    setShowConfirmModal(false);
    setPendingDefect(null);
    setActiveStagesInfo(null);
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
        <InternalSidebar userRole="leader" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <h3 className="mb-4" style={{ fontWeight: 600 }}>
              Danh sách lỗi
            </h3>

            {/* Search and Filter Card */}
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Tìm kiếm</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control
                          placeholder="Tìm kiếm theo mã lô hoặc mô tả..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo ngày gửi</Form.Label>
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
                        <option value="Sẵn sàng sửa lỗi">Sẵn sàng sửa lỗi</option>
                        <option value="Chờ đến lượt sửa lỗi">Chờ đến lượt sửa lỗi</option>
                        <option value="Đang xử lý">Đang xử lý</option>
                        <option value="Đã xử lý">Đã xử lý</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Data Table Card */}
            <Card className="shadow-sm">
              <Card.Header>
                Danh sách lỗi được giao
              </Card.Header>
              <Card.Body>
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>STT</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('batchNumber')}
                      >
                        Mã lô {getSortIcon('batchNumber')}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('stageType')}
                      >
                        Công đoạn {getSortIcon('stageType')}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('severity')}
                      >
                        Mức độ {getSortIcon('severity')}
                      </th>
                      <th>Mô tả</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('status')}
                      >
                        Trạng thái {getSortIcon('status')}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('createdAt')}
                      >
                        Ngày gửi {getSortIcon('createdAt')}
                      </th>
                      <th style={{ width: 150 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDefects.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4">Không có lỗi nào</td>
                      </tr>
                    ) : (
                      paginatedDefects.map((defect, index) => {
                        const severity = severityConfig[defect.severity] || { label: defect.severity, variant: 'secondary' };
                        const status = statusConfig[defect.status] || { label: defect.status, variant: 'secondary' };
                        return (
                          <tr key={defect.id}>
                            <td>{getRowNumber(index)}</td>
                            <td><strong>{defect.batchNumber || defect.poNumber || 'N/A'}</strong></td>
                            <td>{getStageTypeName(defect.stageType)}</td>
                            <td>
                              <Badge bg={severity.variant}>{severity.label}</Badge>
                            </td>
                            <td>{defect.description || 'Không có mô tả'}</td>
                            <td>
                              <Badge bg={status.variant}>{status.label}</Badge>
                            </td>
                            <td>{defect.createdAt ? new Date(defect.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                            <td>
                              {defect.status === 'IN_PROGRESS' ? (
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  onClick={() => navigate(`/leader/orders/${defect.orderId}/progress`)}
                                >
                                  Cập nhật tiến độ
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  disabled={processingDefectId === defect.id || defect.status === 'RESOLVED'}
                                  onClick={() => handleStartRework(defect)}
                                >
                                  {processingDefectId === defect.id ? (
                                    <>
                                      <Spinner size="sm" animation="border" className="me-1" />
                                      Đang xử lý...
                                    </>
                                  ) : (
                                    'Tạm dừng và sửa lỗi'
                                  )}
                                </Button>
                              )}
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
          </Container>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={handleCancelForceStop} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận dừng đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activeStagesInfo && (
            <>
              <p>
                <strong>Đơn hàng đang chạy công đoạn {activeStagesInfo.stageTypeName || getStageTypeName(activeStagesInfo.stageType)}:</strong>
              </p>
              <ul>
                {activeStagesInfo.activeStages?.map((stage, idx) => (
                  <li key={idx}><strong>{stage.lotCode}</strong></li>
                ))}
              </ul>
              <p className="mt-3 text-danger">
                Bạn có muốn <strong>dừng</strong> các đơn hàng trên để tiến hành sửa lỗi không?
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelForceStop}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirmForceStop}>
            Xác nhận dừng và sửa lỗi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LeaderDefectList;
