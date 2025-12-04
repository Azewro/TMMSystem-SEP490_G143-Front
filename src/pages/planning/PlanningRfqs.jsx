import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { rfqService } from '../../api/rfqService';
import { quotationService } from '../../api/quotationService';
import { customerService } from '../../api/customerService';
import Pagination from '../../components/Pagination';
import QuotationViewModal from '../../components/modals/QuotationViewModal';
import { getPlanningRfqStatus } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

const PlanningRfqs = () => {
  // Force HMR update
  const navigate = useNavigate();
  const [allRfqs, setAllRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');

  // Pagination state - Note: Backend uses 0-based page index
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Modal state
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  const fetchPlanningRfqs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Don't send statusFilter to backend - we'll filter client-side
      // because Planning status logic is based on mapped values, not backend status field

      // Fetch all RFQs
      let allRfqsData = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const response = await rfqService.getAssignedRfqsForPlanning(
          page,
          ITEMS_PER_PAGE,
          searchTerm || undefined,
          undefined, // Don't send statusFilter to backend
          undefined  // Don't send createdDateFilter to backend
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

      // Filter out RFQs that are not yet forwarded to Planning
      // Planning should only see: FORWARDED_TO_PLANNING, RECEIVED_BY_PLANNING, QUOTED, ACCEPTED, ORDER_CREATED, REJECTED, CANCELED
      // Hide: DRAFT, SENT, PRELIMINARY_CHECKED
      allRfqsData = allRfqsData.filter(rfq =>
        rfq.status !== 'DRAFT' &&
        rfq.status !== 'SENT' &&
        rfq.status !== 'PRELIMINARY_CHECKED' &&
        rfq.status !== 'CANCELED'
      );

      // Filter by Planning status (client-side based on getPlanningRfqStatus)
      let filteredRfqs = allRfqsData;
      if (statusFilter) {
        filteredRfqs = filteredRfqs.filter(rfq => {
          const statusObj = getPlanningRfqStatus(rfq);
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
      setError('Lỗi khi tải danh sách RFQ.');
      toast.error('Lỗi khi tải danh sách RFQ.');
      setAllRfqs([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, createdDateFilter]);

  useEffect(() => {
    fetchPlanningRfqs();
  }, [fetchPlanningRfqs]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, statusFilter, createdDateFilter]);

  const handleViewDetails = (rfqId) => {
    navigate(`/planning/rfqs/${rfqId}`);
  };

  const handleViewQuotation = async (rfq) => {
    try {
      const quotationsResponse = await quotationService.getAllQuotations(0, 1000);
      const quotations = quotationsResponse?.content || (Array.isArray(quotationsResponse) ? quotationsResponse : []);
      const quotation = quotations.find(q => q.rfqId === rfq.id || q.rfq?.id === rfq.id);

      if (quotation) {
        setSelectedQuotationId(quotation.id);
        setShowQuotationModal(true);
      } else {
        toast.error('Không tìm thấy báo giá cho yêu cầu này');
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Lỗi khi tải thông tin báo giá');
    }
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="planning" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Yêu cầu báo giá cần xử lý</h2>
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
                          placeholder="Tìm kiếm theo mã RFQ, tên khách hàng..."
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
                        <option value="WAITING_CREATE">Chờ tạo</option>
                        <option value="WAITING_CONFIRMATION">Chờ xác nhận</option>
                        <option value="REJECTED">Đã từ chối</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                Các RFQ được giao cho bộ phận Kế hoạch
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
                          <th>Mã RFQ</th>
                          <th>Tên Khách Hàng</th>
                          <th>Ngày tạo</th>
                          <th>Trạng thái</th>
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
                                const statusObj = getPlanningRfqStatus(rfq);
                                return <Badge bg={statusObj.variant}>{statusObj.label}</Badge>;
                              })()}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                {/* Show "Xem báo giá" button if RFQ has quotation (status: QUOTED, REJECTED, ACCEPTED, ORDER_CREATED) */}
                                {(rfq.status === 'QUOTED' || rfq.status === 'REJECTED' || rfq.status === 'ACCEPTED' || rfq.status === 'ORDER_CREATED') && (
                                  <Button variant="success" size="sm" onClick={() => handleViewQuotation(rfq)}>
                                    Xem bảng giá
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
                                ? 'Không có RFQ nào cần xử lý.'
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

      {/* Quotation View Modal */}
      <QuotationViewModal
        show={showQuotationModal}
        onHide={() => setShowQuotationModal(false)}
        quotationId={selectedQuotationId}
      />
    </div>
  );
};

export default PlanningRfqs;
