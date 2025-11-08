import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { rfqService } from '../../api/rfqService';
import { customerService } from '../../api/customerService';
import AssignRfqModal from '../../components/modals/AssignRfqModal';
import Pagination from '../../components/Pagination'; // Import Pagination component

const DirectorRfqList = () => {
  const [allRfqs, setAllRfqs] = useState([]); // Holds all RFQs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchRfqs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await rfqService.getDraftsUnassignedRfqs();

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

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

  const getStatusBadge = (status) => {
    const rfqStatus = status || 'DRAFT';
    switch (rfqStatus) {
      case 'DRAFT': return 'secondary';
      case 'SENT': return 'info';
      case 'PENDING_ASSIGNMENT': return 'warning';
      default: return 'light';
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
        <InternalSidebar userRole="director" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Quản lý Yêu cầu báo giá (RFQ)</h2>
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
                        {currentRfqs.length > 0 ? currentRfqs.map(rfq => (
                          <tr key={rfq.id}>
                            <td>{rfq.id}</td>
                            <td>{rfq.contactPerson || 'N/A'}</td>
                            <td>{new Date(rfq.createdAt).toLocaleDateString()}</td>
                            <td><Badge bg={getStatusBadge(rfq.status)}>{rfq.status}</Badge></td>
                            <td>
                              <Button variant="primary" size="sm" onClick={() => handleOpenAssignModal(rfq.id)}>
                                Phân công
                              </Button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="text-center">Không có RFQ nào chờ xử lý.</td>
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
