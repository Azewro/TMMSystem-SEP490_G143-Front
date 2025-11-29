import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge, Spinner, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { contractService } from '../../api/contractService';
import { quotationService } from '../../api/quotationService'; // Import quotationService
import { customerService } from '../../api/customerService'; // Import customerService
import { API_BASE_URL } from '../../utils/constants';
import Pagination from '../../components/Pagination'; // Import Pagination
import toast from 'react-hot-toast';
import '../../styles/QuoteRequests.css';

const getFileExtension = (url) => {
  if (!url) return '';
  const cleanUrl = url.split(/[?#]/)[0];
  const parts = cleanUrl.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const isPdf = (url) => getFileExtension(url) === 'pdf';
const isImage = (url) => ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(getFileExtension(url));
const isDocx = (url) => ['docx', 'doc'].includes(getFileExtension(url));

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

  // File viewing state
  const [fileUrl, setFileUrl] = useState('');
  const [quoteFileUrl, setQuoteFileUrl] = useState('');
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');

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
    setFileUrl('');
    setQuoteFileUrl('');

    try {
      // Fetch details and file URLs in parallel
      const [details, contractUrl] = await Promise.all([
        contractService.getOrderDetails(contract.id),
        contractService.getContractFileUrl(contract.id)
      ]);

      setViewDetailsData(details);

      if (contractUrl) {
        const apiPathIndex = contractUrl.indexOf('/api/');
        const relativeUrl = apiPathIndex !== -1 ? contractUrl.substring(apiPathIndex) : contractUrl;
        setFileUrl(relativeUrl);
      }

      // Fetch optional quote file URL
      if (contract.quotationId) {
        try {
          const quoteUrl = await quotationService.getQuoteFileUrl(contract.quotationId);
          if (quoteUrl) {
            const apiPathIndex = quoteUrl.indexOf('/api/');
            const relativeUrl = apiPathIndex !== -1 ? quoteUrl.substring(apiPathIndex) : quoteUrl;
            setQuoteFileUrl(relativeUrl);
          }
        } catch (quoteUrlError) {
          console.error('Could not fetch quote file URL:', quoteUrlError);
        }
      }

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
    setFileUrl('');
    setQuoteFileUrl('');
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

  const handleCloseFileViewer = () => {
    if (viewerUrl) {
      URL.revokeObjectURL(viewerUrl);
    }
    setShowFileViewer(false);
    setViewerUrl('');
  };

  const handleViewFile = async (url) => {
    if (!url || isDocx(url)) {
      if (isDocx(url)) {
        toast.error('File DOCX cần được tải về để xem');
      }
      return;
    }

    const toastId = toast.loading('Đang chuẩn bị file để xem...');
    try {
      // Construct full URL if it's a relative path (similar to customer)
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(fullUrl, { headers });

      if (!response.ok) {
        throw new Error('Không thể tải file.');
      }

      let blob = await response.blob();

      // Fix: Force content type based on extension if blob type is missing or generic
      const ext = getFileExtension(url);
      let mimeType = blob.type;

      if (!mimeType || mimeType === 'application/octet-stream') {
        if (ext === 'pdf') mimeType = 'application/pdf';
        else if (['png', 'jpg', 'jpeg'].includes(ext)) mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      }

      if (mimeType) {
        blob = new Blob([blob], { type: mimeType });
      }

      const objectUrl = URL.createObjectURL(blob);
      setViewerUrl(objectUrl);
      setShowFileViewer(true);
      toast.success('Đã mở file.', { id: toastId });

    } catch (error) {
      console.error('Error viewing file:', error);
      toast.error('Không thể mở file để xem.', { id: toastId });
    }
  };

  const renderActionButtons = (contract) => {
    const commonProps = {
      variant: "primary", // Changed to solid blue
      size: "sm",
      className: "w-100"
    };

    switch (contract.status) {
      case 'PENDING_UPLOAD':
        return (
          <Button {...commonProps} onClick={() => openUploadModal(contract)}>
            Upload hợp đồng
          </Button>
        );
      case 'APPROVED':
        return (
          <Button {...commonProps} onClick={() => openViewDetailsModal(contract)}>
            Xem chi tiết
          </Button>
        );
      case 'REJECTED':
        return (
          <Button {...commonProps} onClick={() => openUploadModal(contract)}>
            Upload lại
          </Button>
        );
      default:
        // For other statuses like PENDING_APPROVAL, show a generic view button
        return (
          <Button variant="secondary" size="sm" className="w-100" onClick={() => openViewDetailsModal(contract)}>
            Xem chi tiết
          </Button>
        );
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
                              {renderActionButtons(contract)}
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

      <Modal
        show={modalOpen}
        onHide={closeModal}
        size="lg"
        centered={!viewDetailsModalOpen}
        dialogClassName={viewDetailsModalOpen ? 'modal-side-by-side-right' : ''}
        backdrop={viewDetailsModalOpen ? false : true}
      >
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
      <Modal
        show={viewDetailsModalOpen}
        onHide={closeViewDetailsModal}
        size="lg"
        centered={!modalOpen}
        dialogClassName={modalOpen ? 'modal-side-by-side-left' : ''}
        backdrop={true}
      >
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
                <Card className="mb-3">
                  <Card.Header>
                    <strong>Ghi chú</strong>
                  </Card.Header>
                  <Card.Body>
                    <p className="mb-0">{viewDetailsContract.directorApprovalNotes || viewDetailsData.notes}</p>
                  </Card.Body>
                </Card>
              )}

              {/* File Preview Section */}
              <div className="d-flex gap-2 flex-wrap">
                {/* Contract File Buttons */}
                {fileUrl ? (
                  <>
                    <Button
                      variant="outline-secondary"
                      onClick={() => handleViewFile(fileUrl)}
                      disabled={isDocx(fileUrl)}
                      title={isDocx(fileUrl) ? 'File DOCX cần được tải về để xem' : 'Xem file hợp đồng'}
                    >
                      Xem file hợp đồng
                    </Button>
                    <Button
                      variant="secondary"
                      href={fileUrl.startsWith('http') ? fileUrl : `${API_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`}
                      download
                      onClick={(e) => {
                        // Ensure download works with authentication
                        const token = sessionStorage.getItem('token') || sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
                        if (token && !fileUrl.startsWith('http')) {
                          e.preventDefault();
                          const fullUrl = `${API_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                          fetch(fullUrl, {
                            headers: { 'Authorization': `Bearer ${token}` }
                          })
                            .then(res => res.blob())
                            .then(blob => {
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = fileUrl.split('/').pop() || 'contract.pdf';
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            })
                            .catch(err => {
                              console.error('Download error:', err);
                              toast.error('Không thể tải file');
                            });
                        }
                      }}
                    >
                      Tải về hợp đồng
                    </Button>
                  </>
                ) : (
                  <Alert variant="warning" className="py-2 px-3 mb-0">
                    Chưa có file hợp đồng.
                  </Alert>
                )}

                {/* Quote File Buttons */}
                {quoteFileUrl ? (
                  <>
                    <Button
                      variant="outline-info"
                      onClick={() => handleViewFile(quoteFileUrl)}
                      disabled={isDocx(quoteFileUrl)}
                      title={isDocx(quoteFileUrl) ? 'File DOCX cần được tải về để xem' : 'Xem file báo giá'}
                    >
                      Xem file báo giá
                    </Button>
                    <Button
                      variant="info"
                      href={quoteFileUrl.startsWith('http') ? quoteFileUrl : `${API_BASE_URL}${quoteFileUrl.startsWith('/') ? '' : '/'}${quoteFileUrl}`}
                      download
                      onClick={(e) => {
                        // Ensure download works with authentication
                        const token = sessionStorage.getItem('token') || sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
                        if (token && !quoteFileUrl.startsWith('http')) {
                          e.preventDefault();
                          const fullUrl = `${API_BASE_URL}${quoteFileUrl.startsWith('/') ? '' : '/'}${quoteFileUrl}`;
                          fetch(fullUrl, {
                            headers: { 'Authorization': `Bearer ${token}` }
                          })
                            .then(res => res.blob())
                            .then(blob => {
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = quoteFileUrl.split('/').pop() || 'quotation.pdf';
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            })
                            .catch(err => {
                              console.error('Download error:', err);
                              toast.error('Không thể tải file');
                            });
                        }
                      }}
                    >
                      Tải về báo giá
                    </Button>
                  </>
                ) : (
                  <Alert variant="warning" className="py-2 px-3 mb-0">
                    Chưa có file báo giá.
                  </Alert>
                )}
              </div>
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
                // Không đóng modal xem chi tiết, chỉ mở modal upload
                openUploadModal(viewDetailsContract);
              }}
            >
              {viewDetailsContract.status === 'REJECTED' ? 'Upload lại' : 'Upload hợp đồng'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* File Viewer Modal */}
      <Modal show={showFileViewer} onHide={handleCloseFileViewer} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Xem file</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '80vh' }}>
          {viewerUrl ? (
            <iframe src={viewerUrl} width="100%" height="100%" title="File Viewer" style={{ border: 'none' }}></iframe>
          ) : (
            <div className="text-center">Đang tải file...</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ContractUpload;