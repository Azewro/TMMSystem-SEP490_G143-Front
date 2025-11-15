import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { rfqService } from '../../api/rfqService';
import { customerService } from '../../api/customerService';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';

const PlanningRfqs = () => {
  const navigate = useNavigate();
  const [allRfqs, setAllRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'SENT': return 'info';
      case 'FORWARDED_TO_PLANNING': return 'warning';
      case 'PRELIMINARY_CHECKED': return 'primary';
      case 'RECEIVED_BY_PLANNING': return 'info';
      case 'QUOTED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'light';
    }
  };

  const fetchPlanningRfqs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await rfqService.getAssignedRfqsForPlanning();

      const enrichedData = await Promise.all(
        (data || []).map(async (rfq) => {
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

      // Sort by newest first
      const sortedData = enrichedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setAllRfqs(sortedData);
    } catch (err) {
      setError('Lỗi khi tải danh sách RFQ.');
      toast.error('Lỗi khi tải danh sách RFQ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanningRfqs();
  }, [fetchPlanningRfqs]);

  const handleViewDetails = (rfqId) => {
    navigate(`/planning/rfqs/${rfqId}`);
  };

  // Filtering logic
  const filteredRfqs = useMemo(() => {
    let filtered = allRfqs;

    // Filter for RFQs that are ready for planning or being processed by planning
    // Include: FORWARDED_TO_PLANNING (chờ xử lý), RECEIVED_BY_PLANNING (đang xử lý), QUOTED (đã báo giá nhưng chưa gửi)
    filtered = filtered.filter(rfq => 
      rfq.status === 'FORWARDED_TO_PLANNING' || 
      rfq.status === 'RECEIVED_BY_PLANNING' || 
      rfq.status === 'QUOTED'
    );

    // Filter by status (if selected)
    if (statusFilter) {
      filtered = filtered.filter(rfq => rfq.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(rfq => {
        const rfqNumber = (rfq.rfqNumber || '').toLowerCase();
        const contactPerson = (rfq.contactPerson || '').toLowerCase();
        return rfqNumber.includes(searchLower) || contactPerson.includes(searchLower);
      });
    }

    // Filter by created date
    if (createdDateFilter) {
      filtered = filtered.filter(rfq => {
        if (!rfq.createdAt) return false;
        const rfqDate = new Date(rfq.createdAt).toISOString().split('T')[0];
        return rfqDate === createdDateFilter;
      });
    }

    return filtered;
  }, [allRfqs, statusFilter, searchTerm, createdDateFilter]);

  // Pagination logic
  const indexOfLastRfq = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstRfq = indexOfLastRfq - ITEMS_PER_PAGE;
  const currentRfqs = filteredRfqs.slice(indexOfFirstRfq, indexOfLastRfq);
  const totalPages = Math.ceil(filteredRfqs.length / ITEMS_PER_PAGE);

  const getStatusText = (status) => {
    switch (status) {
      case 'FORWARDED_TO_PLANNING': return 'Chờ xử lý';
      case 'RECEIVED_BY_PLANNING': return 'Đã tiếp nhận';
      case 'QUOTED': return 'Đã báo giá';
      default: return status;
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
            <Card>
              <Card.Header>
                Các RFQ được giao cho bộ phận Kế hoạch
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
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="FORWARDED_TO_PLANNING">Chờ xử lý</option>
                      <option value="RECEIVED_BY_PLANNING">Đã tiếp nhận</option>
                      <option value="QUOTED">Đã báo giá</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1">Lọc theo ngày tạo RFQ</Form.Label>
                      <Form.Control
                        type="date"
                        value={createdDateFilter}
                        onChange={(e) => {
                          setCreatedDateFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
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
                        {currentRfqs.length > 0 ? currentRfqs.map(rfq => (
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
                              {allRfqs.length === 0 
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
    </div>
  );
};

export default PlanningRfqs;