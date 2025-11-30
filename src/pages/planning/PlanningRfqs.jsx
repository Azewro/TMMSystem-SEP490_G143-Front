import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { rfqService } from '../../api/rfqService';
import { customerService } from '../../api/customerService';
import Pagination from '../../components/Pagination';
import { getPlanningRfqStatus } from '../../utils/statusMapper';
import toast from 'react-hot-toast';

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

  const fetchPlanningRfqs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Convert 1-based page to 0-based for backend
      const page = currentPage - 1;
      const response = await rfqService.getAssignedRfqsForPlanning(
        page,
        ITEMS_PER_PAGE,
        searchTerm || undefined,
        statusFilter || undefined,
        createdDateFilter || undefined
      );

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
      setError('Lỗi khi tải danh sách RFQ.');
      toast.error('Lỗi khi tải danh sách RFQ.');
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

  // All filtering is now done server-side via API
  const filteredRfqs = allRfqs;

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
                        <option value="REJECTED">Từ chối</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="CANCELED">Đã hủy</option>
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
                        {filteredRfqs.length > 0 ? filteredRfqs.map(rfq => (
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
                              <Button variant="primary" size="sm" onClick={() => handleViewDetails(rfq.id)}>
                                Xem chi tiết
                              </Button>
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
    </div>
  );
};

export default PlanningRfqs;