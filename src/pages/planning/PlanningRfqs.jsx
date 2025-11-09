import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FORWARDED_TO_PLANNING': return 'warning';
      case 'RECEIVED_BY_PLANNING': return 'info';
      case 'QUOTED': return 'success';
      default: return 'light';
    }
  };

  const fetchPlanningRfqs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Use the new service function for planning
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

      const sortedData = (enrichedData || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    // Navigate to the detail page for planning
    navigate(`/planning/rfqs/${rfqId}`);
  };

  // Pagination logic
  const indexOfLastRfq = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstRfq = indexOfLastRfq - ITEMS_PER_PAGE;
  const currentRfqs = allRfqs.slice(indexOfFirstRfq, indexOfLastRfq);
  const totalPages = Math.ceil(allRfqs.length / ITEMS_PER_PAGE);

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
                            <td>{rfq.id}</td>
                            <td>{rfq.contactPerson || 'N/A'}</td>
                            <td>{new Date(rfq.createdAt).toLocaleDateString()}</td>
                            <td><Badge bg={getStatusBadge(rfq.status)}>{rfq.status}</Badge></td>
                            <td>
                              <Button variant="primary" size="sm" onClick={() => handleViewDetails(rfq.id)}>
                                Xem chi tiết
                              </Button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="text-center">Không có RFQ nào cần xử lý.</td>
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