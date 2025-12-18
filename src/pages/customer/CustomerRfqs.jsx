import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../context/AuthContext';
import { rfqService } from '../../api/rfqService';
import { quotationService } from '../../api/quotationService';
import CustomerRfqDetailModal from '../../components/modals/CustomerRfqDetailModal';
import { getCustomerRfqStatus } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';
import { useWebSocketContext } from '../../context/WebSocketContext';

registerLocale('vi', vi);

// Helper function to extract date from rfqNumber (format: RFQ-YYYYMMDD-XXX)
const getDateFromRfqNumber = (rfqNumber) => {
  if (!rfqNumber) return null;
  const match = rfqNumber.match(/RFQ-(\d{4})(\d{2})(\d{2})-/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month}-${day}`; // Returns YYYY-MM-DD format
  }
  return null;
};

// Helper function to format date for display (from rfqNumber or fallback to createdAt)
const formatRfqDate = (rfq) => {
  const dateFromNumber = getDateFromRfqNumber(rfq.rfqNumber);
  if (dateFromNumber) {
    const [year, month, day] = dateFromNumber.split('-');
    return `${day}/${month}/${year}`;
  }
  if (rfq.createdAt) {
    return new Date(rfq.createdAt).toLocaleDateString('vi-VN');
  }
  return 'N/A';
};

const CustomerRfqs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allRfqs, setAllRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { subscribe } = useWebSocketContext();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

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

  const fetchCustomerRfqs = useCallback(async () => {
    if (!user || !user.customerId) {
      setLoading(false);
      setError('Bạn cần đăng nhập để xem các yêu cầu báo giá.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const trimmedSearch = debouncedSearchTerm?.trim() || '';
      const searchParam = trimmedSearch.length > 0 ? trimmedSearch : undefined;

      // Fetch all RFQs (without pagination) to apply client-side filtering
      let allRfqsData = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const response = await rfqService.getRfqs({
          customerId: user.customerId,
          page,
          size: ITEMS_PER_PAGE,
          search: searchParam,
          status: undefined // Don't send status filter to backend - filter client-side
        });

        let pageRfqs = [];
        if (response && response.content) {
          pageRfqs = response.content;
        } else if (Array.isArray(response)) {
          pageRfqs = response;
        }

        allRfqsData = [...allRfqsData, ...pageRfqs];

        if (pageRfqs.length < ITEMS_PER_PAGE) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // Filter by status (client-side)
      let filteredRfqs = allRfqsData;
      if (statusFilter) {
        filteredRfqs = filteredRfqs.filter(rfq => {
          const rawStatus = rfq.status;
          switch (statusFilter) {
            case 'WAITING_CONFIRMATION':
              return rawStatus === 'DRAFT' || rawStatus === 'SENT';
            case 'CONFIRMED':
              return rawStatus === 'PRELIMINARY_CHECKED' || rawStatus === 'FORWARDED_TO_PLANNING' || rawStatus === 'RECEIVED_BY_PLANNING' || rawStatus === 'CAPACITY_INSUFFICIENT';
            case 'QUOTED':
              return rawStatus === 'QUOTED';
            case 'CANCELED':
              return rawStatus === 'CANCELED' || rawStatus === 'REJECTED';
            default:
              return true;
          }
        });
      }

      // Filter by created date (client-side) - use date from rfqNumber for accuracy
      if (createdDateFilter) {
        filteredRfqs = filteredRfqs.filter(rfq => {
          const rfqDate = getDateFromRfqNumber(rfq.rfqNumber);
          if (!rfqDate) {
            if (!rfq.createdAt) return false;
            const fallbackDate = new Date(rfq.createdAt).toISOString().split('T')[0];
            return fallbackDate === createdDateFilter;
          }
          return rfqDate === createdDateFilter;
        });
      }

      // Store all filtered RFQs (without pagination) - pagination will be done after sorting
      setAllRfqs(filteredRfqs);

      // Calculate pagination for filtered results
      const totalFiltered = filteredRfqs.length;
      const newTotalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
      setTotalPages(newTotalPages);
      setTotalElements(totalFiltered);
    } catch (err) {
      console.error('Error fetching RFQs:', err);
      const errorMessage = err.message || 'Lỗi khi tải danh sách yêu cầu báo giá.';
      setError(errorMessage);
      toast.error(errorMessage);
      setAllRfqs([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [user, debouncedSearchTerm, statusFilter, createdDateFilter]);

  // Debounce search term
  useEffect(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      setDebouncedSearchTerm('');
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCustomerRfqs();
  }, [fetchCustomerRfqs]);

  useEffect(() => {
    // Subscribe to RFQ updates
    const unsubscribe = subscribe('/topic/updates', (update) => {
      if (update.entity === 'RFQ') {
        console.log('Customer RFQ List refresh triggered by WebSocket');
        fetchCustomerRfqs(); // Trigger silent refresh
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribe, fetchCustomerRfqs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, createdDateFilter]);

  // Sort and paginate the RFQs based on sortColumn, sortDirection, and currentPage
  const sortedRfqs = useMemo(() => {
    // First, sort all RFQs
    let sorted = [...allRfqs];

    if (sortColumn) {
      sorted.sort((a, b) => {
        let aValue, bValue;

        switch (sortColumn) {
          case 'rfqNumber':
            aValue = a.rfqNumber || '';
            bValue = b.rfqNumber || '';
            break;
          case 'createdDate':
            aValue = getDateFromRfqNumber(a.rfqNumber) || '';
            bValue = getDateFromRfqNumber(b.rfqNumber) || '';
            break;
          case 'status':
            // Sort theo độ ưu tiên cho khách hàng: QUOTED (Đã có báo giá - cần quyết định) lên đầu
            const getStatusGroup = (status) => {
              if (status === 'QUOTED') return 1; // Đã có báo giá - CẦN ACTION
              if (status === 'DRAFT' || status === 'SENT') return 2; // Chờ xác nhận
              if (status === 'PRELIMINARY_CHECKED' || status === 'FORWARDED_TO_PLANNING' || status === 'RECEIVED_BY_PLANNING') return 3; // Đã xác nhận
              if (status === 'REJECTED' || status === 'CANCELED') return 4; // Đã hủy
              return 99;
            };
            aValue = getStatusGroup(a.status);
            bValue = getStatusGroup(b.status);
            const statusComparison = aValue - bValue;
            return sortDirection === 'asc' ? statusComparison : -statusComparison;
          default:
            return 0;
        }

        const comparison = aValue.localeCompare(bValue, 'vi');
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Then, apply pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return sorted.slice(startIndex, endIndex);
  }, [allRfqs, sortColumn, sortDirection, currentPage]);

  const handleViewQuotation = async (rfq) => {
    try {
      setLoading(true);
      let quotationFound = null;
      let page = 0;
      const pageSize = 50;
      let hasMore = true;

      while (hasMore && !quotationFound) {
        const response = await quotationService.getCustomerQuotations(
          user.customerId,
          page,
          pageSize
        );

        let quotations = [];
        if (response && response.content) {
          quotations = response.content;
          hasMore = page < (response.totalPages - 1);
        } else if (Array.isArray(response)) {
          quotations = response;
          hasMore = false;
        }

        quotationFound = quotations.find(q =>
          q.rfqId === rfq.id ||
          q.rfq?.id === rfq.id ||
          (q.rfq && typeof q.rfq === 'object' && q.rfq.id === rfq.id)
        );

        if (!quotationFound && hasMore) {
          page++;
        }
      }

      if (quotationFound) {
        navigate(`/customer/quotations/${quotationFound.id}`);
      } else {
        toast.error('Không tìm thấy báo giá cho yêu cầu này');
      }
    } catch (error) {
      console.error('Error finding quotation:', error);
      toast.error('Lỗi khi tải thông tin báo giá');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRfq = async (rfqId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu báo giá này không?')) {
      return;
    }
    try {
      await rfqService.cancelRfq(rfqId);
      toast.success('Đã hủy yêu cầu báo giá thành công');
      fetchCustomerRfqs();
    } catch (error) {
      toast.error(error.message || 'Lỗi khi hủy yêu cầu báo giá');
    }
  };

  const handleViewDetails = (rfqId) => {
    setSelectedRfqId(rfqId);
    setShowModal(true);
  };

  const handleCloseModal = (refresh) => {
    setShowModal(false);
    setSelectedRfqId(null);
    if (refresh) {
      fetchCustomerRfqs();
    }
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Yêu cầu báo giá đã gửi</h2>
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
                          placeholder="Tìm kiếm theo mã yêu cầu báo giá..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo ngày tạo</Form.Label>
                      <div className="custom-datepicker-wrapper">
                        <DatePicker
                          selected={parseDateString(createdDateFilter)}
                          onChange={(date) => {
                            if (date) {
                              setCreatedDateFilter(formatDateForBackend(date));
                            } else {
                              setCreatedDateFilter('');
                            }
                            setCurrentPage(1);
                          }}
                          onChangeRaw={(e) => {
                            if (e.target.value === '' || e.target.value === null) {
                              setCreatedDateFilter('');
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
                        <option value="WAITING_CONFIRMATION">Chờ xác nhận</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="QUOTED">Đã có báo giá</option>
                        <option value="CANCELED">Đã hủy</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                Danh sách các yêu cầu báo giá đã tạo
              </Card.Header>
              <Card.Body>
                {loading && !showModal ? (
                  <div className="text-center"><Spinner animation="border" /></div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('rfqNumber')}
                          >
                            Mã yêu cầu báo giá {getSortIcon('rfqNumber')}
                          </th>
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('createdDate')}
                          >
                            Ngày tạo {getSortIcon('createdDate')}
                          </th>
                          <th
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => handleSort('status')}
                          >
                            Trạng Thái {getSortIcon('status')}
                          </th>
                          <th>Hành Động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRfqs.length > 0 ? sortedRfqs.map(rfq => {
                          const statusObj = getCustomerRfqStatus(rfq.status);
                          return (
                            <tr key={rfq.id}>
                              <td>{rfq.rfqNumber}</td>
                              <td>{formatRfqDate(rfq)}</td>
                              <td><Badge bg={statusObj.variant}>{statusObj.label}</Badge></td>
                              <td>
                                <div className="d-flex gap-2">
                                  <Button variant="primary" size="sm" onClick={() => handleViewDetails(rfq.id)}>
                                    Xem chi tiết
                                  </Button>
                                  {rfq.status === 'QUOTED' && (
                                    <Button variant="success" size="sm" onClick={() => handleViewQuotation(rfq)}>
                                      Xem báo giá
                                    </Button>
                                  )}
                                  {(rfq.status === 'DRAFT' || rfq.status === 'SENT') && (
                                    <Button variant="outline-danger" size="sm" onClick={() => handleCancelRfq(rfq.id)}>
                                      Hủy
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="4" className="text-center">
                              {totalElements === 0
                                ? 'Bạn chưa có yêu cầu báo giá nào.'
                                : 'Không tìm thấy yêu cầu báo giá phù hợp với bộ lọc.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>

      {selectedRfqId && (
        <CustomerRfqDetailModal
          rfqId={selectedRfqId}
          show={showModal}
          handleClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default CustomerRfqs;
