import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { rfqService } from '../../api/rfqService';
import { customerService } from '../../api/customerService';
import AssignRfqModal from '../../components/modals/AssignRfqModal';
import Pagination from '../../components/Pagination';
import { getDirectorRfqStatus } from '../../utils/statusMapper';
import { FaSearch, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
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
    return `${year}-${month}-${day}`;
  }
  return null;
};

// Helper function to format date for display
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

const DirectorRfqList = () => {
  const [allRfqs, setAllRfqs] = useState([]); // Holds all RFQs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { subscribe } = useWebSocketContext();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Search, Filter and Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [createdDateFilter, setCreatedDateFilter] = useState('');
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

  const fetchRfqs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all RFQs (without pagination) to apply client-side filter/sort/paginate
      let allRfqsData = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const params = {
          page,
          size: ITEMS_PER_PAGE
        };

        if (searchTerm && searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        const response = await rfqService.getRfqs(params);

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

      // Filter out CANCELED RFQs
      let filteredRfqs = allRfqsData.filter(rfq => rfq.status !== 'CANCELED');

      // Filter by created date (client-side) - use date from rfqNumber for accuracy
      if (createdDateFilter) {
        filteredRfqs = filteredRfqs.filter(rfq => {
          // Priority 1: Use date from rfqNumber (most accurate, no timezone issues)
          const rfqDateFromNumber = getDateFromRfqNumber(rfq.rfqNumber);
          if (rfqDateFromNumber) {
            return rfqDateFromNumber === createdDateFilter;
          }
          // Priority 2: Fallback to createdAt
          if (!rfq.createdAt) return false;
          try {
            // Parse createdAt as UTC and convert to local date string
            const rfqDateObj = new Date(rfq.createdAt);
            // Use toLocaleDateString to get the correct local date
            const localDate = rfqDateObj.toLocaleDateString('sv-SE'); // YYYY-MM-DD format
            return localDate === createdDateFilter;
          } catch (e) {
            console.error('Error parsing date:', rfq.createdAt, e);
            return false;
          }
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
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi không xác định';
      setError('Lỗi khi tải danh sách RFQ: ' + errorMessage);
      setAllRfqs([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, createdDateFilter]); // Added dependencies to fetchRfqs

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  useEffect(() => {
    // Subscribe to RFQ updates
    const unsubscribe = subscribe('/topic/updates', (update) => {
      if (update.entity === 'RFQ') {
        console.log('RFQ List refresh triggered by WebSocket');
        fetchRfqs(); // Trigger silent refresh (loading state is managed inside fetchRfqs)
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribe, fetchRfqs]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, createdDateFilter]);

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

  const handleOpenAssignModal = (rfqId, viewMode = false) => {
    setSelectedRfqId(rfqId);
    setIsViewMode(viewMode);
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setSelectedRfqId(null);
    setShowAssignModal(false);
  };

  const handleAssignmentSuccess = () => {
    handleCloseAssignModal();
    fetchRfqs();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };



  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="director" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Quản lý Yêu cầu báo giá (RFQ)</h2>
            {/* Search and Filter */}
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
                          placeholder="Tìm theo mã RFQ, tên khách..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                          }}
                          onBlur={(e) => {
                            const normalized = e.target.value.trim().replace(/\s+/g, ' ');
                            if (normalized !== searchTerm) {
                              setSearchTerm(normalized);
                              setCurrentPage(1);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const normalized = searchTerm.trim().replace(/\s+/g, ' ');
                              if (normalized !== searchTerm) {
                                setSearchTerm(normalized);
                              }
                              setCurrentPage(1);
                            }
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
                </Row>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                Danh sách RFQ chờ xử lý
              </Card.Header>
              <Card.Body>
                {loading ? (
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
                            Mã RFQ {getSortIcon('rfqNumber')}
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
                            Ngày Tạo {getSortIcon('createdDate')}
                          </th>
                          <th>Trạng Thái</th>
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
                                const statusObj = getDirectorRfqStatus(rfq);
                                return <Badge bg={statusObj.variant}>{statusObj.label}</Badge>;
                              })()}
                            </td>
                            <td>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenAssignModal(rfq.id, true)}
                              >
                                Xem chi tiết
                              </Button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="text-center">
                              {totalElements === 0
                                ? 'Không có RFQ nào.'
                                : 'Không tìm thấy RFQ phù hợp với bộ lọc.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>

      {selectedRfqId && (
        <AssignRfqModal
          show={showAssignModal}
          onHide={handleCloseAssignModal}
          rfqId={selectedRfqId}
          onAssignmentSuccess={handleAssignmentSuccess}
          isViewMode={isViewMode}
        />
      )}
    </div>
  );
};

export default DirectorRfqList;
