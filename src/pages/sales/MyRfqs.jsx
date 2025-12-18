import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { rfqService } from '../../api/rfqService';
import { customerService } from '../../api/customerService';
import { quotationService } from '../../api/quotationService';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import RFQDetailModal from '../../components/modals/RFQDetailModal';
import { getSalesRfqStatus } from '../../utils/statusMapper';
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
    // Parse YYYY-MM-DD and format to dd/MM/yyyy
    const [year, month, day] = dateFromNumber.split('-');
    return `${day}/${month}/${year}`;
  }
  // Fallback to createdAt if rfqNumber doesn't have date
  if (rfq.createdAt) {
    return new Date(rfq.createdAt).toLocaleDateString('vi-VN');
  }
  return 'N/A';
};

const MyRfqs = () => {
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // Initialize with empty string
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');

  // Pagination state - Note: Backend uses 0-based page index
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Sort state
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  // Handle sort click
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to asc
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



  const fetchMyRfqs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Prepare search parameter - only include if it has a value after trimming
      const trimmedSearch = debouncedSearchTerm?.trim() || '';
      const searchParam = trimmedSearch.length > 0 ? trimmedSearch : undefined;

      // Fetch all RFQs (without pagination) to apply client-side filtering
      let allRfqsData = [];

      // Fetch all pages
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const response = await rfqService.getAssignedRfqsForSales(
          page,
          ITEMS_PER_PAGE,
          searchParam,
          undefined
        );

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

      // Filter by Sales status (client-side based on getSalesRfqStatus)
      let filteredRfqs = allRfqsData;
      if (statusFilter) {
        filteredRfqs = filteredRfqs.filter(rfq => {
          const statusObj = getSalesRfqStatus(rfq.status);
          return statusObj.value === statusFilter;
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

      // Enrich with customer data
      const enrichedData = await Promise.all(
        (filteredRfqs || []).map(async (rfq) => {
          if (rfq.customerId) {
            try {
              const customer = await customerService.getCustomerById(rfq.customerId);
              return {
                ...rfq,
                contactPerson: rfq.contactPerson || customer.contactPerson || customer.companyName || 'N/A'
              };
            } catch (customerError) {
              console.error(`Failed to fetch customer for RFQ ${rfq.id}`, customerError);
              return { ...rfq, contactPerson: rfq.contactPerson || 'Không tìm thấy' };
            }
          }
          return rfq;
        })
      );

      // Store ALL filtered data - sorting and pagination will be done in useMemo
      setAllRfqs(enrichedData);

      // Update pagination info
      const totalFiltered = enrichedData.length;
      setTotalPages(Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE)));
      setTotalElements(totalFiltered);
    } catch (err) {
      console.error('Error fetching RFQs:', err);
      const errorMessage = err.message || 'Lỗi khi tải danh sách yêu cầu báo giá của bạn.';
      setError(errorMessage);
      toast.error(errorMessage);
      setAllRfqs([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, createdDateFilter]); // Removed currentPage

  // Debounce search term
  useEffect(() => {
    // If searchTerm is empty, update debouncedSearchTerm immediately
    // Otherwise, wait 500ms after user stops typing
    if (!searchTerm || searchTerm.trim() === '') {
      setDebouncedSearchTerm('');
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchMyRfqs();
  }, [fetchMyRfqs]);

  useEffect(() => {
    // Subscribe to RFQ updates
    const unsubscribe = subscribe('/topic/updates', (update) => {
      if (update.entity === 'RFQ') {
        console.log('Sales RFQ List refresh triggered by WebSocket');
        fetchMyRfqs(); // Trigger silent refresh
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribe, fetchMyRfqs]);

  useEffect(() => {
    // Reset to page 1 when filters change
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
          case 'contactPerson':
            aValue = a.contactPerson || '';
            bValue = b.contactPerson || '';
            break;
          case 'createdDate':
            aValue = getDateFromRfqNumber(a.rfqNumber) || '';
            bValue = getDateFromRfqNumber(b.rfqNumber) || '';
            break;
          case 'status':
            // Map backend status sang 4 nhóm frontend rồi sort
            const getStatusGroup = (status) => {
              if (status === 'DRAFT' || status === 'SENT') return 1; // Chờ xác nhận
              if (status === 'PRELIMINARY_CHECKED' || status === 'FORWARDED_TO_PLANNING' || status === 'RECEIVED_BY_PLANNING') return 2; // Đã xác nhận
              if (status === 'QUOTED') return 3; // Đã báo giá
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
      // Try to find quotation for this RFQ
      const quotationsResponse = await quotationService.getAllQuotations(0, 1000); // Get all quotations
      const quotations = quotationsResponse?.content || (Array.isArray(quotationsResponse) ? quotationsResponse : []);
      const quotation = quotations.find(q => q.rfqId === rfq.id || q.rfq?.id === rfq.id);

      if (quotation) {
        navigate(`/sales/quotations/${quotation.id}`);
      } else {
        toast.error('Không tìm thấy báo giá cho yêu cầu này');
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Lỗi khi tải thông tin báo giá');
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
      fetchMyRfqs();
    }
  };

  // Note: Search and filter are now server-side, no client-side filtering needed



  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="sales" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Danh sách yêu cầu báo giá</h2>
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
                          placeholder="Tìm kiếm theo mã yêu cầu báo giá, tên khách hàng..."
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
                              // Format to yyyy-MM-dd for backend/state compatibility
                              setCreatedDateFilter(formatDateForBackend(date));
                            } else {
                              setCreatedDateFilter('');
                            }
                            setCurrentPage(1);
                          }}
                          onChangeRaw={(e) => {
                            // Handle manual clear - when input is empty, reset filter
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
                        <option value="QUOTED">Đã báo giá</option>
                        <option value="CANCELED">Đã hủy</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                Các yêu cầu báo giá cần bạn xử lý
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
                            onClick={() => handleSort('contactPerson')}
                          >
                            Tên Khách Hàng {getSortIcon('contactPerson')}
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
                        {sortedRfqs.length > 0 ? sortedRfqs.map(rfq => (
                          <tr key={rfq.id}>
                            <td>{rfq.rfqNumber}</td>
                            <td>{rfq.contactPerson || 'N/A'}</td>
                            <td>{formatRfqDate(rfq)}</td>
                            <td>
                              {(() => {
                                const statusObj = getSalesRfqStatus(rfq);
                                return (
                                  <Badge bg={statusObj.variant}>{statusObj.label}</Badge>
                                );
                              })()}
                            </td>
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
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="text-center">
                              {totalElements === 0
                                ? 'Bạn không có yêu cầu báo giá nào cần xử lý.'
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
        <RFQDetailModal
          rfqId={selectedRfqId}
          show={showModal}
          handleClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default MyRfqs;
