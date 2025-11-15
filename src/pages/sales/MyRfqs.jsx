import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { rfqService } from '../../api/rfqService';
import { customerService } from '../../api/customerService';
import Pagination from '../../components/Pagination';
import RFQDetailModal from '../../components/modals/RFQDetailModal';
import toast from 'react-hot-toast';

const MyRfqs = () => {
  const [allRfqs, setAllRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      default: return 'light';
    }
  };

  const fetchMyRfqs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Convert 1-based page to 0-based for backend
      const page = currentPage - 1;
      const response = await rfqService.getAssignedRfqsForSales(page, ITEMS_PER_PAGE, searchTerm || undefined, statusFilter || undefined);
      
      // Handle PageResponse
      let rfqs = [];
      if (response && response.content) {
        rfqs = response.content;
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        // Fallback for backward compatibility
        rfqs = response;
        setTotalPages(1);
        setTotalElements(response.length);
      }

      const enrichedData = await Promise.all(
        (rfqs || []).map(async (rfq) => {
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
      setError('Lỗi khi tải danh sách RFQ của bạn.');
      toast.error('Lỗi khi tải danh sách RFQ của bạn.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchMyRfqs();
  }, [fetchMyRfqs]);
  
  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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
                  <Col md={6}>
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
                  <Col md={4}>
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
                              <Button variant="primary" size="sm" onClick={() => handleViewDetails(rfq.id)}>
                                Xem chi tiết
                              </Button>
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
