import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge, Spinner, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { contractService } from '../../api/contractService';
import { quotationService } from '../../api/quotationService'; // Import quotationService
import { customerService } from '../../api/customerService'; // Import customerService
import Pagination from '../../components/Pagination'; // Import Pagination
import '../../styles/QuoteRequests.css';

const STATUS_LABELS = {
  DRAFT: { text: 'Chưa upload', variant: 'secondary' },
  PENDING_UPLOAD: { text: 'Chờ upload', variant: 'primary' },
  PENDING_APPROVAL: { text: 'Đang chờ duyệt', variant: 'warning' },
  APPROVED: { text: 'Đã duyệt', variant: 'success' },
  REJECTED: { text: 'Bị từ chối', variant: 'danger' }
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

const ContractUpload = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [file, setFile] = useState(null);
  const [quoteFile, setQuoteFile] = useState(null); // State for quote file
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Modal state for view details
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
  const [viewDetailsContract, setViewDetailsContract] = useState(null);
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false);
  const [viewDetailsData, setViewDetailsData] = useState(null);

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryDateFilter, setDeliveryDateFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadContracts = async () => {
    setLoading(true);
    setError('');

    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        setError('Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      const [userContracts, customersData] = await Promise.all([
        contractService.getContractsByAssignedSalesId(userId),
        customerService.getAllCustomers()
      ]);

      // Create customer map
      const customerMap = new Map();
      if (Array.isArray(customersData)) {
        customersData.forEach(c => {
          customerMap.set(c.id, c);
          customerMap.set(String(c.id), c);
          customerMap.set(Number(c.id), c);
        });
      } else if (customersData?.content) {
        customersData.content.forEach(c => {
          customerMap.set(c.id, c);
          customerMap.set(String(c.id), c);
          customerMap.set(Number(c.id), c);
        });
      }

      // Enrich contracts with customer info
      const enrichedContracts = Array.isArray(userContracts)
        ? userContracts.map(contract => {
            const customer = contract.customerId 
              ? (customerMap.get(contract.customerId) 
                  || customerMap.get(String(contract.customerId))
                  || customerMap.get(Number(contract.customerId)))
              : null;
            return {
              ...contract,
              customer: customer
            };
          })
        : [];

      // Sort by newest date first
      const sortedContracts = enrichedContracts.sort((a, b) => 
        new Date(b.contractDate || b.createdAt) - new Date(a.contractDate || a.createdAt)
      );
      setContracts(sortedContracts);
    } catch (err) {
      console.error('Failed to load contracts', err);
      setError(err.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  // Filtering logic
  const filteredContracts = useMemo(() => {
    let filtered = contracts;

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }
    // If no statusFilter, show all contracts (no filtering)

    // Filter by search term
    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm.trim().replace(/\s+/g, ' ').toLowerCase();
      filtered = filtered.filter(contract => {
        const contractNumber = (contract.contractNumber || '').trim().toLowerCase();
        return contractNumber.includes(normalizedSearch);
      });
    }

    // Filter by delivery date
    if (deliveryDateFilter) {
      filtered = filtered.filter(contract => {
        if (!contract.deliveryDate) return false;
        const contractDate = new Date(contract.deliveryDate).toISOString().split('T')[0];
        return contractDate === deliveryDateFilter;
      });
    }

    return filtered;
  }, [contracts, statusFilter, searchTerm, deliveryDateFilter]);

  // Pagination logic
  const indexOfLastContract = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstContract = indexOfLastContract - ITEMS_PER_PAGE;
  const currentContracts = filteredContracts.slice(indexOfFirstContract, indexOfLastContract);
  const totalPages = Math.ceil(filteredContracts.length / ITEMS_PER_PAGE);


  const openViewDetailsModal = async (contract) => {
    setViewDetailsContract(contract);
    setViewDetailsModalOpen(true);
    setViewDetailsLoading(true);
    setViewDetailsData(null);

    try {
      const details = await contractService.getOrderDetails(contract.id);
      setViewDetailsData(details);
    } catch (err) {
      console.error('Unable to load contract details', err);
      setError(err.message || 'Không thể tải chi tiết đơn hàng.');
    } finally {
      setViewDetailsLoading(false);
    }
  };

  const closeViewDetailsModal = () => {
    setViewDetailsModalOpen(false);
    setViewDetailsContract(null);
    setViewDetailsData(null);
  };

  const openUploadModal = async (contract) => {
    setSelectedContract(contract);
    setModalOpen(true);
    setFile(null);
    setQuoteFile(null);
    setNotes('');
    setOrderDetails(null);
    setDetailsLoading(true);

    try {
      const details = await contractService.getOrderDetails(contract.id);
      setOrderDetails(details);
    } catch (err) {
      console.error('Unable to load contract details', err);
      setError(err.message || 'Không thể tải chi tiết đơn hàng.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedContract(null);
    setOrderDetails(null);
    setFile(null);
    setQuoteFile(null);
    setNotes('');
  };

  const handleUpload = async () => {
    if (!selectedContract || !selectedContract.quotationId) {
        setError('Hợp đồng được chọn không hợp lệ hoặc thiếu ID báo giá.');
        return;
    }
    if (!file || !quoteFile) {
      setError('Vui lòng chọn file hợp đồng và file báo giá đã ký.');
      return;
    }

    const saleUserId = sessionStorage.getItem('userId');
    if (!saleUserId) {
      setError('Không tìm thấy thông tin nhân viên kinh doanh. Vui lòng đăng nhập lại.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const saleUserIdInt = parseInt(saleUserId, 10);
      const notesTrimmed = notes.trim() || '';

      // Perform both uploads in parallel
      await Promise.all([
        contractService.uploadSignedContract(
          selectedContract.id,
          file,
          notesTrimmed,
          saleUserIdInt
        ),
        quotationService.uploadSignedQuotation(
          selectedContract.quotationId,
          quoteFile
        )
      ]);

      setSuccess('Upload hợp đồng và báo giá thành công. Đang chờ giám đốc phê duyệt.');
      closeModal();
      loadContracts();
    } catch (err) {
      console.error('Upload signed files failed', err);
      setError(err.message || 'Không thể upload file.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="mb-0">Danh sách đơn hàng</h1>
            </div>

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

            <Card className="shadow-sm">
              <Card.Body>
                {/* Search and Filter Section */}
                <Row className="mb-3">
                  <Col md={4}>
                    <InputGroup>
                      <InputGroup.Text><FaSearch /></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Tìm kiếm theo mã đơn hàng..."
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
                      <option value="DRAFT">Chưa upload</option>
                      <option value="PENDING_UPLOAD">Chờ upload</option>
                      <option value="PENDING_APPROVAL">Đang chờ duyệt</option>
                      <option value="APPROVED">Đã duyệt</option>
                      <option value="REJECTED">Bị từ chối</option>
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1">Lọc theo ngày giao hàng</Form.Label>
                      <Form.Control
                        type="date"
                        value={deliveryDateFilter}
                        onChange={(e) => {
                          setDeliveryDateFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th style={{ width: 180 }}>Mã đơn hàng</th>
                      <th style={{ width: 160 }}>Tên khách hàng</th>
                      <th style={{ width: 140 }}>Số điện thoại</th>
                      <th style={{ width: 160 }}>Ngày giao hàng</th>
                      <th style={{ width: 160 }}>Trạng thái</th>
                      <th style={{ width: 160 }}>Tổng giá trị</th>
                      <th style={{ width: 160 }} className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <Spinner animation="border" size="sm" className="me-2" /> Đang tải đơn hàng...
                        </td>
                      </tr>
                    ) : currentContracts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-muted">
                          {contracts.length === 0 
                            ? 'Không có đơn hàng nào.' 
                            : 'Không tìm thấy đơn hàng phù hợp với bộ lọc.'}
                        </td>
                      </tr>
                    ) : (
                      currentContracts.map((contract, index) => {
                        const statusConfig = STATUS_LABELS[contract.status] || STATUS_LABELS.DRAFT;
                        return (
                          <tr key={contract.id}>
                            <td>{indexOfFirstContract + index + 1}</td>
                            <td className="fw-semibold text-primary">{contract.contractNumber}</td>
                            <td>{contract.customer?.contactPerson || contract.customer?.companyName || 'N/A'}</td>
                            <td>{contract.customer?.phoneNumber || 'N/A'}</td>
                            <td>{formatDate(contract.deliveryDate)}</td>
                            <td>
                              <Badge bg={statusConfig.variant}>{statusConfig.text}</Badge>
                            </td>
                            <td className="text-success fw-semibold">{formatCurrency(contract.totalAmount)}</td>
                            <td className="text-center">
                              <div className="d-flex gap-2 justify-content-center">
                                <Button
                                  variant="info"
                                  size="sm"
                                  onClick={() => openViewDetailsModal(contract)}
                                >
                                  Xem chi tiết
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => openUploadModal(contract)}
                                >
                                  {contract.status === 'REJECTED' ? 'Upload lại' : 'Upload hợp đồng'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </Card.Body>
              {totalPages > 1 && (
                <Card.Footer>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </Card.Footer>
              )}
            </Card>
          </Container>
        </div>
      </div>

      <Modal show={modalOpen} onHide={closeModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedContract?.status === 'REJECTED' ? 'Upload lại' : 'Upload hợp đồng và báo giá'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" /> Đang tải chi tiết đơn hàng...
            </div>
          ) : orderDetails ? (
            <div className="mb-4">
              <div className="mb-3">
                <strong>Mã hợp đồng:</strong> {orderDetails.contractNumber}
              </div>
              <div className="mb-3">
                <strong>Khách hàng:</strong> {orderDetails.customerInfo?.customerName}
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
            </div>
          ) : (
            <Alert variant="warning">Không tìm thấy chi tiết đơn hàng.</Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>File hợp đồng (PDF hoặc hình ảnh)</Form.Label>
            <Form.Control
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>File báo giá (PDF hoặc hình ảnh)</Form.Label>
            <Form.Control
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) => setQuoteFile(event.target.files?.[0] || null)}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Ghi chú gửi Giám đốc (tuỳ chọn)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={notes}
              placeholder="Ví dụ: Đã ký đóng dấu đầy đủ."
              onChange={(event) => setNotes(event.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal} disabled={submitting}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleUpload} disabled={submitting || !file || !quoteFile}>
            {submitting ? 'Đang upload...' : 'Upload'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Details Modal */}
      <Modal show={viewDetailsModalOpen} onHide={closeViewDetailsModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewDetailsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" /> Đang tải chi tiết đơn hàng...
            </div>
          ) : viewDetailsData && viewDetailsContract ? (
            <div>
              {/* Customer Information */}
              <Card className="mb-3">
                <Card.Header>
                  <strong>Thông tin khách hàng</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-2"><strong>Tên khách hàng:</strong> {viewDetailsContract.customer?.contactPerson || viewDetailsContract.customer?.companyName || viewDetailsData.customerInfo?.customerName || 'N/A'}</p>
                      <p className="mb-2"><strong>Công ty:</strong> {viewDetailsContract.customer?.companyName || viewDetailsData.customerInfo?.companyName || 'N/A'}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-2"><strong>Số điện thoại:</strong> {viewDetailsContract.customer?.phoneNumber || viewDetailsData.customerInfo?.phoneNumber || 'N/A'}</p>
                      <p className="mb-2"><strong>Email:</strong> {viewDetailsContract.customer?.email || viewDetailsData.customerInfo?.email || 'N/A'}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Order Information */}
              <Card className="mb-3">
                <Card.Header>
                  <strong>Thông tin đơn hàng</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-2"><strong>Mã đơn hàng:</strong> {viewDetailsContract.contractNumber || viewDetailsData.contractNumber}</p>
                      <p className="mb-2"><strong>Ngày giao hàng:</strong> {formatDate(viewDetailsContract.deliveryDate || viewDetailsData.deliveryDate)}</p>
                      <p className="mb-2"><strong>Tổng giá trị:</strong> <span className="text-success fw-semibold">{formatCurrency(viewDetailsContract.totalAmount || viewDetailsData.totalAmount)}</span></p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-2"><strong>Trạng thái:</strong> 
                        <Badge bg={STATUS_LABELS[viewDetailsContract.status]?.variant || 'secondary'} className="ms-2">
                          {STATUS_LABELS[viewDetailsContract.status]?.text || viewDetailsContract.status}
                        </Badge>
                      </p>
                    </Col>
                  </Row>
                  
                  {/* Order Items Table */}
                  {viewDetailsData.orderItems && viewDetailsData.orderItems.length > 0 && (
                    <div className="mt-3">
                      <h6 className="mb-2">Danh sách sản phẩm:</h6>
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
                          {viewDetailsData.orderItems.map((item, index) => (
                            <tr key={item.productId || index}>
                              <td>{item.productName}</td>
                              <td>{item.quantity?.toLocaleString('vi-VN')}</td>
                              <td>{formatCurrency(item.unitPrice)}</td>
                              <td>{formatCurrency(item.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Notes */}
              {(viewDetailsContract.directorApprovalNotes || viewDetailsData.notes) && (
                <Card>
                  <Card.Header>
                    <strong>Ghi chú</strong>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-0">{viewDetailsContract.directorApprovalNotes || viewDetailsData.notes}</p>
                  </Card.Body>
                </Card>
              )}
            </div>
          ) : (
            <Alert variant="warning">Không tìm thấy chi tiết đơn hàng.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeViewDetailsModal}>
            Đóng
          </Button>
          {viewDetailsContract && (
            <Button 
              variant="primary" 
              onClick={() => {
                closeViewDetailsModal();
                openUploadModal(viewDetailsContract);
              }}
            >
              {viewDetailsContract.status === 'REJECTED' ? 'Upload lại' : 'Upload hợp đồng'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ContractUpload;