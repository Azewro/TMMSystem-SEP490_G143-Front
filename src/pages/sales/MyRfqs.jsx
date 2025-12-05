import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
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

registerLocale('vi', vi);

const MyRfqs = () => {
  const navigate = useNavigate();
  const [allRfqs, setAllRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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



  const fetchMyRfqs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Prepare search parameter - only include if it has a value after trimming
      // Backend accepts any non-empty string (no minimum length requirement)
      const trimmedSearch = debouncedSearchTerm?.trim() || '';
      const searchParam = trimmedSearch.length > 0
        ? trimmedSearch
        : undefined;

      // Don't send statusFilter to backend - we'll filter client-side
      // because Sales status logic is based on mapped values, not backend status field

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
          undefined // Don't send status filter to backend
        );

        let pageRfqs = [];
        if (response && response.content) {
          pageRfqs = response.content;
        } else if (Array.isArray(response)) {
          pageRfqs = response;
        }

        allRfqsData = [...allRfqsData, ...pageRfqs];

        // Check if there are more pages
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

      // Filter by created date (client-side)
      if (createdDateFilter) {
        filteredRfqs = filteredRfqs.filter(rfq => {
          if (!rfq.createdAt) return false;
          const rfqDate = new Date(rfq.createdAt).toISOString().split('T')[0];
          return rfqDate === createdDateFilter;
        });
      }

      // Calculate pagination for filtered results
      const totalFiltered = filteredRfqs.length;
      const newTotalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
      setTotalPages(newTotalPages);
      setTotalElements(totalFiltered);

      // Apply pagination to filtered results
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedRfqs = filteredRfqs.slice(startIndex, endIndex);

      const enrichedData = await Promise.all(
        (paginatedRfqs || []).map(async (rfq) => {
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

      setAllRfqs(enrichedData);
    } catch (err) {
      console.error('Error fetching RFQs:', err);
      const errorMessage = err.message || 'Lỗi khi tải danh sách yêu cầu báo giá của bạn.';
      setError(errorMessage);
      toast.error(errorMessage);
      // Clear RFQs on error
      setAllRfqs([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, statusFilter, createdDateFilter]);

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
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, createdDateFilter]);

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
                          <th>Mã yêu cầu báo giá</th>
                          <th>Tên Khách Hàng</th>
                          <th>Ngày tạo</th>
                          <th>Trạng Thái</th>
                          <th>Hành Động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allRfqs.length > 0 ? allRfqs.map(rfq => (
                          <tr key={rfq.id}>
                            <td>{rfq.rfqNumber}</td>
                            <td>{rfq.contactPerson || 'N/A'}</td>
                            <td>{new Date(rfq.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td>
                              {(() => {
                                const statusObj = getSalesRfqStatus(rfq.status);
                                return (
                                  <div className="d-flex align-items-center gap-2">
                                    <Badge bg={statusObj.variant}>{statusObj.label}</Badge>
                                    {rfq.capacityStatus === 'INSUFFICIENT' && (
                                      <Badge bg="warning" text="dark">Không đủ năng lực</Badge>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                {rfq.status === 'QUOTED' && (
                                  <Button variant="success" size="sm" onClick={() => handleViewQuotation(rfq)}>
                                    Xem báo giá
                                  </Button>
                                )}
                                <Button variant="primary" size="sm" onClick={() => handleViewDetails(rfq.id)}>
                                  Xem chi tiết
                                </Button>
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
