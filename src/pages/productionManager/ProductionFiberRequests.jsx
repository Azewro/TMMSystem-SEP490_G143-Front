import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Badge, Button, Spinner, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import api from '../../api/apiConfig';
import { getStageTypeName } from '../../utils/statusMapper';
import { toast } from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

const ITEMS_PER_PAGE = 10;

const ProductionFiberRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      // Fetch ALL Material Requests (no status filter)
      const reqResponse = await api.get('/v1/execution/material-requisitions');
      setRequests(reqResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Status badge config
  const getStatusBadge = (status) => {
    const config = {
      PENDING: { bg: 'warning', text: 'Chờ duyệt' },
      APPROVED: { bg: 'success', text: 'Đã duyệt' },
      REJECTED: { bg: 'danger', text: 'Từ chối' },
      COMPLETED: { bg: 'info', text: 'Hoàn thành' }
    };
    const c = config[status] || { bg: 'secondary', text: status };
    return <Badge bg={c.bg}>{c.text}</Badge>;
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch = !searchTerm ||
        (req.lotCode && req.lotCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (req.requisitionNumber && req.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (req.requestedByName && req.requestedByName.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesDate = true;
      if (dateFilter && req.createdAt) {
        const reqDate = req.createdAt.split('T')[0];
        matchesDate = reqDate === dateFilter;
      } else if (dateFilter) {
        matchesDate = false;
      }

      return matchesSearch && matchesDate;
    });
  }, [requests, searchTerm, dateFilter]);

  // Sort and paginate
  const paginatedRequests = useMemo(() => {
    let sorted = [...filteredRequests];

    if (sortColumn) {
      sorted.sort((a, b) => {
        let aValue, bValue;

        switch (sortColumn) {
          case 'lotCode':
            aValue = a.lotCode || a.requisitionNumber || '';
            bValue = b.lotCode || b.requisitionNumber || '';
            break;
          case 'stageType':
            aValue = getStageTypeName(a.stageType) || a.stageName || '';
            bValue = getStageTypeName(b.stageType) || b.stageName || '';
            break;
          case 'requestedBy':
            aValue = a.requestedByName || a.requestedBy?.fullName || '';
            bValue = b.requestedByName || b.requestedBy?.fullName || '';
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
  }, [filteredRequests, sortColumn, sortDirection, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));

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
            <h3 className="mb-4" style={{ fontWeight: 600 }}>Danh sách yêu cầu cấp sợi</h3>

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
                          placeholder="Tìm kiếm theo mã lô, người yêu cầu..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo ngày yêu cầu</Form.Label>
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
                </Row>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Header>
                Danh sách yêu cầu cấp sợi
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
                        onClick={() => handleSort('stageType')}
                      >
                        Công đoạn {getSortIcon('stageType')}
                      </th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('requestedBy')}
                      >
                        Người yêu cầu {getSortIcon('requestedBy')}
                      </th>
                      <th>Ghi chú</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 120 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequests.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-4">Không có yêu cầu nào</td></tr>
                    ) : (
                      paginatedRequests.map((req, index) => (
                        <tr key={req.id}>
                          <td>{getRowNumber(index)}</td>
                          <td><strong>{req.lotCode || req.requisitionNumber}</strong></td>
                          <td>{getStageTypeName(req.stageType || req.stageName) || 'N/A'}</td>
                          <td>{req.requestedByName || req.requestedBy?.fullName || 'N/A'}</td>
                          <td>{req.notes || '—'}</td>
                          <td>{getStatusBadge(req.status)}</td>
                          <td>
                            <Button size="sm" variant="primary" onClick={() => navigate(`/production/fiber-requests/${req.id}`)}>
                              {req.status === 'PENDING' ? 'Xem & Duyệt' : 'Xem chi tiết'}
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
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionFiberRequests;
