import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../context/AuthContext';
import { rfqService } from '../../api/rfqService';
import { quotationService } from '../../api/quotationService';
import CustomerRfqDetailModal from '../../components/modals/CustomerRfqDetailModal';
import toast from 'react-hot-toast';
import '../../styles/CustomerQuoteRequests.css';
import { getCustomerRfqStatus } from '../../utils/statusMapper';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

const CustomerRfqs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState(null);

  const fetchCustomerRfqs = async () => {
    setLoading(true);
    setError('');
    try {
      // Convert 1-based page to 0-based for backend
      const page = currentPage - 1;
      const response = await rfqService.getRfqs({
        customerId: user.customerId,
        page,
        size: ITEMS_PER_PAGE,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        createdDate: createdDateFilter || undefined
      });

      // Handle PageResponse
      let rfqs = [];
      if (response && response.content) {
        rfqs = response.content;
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        rfqs = response;
        setTotalPages(1);
        setTotalElements(response.length);
      }

      // Backend already sorts by createdAt DESC, no need to sort again
      setRfqs(rfqs);
    } catch (err) {
      setError('Lỗi khi tải danh sách yêu cầu báo giá.');
    } finally {
      setLoading(false);
    }
  };

  // Format RFQ code: RFQ-{id}
  const formatRfqCode = (rfq) => {
    if (rfq.rfqNumber) {
      // If rfqNumber already has RFQ- prefix, return as is
      if (rfq.rfqNumber.startsWith('RFQ-')) {
        return rfq.rfqNumber;
      }
      // Otherwise add prefix
      return `RFQ-${rfq.rfqNumber}`;
    }
    return `RFQ-${rfq.id}`;
  };

  // Note: Search and filter are now server-side, no client-side filtering needed

  // Handle cancel RFQ
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

  // Handle view quotation - find quotation by RFQ ID and navigate to detail page
  const handleViewQuotation = async (rfq) => {
    try {
      setLoading(true);
      // Fetch all customer quotations to find the one matching this RFQ
      let quotationFound = null;
      let page = 0;
      const pageSize = 50; // Fetch larger pages to find the quotation faster
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

        // Find quotation matching this RFQ
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

  useEffect(() => {
    if (user && user.customerId) {
      fetchCustomerRfqs();
    } else if (!user) {
      setLoading(false);
      setError('Bạn cần đăng nhập để xem các yêu cầu báo giá.');
    }
  }, [user, currentPage, searchTerm, statusFilter, createdDateFilter]);

  useEffect(() => {
    // Reset to page 1 when filters change
    if (user && user.customerId) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter, createdDateFilter]);

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



  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'WAITING_CONFIRMATION', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'QUOTED', label: 'Chờ phê duyệt báo giá' },
    { value: 'CANCELED', label: 'Đã hủy' },
  ];

  return (
    <div>
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1 p-4 customer-quote-requests-page" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Yêu cầu báo giá đã gửi</h2>

            {/* Search and Filter */}
            <Card className="mb-3">
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Tìm theo mã RFQ..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={3}>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3}>
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
                  </Col>

                </Row>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                Danh sách các yêu cầu báo giá đã tạo
              </Card.Header>
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center p-5"><Spinner animation="border" /></div>
                ) : error ? (
                  <Alert variant="danger" className="m-3">{error}</Alert>
                ) : (
                  <>
                    <Table striped bordered hover responsive className="mb-0">
                      <thead>
                        <tr>
                          <th>Mã RFQ</th>
                          <th>Ngày Tạo</th>
                          <th>Trạng Thái</th>
                          <th>Hành Động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rfqs.length > 0 ? rfqs.map(rfq => {
                          const statusObj = getCustomerRfqStatus(rfq.status);
                          return (
                            <tr key={rfq.id}>
                              <td className="fw-semibold">{formatRfqCode(rfq)}</td>
                              <td>{new Date(rfq.createdAt).toLocaleDateString('vi-VN')}</td>
                              <td><Badge bg={statusObj.variant}>{statusObj.label}</Badge></td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(rfq.id)}>
                                    Chi tiết
                                  </Button>
                                  {/* Button điều kiện */}
                                  {rfq.status === 'QUOTED' && (
                                    <Button variant="success" size="sm" onClick={() => handleViewQuotation(rfq)}>
                                      Xem báo giá
                                    </Button>
                                  )}
                                  {rfq.status === 'DRAFT' && (
                                    <Button variant="danger" size="sm" onClick={() => handleCancelRfq(rfq.id)}>
                                      Hủy
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-muted">
                              {totalElements === 0 ? 'Bạn chưa có yêu cầu báo giá nào.' : 'Không tìm thấy yêu cầu báo giá nào.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                    {totalPages > 1 && (
                      <div className="p-3">
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

      {showModal && (
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
