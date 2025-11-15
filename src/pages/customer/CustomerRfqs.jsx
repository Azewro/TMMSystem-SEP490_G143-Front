import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../context/AuthContext';
import { rfqService } from '../../api/rfqService';
import { quoteService } from '../../api/quoteService';
import CustomerRfqDetailModal from '../../components/modals/CustomerRfqDetailModal';
import toast from 'react-hot-toast';
import '../../styles/CustomerQuoteRequests.css';

const CustomerRfqs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState(null);

  const fetchCustomerRfqs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await rfqService.getRfqs({ customerId: user.customerId });
      const sortedData = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRfqs(sortedData);
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

  // Filter and search RFQs
  const filteredRfqs = useMemo(() => {
    let filtered = [...rfqs];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(rfq => {
        const rfqCode = formatRfqCode(rfq).toLowerCase();
        const createdAt = new Date(rfq.createdAt).toLocaleDateString('vi-VN').toLowerCase();
        return rfqCode.includes(searchLower) || createdAt.includes(searchLower);
      });
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(rfq => rfq.status === statusFilter);
    }

    return filtered;
  }, [rfqs, searchTerm, statusFilter]);

  // Pagination
  const indexOfLastRfq = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstRfq = indexOfLastRfq - ITEMS_PER_PAGE;
  const currentRfqs = filteredRfqs.slice(indexOfFirstRfq, indexOfLastRfq);
  const totalPages = Math.ceil(filteredRfqs.length / ITEMS_PER_PAGE);

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

  // Handle view/approve quotation
  const handleViewQuotation = async (rfq) => {
    try {
      // Try to find quotation for this RFQ
      const quotations = await quoteService.getCustomerQuotations(user.customerId);
      const quotation = quotations.find(q => q.rfqId === rfq.id || q.rfq?.id === rfq.id);
      
      if (quotation) {
        navigate(`/customer/quotations/${quotation.id}`);
      } else {
        toast.error('Không tìm thấy báo giá cho yêu cầu này');
      }
    } catch (error) {
      toast.error('Lỗi khi tải thông tin báo giá');
    }
  };

  useEffect(() => {
    if (user && user.customerId) {
      fetchCustomerRfqs();
    } else if (!user) {
      setLoading(false);
      setError('Bạn cần đăng nhập để xem các yêu cầu báo giá.');
    }
  }, [user]);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return { variant: 'warning', label: 'Bản nháp' };
      case 'SENT': return { variant: 'info', label: 'Đã gửi' };
      case 'PRELIMINARY_CHECKED': return { variant: 'warning', label: 'Đã kiểm tra sơ bộ' };
      case 'FORWARDED_TO_PLANNING': return { variant: 'primary', label: 'Đã chuyển đến Planning' };
      case 'RECEIVED_BY_PLANNING': return { variant: 'primary', label: 'Đang xử lý' };
      case 'QUOTED': return { variant: 'success', label: 'Đã báo giá' };
      case 'ACCEPTED': return { variant: 'success', label: 'Đã chấp nhận' };
      case 'REJECTED': return { variant: 'danger', label: 'Đã từ chối' };
      case 'CANCELED': return { variant: 'dark', label: 'Đã hủy' };
      case 'PENDING': return { variant: 'warning', label: 'Chờ xử lý' };
      default: return { variant: 'warning', label: status || 'Không xác định' };
    }
  };

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'DRAFT', label: 'Bản nháp' },
    { value: 'SENT', label: 'Đã gửi' },
    { value: 'PRELIMINARY_CHECKED', label: 'Đã kiểm tra sơ bộ' },
    { value: 'FORWARDED_TO_PLANNING', label: 'Đã chuyển đến Planning' },
    { value: 'RECEIVED_BY_PLANNING', label: 'Đang xử lý' },
    { value: 'QUOTED', label: 'Đã báo giá' },
    { value: 'ACCEPTED', label: 'Đã chấp nhận' },
    { value: 'REJECTED', label: 'Đã từ chối' },
    { value: 'CANCELED', label: 'Đã hủy' },
  ];

  return (
    <div>
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1 p-4 customer-quote-requests-page" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Yêu cầu báo giá của tôi</h2>
            
            {/* Search and Filter */}
            <Card className="mb-3">
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Tìm theo mã RFQ, ngày tạo..."
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
                        {filteredRfqs.length > 0 ? currentRfqs.map(rfq => {
                          const rfqStatus = rfq.status || 'DRAFT';
                          const badge = getStatusBadge(rfqStatus);
                          return (
                            <tr key={rfq.id}>
                              <td className="fw-semibold">{formatRfqCode(rfq)}</td>
                              <td>{new Date(rfq.createdAt).toLocaleDateString('vi-VN')}</td>
                              <td><Badge bg={badge.variant}>{badge.label}</Badge></td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(rfq.id)}>
                                    Chi tiết
                                  </Button>
                                  {/* Button điều kiện */}
                                  {rfqStatus === 'ACCEPTED' && (
                                    <Button variant="success" size="sm" onClick={() => handleViewQuotation(rfq)}>
                                      Xem báo giá
                                    </Button>
                                  )}
                                  {rfqStatus === 'QUOTED' && (
                                    <Button variant="success" size="sm" onClick={() => handleViewQuotation(rfq)}>
                                      Phê duyệt báo giá
                                    </Button>
                                  )}
                                  {rfqStatus === 'DRAFT' && (
                                    <Button variant="danger" size="sm" onClick={() => handleCancelRfq(rfq.id)}>
                                      Hủy RFQ
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-muted">
                              {rfqs.length === 0 ? 'Bạn chưa có yêu cầu báo giá nào.' : 'Không tìm thấy yêu cầu báo giá nào.'}
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
