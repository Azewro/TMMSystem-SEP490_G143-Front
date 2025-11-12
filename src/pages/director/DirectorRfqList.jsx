import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup } from 'react-bootstrap';
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

  // Search and Pagination state
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
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

  // Filtering and Pagination logic
  const filteredRfqs = allRfqs.filter(rfq => {
    const searchTermLower = searchTerm.toLowerCase();
    const rfqNumber = rfq.rfqNumber || '';
    const contactPerson = rfq.contactPerson || '';
    return (
      rfqNumber.toLowerCase().includes(searchTermLower) ||
      contactPerson.toLowerCase().includes(searchTermLower)
    );
  });

  const indexOfLastRfq = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstRfq = indexOfLastRfq - ITEMS_PER_PAGE;
  const currentRfqs = filteredRfqs.slice(indexOfFirstRfq, indexOfLastRfq);
  const totalPages = Math.ceil(filteredRfqs.length / ITEMS_PER_PAGE);

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
                <div className="d-flex justify-content-between align-items-center">
                  <span>Danh sách RFQ chờ xử lý</span>
                  <div style={{ width: '300px' }}>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Tìm theo mã RFQ, tên khách..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                    </InputGroup>
                  </div>
                </div>
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
                            <td>{rfq.rfqNumber}</td>
                            <td>{rfq.contactPerson || 'N/A'}</td>
                            <td>{new Date(rfq.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td><Badge bg={getStatusBadge(rfq.status)}>{rfq.status}</Badge></td>
                            <td>
                              <Button variant="primary" size="sm" onClick={() => handleOpenAssignModal(rfq.id)}>
                                Phân công
                              </Button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="text-center">Không có RFQ nào phù hợp.</td>
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
