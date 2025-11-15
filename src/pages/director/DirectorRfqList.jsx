import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { rfqService } from '../../api/rfqService';
import { customerService } from '../../api/customerService';
import AssignRfqModal from '../../components/modals/AssignRfqModal';
import Pagination from '../../components/Pagination'; // Import Pagination component
import { FaSearch } from 'react-icons/fa';

const DirectorRfqList = () => {
  const [allRfqs, setAllRfqs] = useState([]); // Holds all RFQs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState(null);

  // Search, Filter and Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const fetchRfqs = async () => {
    setLoading(true);
    setError('');
    try {
      // Convert 1-based page to 0-based for backend
      const page = currentPage - 1;
      const response = await rfqService.getRfqs({ 
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
      console.error('Error fetching RFQs:', err);
      setError('Lỗi khi tải danh sách RFQ: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, [currentPage, searchTerm, statusFilter, createdDateFilter]);
  
  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, statusFilter, createdDateFilter]);

  const handleOpenAssignModal = (rfqId) => {
    setSelectedRfqId(rfqId);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return 'secondary'; // Gray
      case 'SENT': return 'info'; // Blue
      case 'FORWARDED_TO_PLANNING': return 'warning'; // Yellow
      case 'PRELIMINARY_CHECKED': return 'primary';
      case 'RECEIVED_BY_PLANNING': return 'info';
      case 'QUOTED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'secondary'; // Changed from 'light' to 'secondary' to avoid white color
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'DRAFT': return 'Chờ xử lý';
      case 'SENT': return 'Đã phân công';
      case 'FORWARDED_TO_PLANNING': return 'Đã chuyển Kế hoạch';
      case 'PRELIMINARY_CHECKED': return 'Đã kiểm tra sơ bộ';
      case 'RECEIVED_BY_PLANNING': return 'Kế hoạch đã nhận';
      case 'QUOTED': return 'Đã báo giá';
      case 'REJECTED': return 'Đã từ chối';
      default: return status;
    }
  };

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'DRAFT', label: 'Chờ xử lý' },
    { value: 'SENT', label: 'Đã phân công' },
    { value: 'FORWARDED_TO_PLANNING', label: 'Đã chuyển Kế hoạch' },
    { value: 'PRELIMINARY_CHECKED', label: 'Đã kiểm tra sơ bộ' },
    { value: 'RECEIVED_BY_PLANNING', label: 'Kế hoạch đã nhận' },
    { value: 'QUOTED', label: 'Đã báo giá' },
    { value: 'REJECTED', label: 'Đã từ chối' },
  ];

  // Note: Search and filter are now server-side, no client-side filtering needed

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
                <Row className="g-3">
                  <Col md={3}>
                    <InputGroup>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Tìm theo mã RFQ, tên khách..."
                        value={searchTerm}
                        onChange={(e) => {
                          const value = e.target.value.trim().replace(/\s+/g, ' ');
                          setSearchTerm(value);
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
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Form.Select>
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
                          <th>Mã RFQ</th>
                          <th>Tên Khách Hàng</th>
                          <th>Ngày Tạo</th>
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
                                <Button variant="primary" size="sm" onClick={() => handleOpenAssignModal(rfq.id)}>
                                  {rfq.status === 'DRAFT' ? 'Phân công' : 'Xem'}
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
        />
      )}
    </div>
  );
};

export default DirectorRfqList;
