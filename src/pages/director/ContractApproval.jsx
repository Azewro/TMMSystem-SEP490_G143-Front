import React, { useEffect, useState, useMemo } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Spinner, Badge, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar'; // Import sidebar
import { contractService } from '../../api/contractService';
import { quotationService } from '../../api/quotationService'; // Import quotationService
import { productionPlanService } from '../../api/productionPlanService'; // Import productionPlanService
import { customerService } from '../../api/customerService';
import Pagination from '../../components/Pagination';
import '../../styles/QuoteRequests.css';

const STATUS_LABELS = {
  PENDING_APPROVAL: { text: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { text: 'Đã duyệt', variant: 'success' },
  REJECTED: { text: 'Đã từ chối', variant: 'danger' }
};

const formatCurrency = (value) => {
  if (!value) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
    console.warn('Cannot parse date', value, error);
    return value;
  }
};

const DirectorContractApproval = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [quoteFileUrl, setQuoteFileUrl] = useState(''); // State for quote file URL
  const [decision, setDecision] = useState({ type: null, note: '' });
  const [processing, setProcessing] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');
  const [deliveryDateFilter, setDeliveryDateFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const loadContracts = async () => {
    setLoading(true);
    setError('');

    try {
      // Convert 1-based page to 0-based for backend
      const page = currentPage - 1;
      const response = await contractService.getDirectorPendingContracts(
        page, 
        ITEMS_PER_PAGE, 
        searchTerm || undefined, 
        statusFilter || undefined, 
        createdDateFilter || undefined, 
        deliveryDateFilter || undefined
      );
      
      // Handle PageResponse
      let contractsArray = [];
      if (response && response.content) {
        contractsArray = response.content;
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } else if (Array.isArray(response)) {
        contractsArray = response;
        setTotalPages(1);
        setTotalElements(response.length);
      }
      
      // Enrich contracts with customer info
      const enrichedContracts = await Promise.all(
        contractsArray.map(async (contract) => {
          if (contract.customerId) {
            try {
              const customer = await customerService.getCustomerById(contract.customerId);
              return {
                ...contract,
                customerName: customer.companyName || customer.contactPerson || 'N/A'
              };
            } catch (customerError) {
              console.error(`Failed to fetch customer for contract ${contract.id}`, customerError);
              return { ...contract, customerName: 'N/A' };
            }
          }
          return { ...contract, customerName: 'N/A' };
        })
      );
      
      setContracts(enrichedContracts);
    } catch (err) {
      console.error('Failed to fetch contracts', err);
      setError(err.message || 'Không thể tải danh sách hợp đồng chờ duyệt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [currentPage, searchTerm, statusFilter, createdDateFilter, deliveryDateFilter]);
  
  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, statusFilter, createdDateFilter, deliveryDateFilter]);

  const openContract = async (contract) => {
    setSelectedContract(contract);
    setDecision({ type: null, note: '' });
    setOrderDetails(null);
    setFileUrl('');
    setQuoteFileUrl('');
    setDetailsLoading(true);

    try {
      // Fetch essential details first
      const [details, contractUrl] = await Promise.all([
        contractService.getOrderDetails(contract.id),
        contractService.getContractFileUrl(contract.id),
      ]);

      setOrderDetails(details);
      if (contractUrl) {
        setFileUrl(contractUrl.startsWith('http') ? contractUrl : 'https://' + contractUrl);
      }

      // Fetch optional quote file URL separately and handle failure gracefully
      if (contract.quotationId) {
        try {
          const quoteUrl = await quotationService.getQuoteFileUrl(contract.quotationId);
          if (quoteUrl) {
            setQuoteFileUrl(quoteUrl.startsWith('http') ? quoteUrl : 'https://' + quoteUrl);
          }
        } catch (quoteUrlError) {
          console.error('Could not fetch quote file URL:', quoteUrlError);
          // Do not set a blocking error, just let the UI show that the file is missing.
        }
      }
    } catch (err) {
      console.error('Failed to load contract detail', err);
      setError(err.message || 'Không thể tải chi tiết hợp đồng.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedContract(null);
    setOrderDetails(null);
    setFileUrl('');
    setQuoteFileUrl('');
    setDecision({ type: null, note: '' });
  };

  const handleApprove = async () => {
    if (!selectedContract) return;
    const directorId = sessionStorage.getItem('userId');
    if (!directorId) {
      setError('Không tìm thấy thông tin giám đốc. Vui lòng đăng nhập lại.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Approve the contract
      await contractService.approveContract(selectedContract.id, directorId, decision.note.trim() || undefined);
      
      // The backend will now automatically merge the lot and create a plan.
      // We just need to show a success message.
      setSuccess('Đã phê duyệt hợp đồng. Hệ thống sẽ tự động tạo kế hoạch sản xuất và chuyển cho bộ phận Kế hoạch.');

      closeModal();
      loadContracts();
    } catch (err) {
      console.error('Approve contract failed', err);
      setError(err.message || 'Không thể phê duyệt hợp đồng.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (rejectionReason) => {
    if (!selectedContract) return;
    if (!rejectionReason || !rejectionReason.trim()) {
      setError('Vui lòng nhập lý do từ chối hợp đồng.');
      return;
    }

    const directorId = sessionStorage.getItem('userId');
    if (!directorId) {
      setError('Không tìm thấy thông tin giám đốc. Vui lòng đăng nhập lại.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      await contractService.rejectContract(selectedContract.id, directorId, rejectionReason.trim());
      setSuccess('Đã trả lại hợp đồng cho nhân viên kinh doanh.');
      closeModal();
      loadContracts();
    } catch (err) {
      console.error('Reject contract failed', err);
      setError(err.message || 'Không thể từ chối hợp đồng.');
    } finally {
      setProcessing(false);
    }
  };

  // Note: Search and filter are now server-side, no client-side filtering needed

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Đã từ chối' },
  ];

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="director" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Phê duyệt hợp đồng</h2>

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                {success}
              </Alert>
            )}

            {/* Search and Filters */}
            <Card className="mb-3">
              <Card.Body>
                <Row className="g-3">
                  <Col md={3}>
                    <InputGroup>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Tìm theo tên hợp đồng, tên khách hàng..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                        }}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={2}>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo ngày tạo</Form.Label>
                      <Form.Control
                        type="date"
                        value={createdDateFilter}
                        onChange={(e) => setCreatedDateFilter(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo ngày giao hàng</Form.Label>
                      <Form.Control
                        type="date"
                        value={deliveryDateFilter}
                        onChange={(e) => setDeliveryDateFilter(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                Danh sách hợp đồng đã được nhân viên kinh doanh upload
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th style={{ width: 180 }}>Tên hợp đồng</th>
                      <th style={{ width: 160 }}>Khách hàng</th>
                      <th style={{ width: 160 }}>Ngày tạo</th>
                      <th style={{ width: 160 }}>Ngày giao</th>
                      <th style={{ width: 160 }}>Trạng thái</th>
                      <th style={{ width: 160 }}>Tổng tiền</th>
                      <th style={{ width: 140 }} className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <Spinner animation="border" size="sm" className="me-2" /> Đang tải hợp đồng...
                        </td>
                      </tr>
                    ) : contracts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">
                          {totalElements === 0 ? 'Không có hợp đồng nào cần phê duyệt.' : 'Không tìm thấy hợp đồng nào phù hợp.'}
                        </td>
                      </tr>
                    ) : (
                      contracts.map((contract, index) => {
                        const statusConfig = STATUS_LABELS[contract.status] || STATUS_LABELS.PENDING_APPROVAL;
                        return (
                          <tr key={contract.id}>
                            <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                            <td className="fw-semibold text-primary">{contract.contractNumber}</td>
                            <td>{contract.customerName || 'N/A'}</td>
                            <td>{formatDate(contract.createdAt)}</td>
                            <td>{formatDate(contract.deliveryDate)}</td>
                            <td>
                              <Badge bg={statusConfig.variant}>{statusConfig.text}</Badge>
                            </td>
                            <td className="text-success fw-semibold">{formatCurrency(contract.totalAmount)}</td>
                            <td className="text-center">
                              <Button variant="primary" size="sm" onClick={() => openContract(contract)}>
                                Xem chi tiết
                              </Button>
                            </td>
                          </tr>
                        );
                      })
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
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>

      <Modal show={!!selectedContract} onHide={closeModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết hợp đồng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" /> Đang tải chi tiết...
            </div>
          ) : orderDetails ? (
            <>
              <div className="mb-3">
                <strong>Khách hàng:</strong> {orderDetails.customerInfo?.customerName}
              </div>
              <div className="mb-3">
                <strong>Số điện thoại:</strong> {orderDetails.customerInfo?.phoneNumber || '—'}
              </div>
              <Table size="sm" bordered>
                <thead className="table-light">
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.orderItems?.map((item, index) => (
                    <tr key={item.productId || index}>
                      <td>{item.productName}</td>
                      <td>{item.quantity?.toLocaleString('vi-VN')}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="mt-3 d-flex gap-2">
                {fileUrl ? (
                  <Button
                    variant="outline-secondary"
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Xem file hợp đồng
                  </Button>
                ) : (
                  <Alert variant="warning" className="py-2 px-3 mb-0">
                    Chưa có file hợp đồng.
                  </Alert>
                )}
                {quoteFileUrl ? (
                  <Button
                    variant="outline-info"
                    href={quoteFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Xem file báo giá
                  </Button>
                ) : (
                  <Alert variant="warning" className="py-2 px-3 mb-0">
                    Chưa có file báo giá.
                  </Alert>
                )}
              </div>
            </>
          ) : (
            <Alert variant="warning">Không thể tải chi tiết hợp đồng.</Alert>
          )}

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal} disabled={processing}>
            Đóng
          </Button>
          <Button 
            variant="danger" 
            onClick={() => {
              const reason = window.prompt('Vui lòng nhập lý do từ chối hợp đồng:');
              if (reason && reason.trim()) {
                handleReject(reason.trim());
              } else if (reason !== null) {
                // User clicked OK but didn't enter anything
                setError('Vui lòng nhập lý do từ chối hợp đồng.');
              }
            }} 
            disabled={processing}
          >
            {processing ? 'Đang xử lý...' : 'Từ chối'}
          </Button>
          <Button variant="success" onClick={handleApprove} disabled={processing}>
            {processing ? 'Đang xử lý...' : 'Phê duyệt'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DirectorContractApproval;