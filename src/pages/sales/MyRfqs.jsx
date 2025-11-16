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
import toast from 'react-hot-toast';

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'SENT': return 'info';
      case 'FORWARDED_TO_PLANNING': return 'warning';
      case 'PRELIMINARY_CHECKED': return 'primary';
      case 'QUOTED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'secondary'; // Changed from 'light' to 'secondary' to avoid white color
    }
  };

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
      
      // Prepare status parameter - only include if it has a value
      const statusParam = statusFilter && statusFilter.trim() 
        ? statusFilter.trim() 
        : undefined;
      
      // If filtering by date, we need to fetch all pages and filter client-side
      // Otherwise, use pagination normally
      let allRfqsData = [];
      let totalPagesFromBackend = 1;
      let totalElementsFromBackend = 0;

      if (createdDateFilter) {
        // Fetch all pages when filtering by date (client-side filter)
        // This ensures pagination works correctly after filtering
        let page = 0;
        let hasMore = true;
        
        while (hasMore) {
          const response = await rfqService.getAssignedRfqsForSales(
            page, 
            ITEMS_PER_PAGE, 
            searchParam, 
            statusParam
          );
          
          let pageRfqs = [];
          if (response && response.content) {
            pageRfqs = response.content;
            if (page === 0) {
              totalPagesFromBackend = response.totalPages || 1;
              totalElementsFromBackend = response.totalElements || 0;
            }
          } else if (Array.isArray(response)) {
            pageRfqs = response;
          }

          // Filter by created date
          const filteredRfqs = pageRfqs.filter(rfq => {
            if (!rfq.createdAt) return false;
            const rfqDate = new Date(rfq.createdAt).toISOString().split('T')[0];
            return rfqDate === createdDateFilter;
          });

          allRfqsData = [...allRfqsData, ...filteredRfqs];
          
          // Check if there are more pages
          if (pageRfqs.length < ITEMS_PER_PAGE || page >= (totalPagesFromBackend - 1)) {
            hasMore = false;
          } else {
            page++;
          }
        }

        // Recalculate pagination for filtered results
        const totalFiltered = allRfqsData.length;
        const newTotalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
        setTotalPages(newTotalPages);
        setTotalElements(totalFiltered);

        // Apply pagination to filtered results
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        allRfqsData = allRfqsData.slice(startIndex, endIndex);
      } else {
        // Normal pagination without date filter
        const page = currentPage - 1;
        const response = await rfqService.getAssignedRfqsForSales(
          page, 
          ITEMS_PER_PAGE, 
          searchParam, 
          statusParam
        );
        
        if (response && response.content) {
          allRfqsData = response.content;
          setTotalPages(response.totalPages || 1);
          setTotalElements(response.totalElements || 0);
        } else if (Array.isArray(response)) {
          allRfqsData = response;
          setTotalPages(1);
          setTotalElements(response.length);
        }
      }

      const enrichedData = await Promise.all(
        (allRfqsData || []).map(async (rfq) => {
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
      const errorMessage = err.message || 'Lỗi khi tải danh sách RFQ của bạn.';
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

  const getStatusText = (status) => {
    switch (status) {
      case 'DRAFT': return 'Bản nháp';
      case 'SENT': return 'Chờ xác nhận';
      case 'FORWARDED_TO_PLANNING': return 'Đã chuyển Planning';
      case 'PRELIMINARY_CHECKED': return 'Đã kiểm tra sơ bộ';
      case 'QUOTED': return 'Đã báo giá';
      case 'REJECTED': return 'Đã từ chối';
      default: return status;
    }
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="sales" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Danh sách RFQ được giao</h2>
            <Card>
              <Card.Header>
                Các RFQ cần bạn xử lý
              </Card.Header>
              <Card.Body>
                {/* Search and Filter Section */}
                <Row className="mb-3">
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Tìm kiếm theo mã RFQ, tên khách hàng..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <Form.Label className="mb-1 small">Lọc theo ngày tạo</Form.Label>
                    <Form.Control
                      type="date"
                      value={createdDateFilter}
                      onChange={(e) => {
                        setCreatedDateFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="DRAFT">Bản nháp</option>
                      <option value="SENT">Chờ xác nhận</option>
                      <option value="FORWARDED_TO_PLANNING">Đã chuyển Planning</option>
                      <option value="PRELIMINARY_CHECKED">Đã kiểm tra sơ bộ</option>
                      <option value="QUOTED">Đã báo giá</option>
                      <option value="REJECTED">Đã từ chối</option>
                    </Form.Select>
                  </Col>
                </Row>
                {loading && !showModal ? (
                  <div className="text-center"><Spinner animation="border" /></div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Mã RFQ</th>
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
                              <Badge bg={getStatusBadge(rfq.status)}>
                                {getStatusText(rfq.status)}
                              </Badge>
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
                                ? 'Bạn không có RFQ nào cần xử lý.' 
                                : 'Không tìm thấy RFQ phù hợp với bộ lọc.'}
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
