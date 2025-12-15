import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import api from '../../api/apiConfig';
import { toast } from 'react-hot-toast';
import { getStageTypeName } from '../../utils/statusMapper';
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

// For Technical: Only 2 statuses matter
// - PENDING: QA sent defect, waiting for Tech to handle
// - PROCESSED: Tech has sent rework request or material request
const getTechStatus = (backendStatus) => {
  // PENDING means QA just sent it, Tech hasn't acted yet
  if (backendStatus === 'PENDING') {
    return { label: 'Chờ xử lý', variant: 'warning' };
  }
  // Any other status means Tech has already processed it
  return { label: 'Đã xử lý', variant: 'success' };
};

const SEVERITY_FILTERS = [
  { value: '', label: 'Tất cả mức độ' },
  { value: 'MINOR', label: 'Lỗi nhẹ' },
  { value: 'MAJOR', label: 'Lỗi nặng' },
];

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'PROCESSED', label: 'Đã xử lý' },
];

const TechnicalDefectList = () => {
  const navigate = useNavigate();
  const [allDefects, setAllDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/v1/production/tech/defects');
      setAllDefects(response.data);
    } catch (error) {
      console.error("Error fetching defects:", error);
      toast.error("Không thể tải danh sách lỗi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, severityFilter, dateFilter, statusFilter]);

  // Filter defects
  const filteredDefects = useMemo(() => {
    return allDefects.filter((defect) => {
      const matchesSearch = !searchTerm ||
        (defect.batchNumber && defect.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (defect.poNumber && defect.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (defect.productName && defect.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSeverity = !severityFilter || defect.severity === severityFilter;

      let matchesDate = true;
      if (dateFilter && defect.createdAt) {
        const defectDate = defect.createdAt.split('T')[0];
        matchesDate = defectDate === dateFilter;
      } else if (dateFilter) {
        matchesDate = false;
      }

      // Filter by status (for Technical: PENDING or not PENDING)
      let matchesStatus = true;
      if (statusFilter === 'PENDING') {
        matchesStatus = defect.status === 'PENDING';
      } else if (statusFilter === 'PROCESSED') {
        matchesStatus = defect.status !== 'PENDING';
      }

      return matchesSearch && matchesSeverity && matchesDate && matchesStatus;
    });
  }, [allDefects, searchTerm, severityFilter, dateFilter, statusFilter]);

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
          case 'productName':
            aValue = a.productName || '';
            bValue = b.productName || '';
            break;
          case 'stageType':
            aValue = getStageTypeName(a.stageType) || '';
            bValue = getStageTypeName(b.stageType) || '';
            break;
          case 'severity':
            aValue = a.severity || '';
            bValue = b.severity || '';
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
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
        <InternalSidebar userRole="technical" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <h3 className="mb-4" style={{ fontWeight: 600 }}>Danh sách lỗi cần xử lý</h3>

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
                      <Form.Label className="mb-1 small">Lọc theo mức độ lỗi</Form.Label>
                      <Form.Select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                      >
                        {SEVERITY_FILTERS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo trạng thái</Form.Label>
                      <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        {STATUS_FILTERS.map((option) => (
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

            <Card className="shadow-sm">
              <Card.Header>
                Danh sách lỗi từ KCS
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
                        onClick={() => handleSort('productName')}
                      >
                        Sản phẩm {getSortIcon('productName')}
                      </th>
                      <th>Kích thước</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('stageType')}
                      >
                        Công đoạn lỗi {getSortIcon('stageType')}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('severity')}
                      >
                        Mức độ {getSortIcon('severity')}
                      </th>
                      <th>Leader</th>
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
                      <th style={{ width: 100 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDefects.length === 0 ? (
                      <tr><td colSpan="10" className="text-center py-4">Không có lỗi nào</td></tr>
                    ) : (
                      paginatedDefects.map((defect, index) => {
                        const severity = severityConfig[defect.severity] || { label: defect.severity, variant: 'secondary' };
                        const status = getTechStatus(defect.status);
                        return (
                          <tr key={defect.id}>
                            <td>{getRowNumber(index)}</td>
                            <td><strong>{defect.batchNumber || defect.poNumber}</strong></td>
                            <td>{defect.productName || 'N/A'}</td>
                            <td>{defect.size || 'N/A'}</td>
                            <td>{getStageTypeName(defect.stageType)}</td>
                            <td>
                              <Badge bg={severity.variant}>{severity.label}</Badge>
                            </td>
                            <td>{defect.leaderName || 'Chưa phân công'}</td>
                            <td>
                              <Badge bg={status.variant}>{status.label}</Badge>
                            </td>
                            <td>{defect.createdAt ? new Date(defect.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                            <td>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => navigate(`/technical/defects/${defect.id}`)}
                              >
                                Chi tiết
                              </Button>
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
    </div>
  );
};

export default TechnicalDefectList;
