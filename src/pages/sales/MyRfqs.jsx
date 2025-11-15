import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
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
      const data = await rfqService.getAssignedRfqsForSales();

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

      // Filter for SENT status and sort
      const sentRfqs = enrichedData.filter(rfq => rfq.status === 'SENT');
      const sortedData = sentRfqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setAllRfqs(sortedData);
    } catch (err) {
      setError('Lỗi khi tải danh sách RFQ của bạn.');
      toast.error('Lỗi khi tải danh sách RFQ của bạn.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRfqs();
  }, [fetchMyRfqs]);

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

  // Pagination logic
  const indexOfLastRfq = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstRfq = indexOfLastRfq - ITEMS_PER_PAGE;
  const currentRfqs = allRfqs.slice(indexOfFirstRfq, indexOfLastRfq);
  const totalPages = Math.ceil(allRfqs.length / ITEMS_PER_PAGE);

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
                        {currentRfqs.length > 0 ? currentRfqs.map(rfq => (
                          <tr key={rfq.id}>
                            <td>{rfq.rfqNumber}</td>
                            <td>{rfq.contactPerson || 'N/A'}</td>
                            <td>{new Date(rfq.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td>
                              <Badge bg={getStatusBadge(rfq.status)}>
                                {rfq.status === 'SENT' ? 'Chờ xác nhận' : rfq.status}
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
                            <td colSpan="5" className="text-center">Bạn không có RFQ nào cần xử lý.</td>
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
