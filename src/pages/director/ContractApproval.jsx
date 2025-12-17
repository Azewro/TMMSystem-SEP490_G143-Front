import React, { useEffect, useState, useMemo } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Spinner, Badge, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch, FaDownload, FaEye, FaFileContract, FaFileInvoiceDollar, FaExclamationTriangle } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { contractService } from '../../api/contractService';
import { quotationService } from '../../api/quotationService';
import { customerService } from '../../api/customerService';
import { API_BASE_URL } from '../../utils/constants';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import '../../styles/QuoteRequests.css';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

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
  const [allContracts, setAllContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [quoteFileUrl, setQuoteFileUrl] = useState('');
  const [decision, setDecision] = useState({ type: null, note: '' });
  const [processing, setProcessing] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryDateFilter, setDeliveryDateFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // State for file viewer modal
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');

  const loadContracts = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch ALL contracts for frontend filtering (using a large size)
      const response = await contractService.getAllContracts(0, 1000);

      // Handle PageResponse
      let contractsArray = [];
      if (response && response.content) {
        contractsArray = response.content;
      } else if (Array.isArray(response)) {
        contractsArray = response;
      }

      // Enrich contracts with customer info
      const enrichedContracts = await Promise.all(
        contractsArray.map(async (contract) => {
          if (contract.customerId) {
            try {
              const customer = await customerService.getCustomerById(contract.customerId);
              return {
                ...contract,
                customerName: customer.contactPerson || customer.companyName || 'N/A'
              };
            } catch (customerError) {
              console.error(`Failed to fetch customer for contract ${contract.id}`, customerError);
              return { ...contract, customerName: 'N/A' };
            }
          }
          return { ...contract, customerName: 'N/A' };
        })
      );

      setAllContracts(enrichedContracts);
      setFilteredContracts(enrichedContracts);
    } catch (err) {
      console.error('Failed to fetch contracts', err);
      setError(err.message || 'Không thể tải danh sách hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  // Frontend Filtering Logic
  useEffect(() => {
    let result = [...allContracts];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(c =>
        (c.contractNumber && c.contractNumber.toLowerCase().includes(lowerTerm)) ||
        (c.customerName && c.customerName.toLowerCase().includes(lowerTerm))
      );
    }

    if (statusFilter) {
      result = result.filter(c => c.status === statusFilter);
    }

    if (deliveryDateFilter) {
      result = result.filter(c => {
        if (!c.deliveryDate) return false;
        const date = new Date(c.deliveryDate).toISOString().split('T')[0];
        return date === deliveryDateFilter;
      });
    }

    setFilteredContracts(result);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [searchTerm, statusFilter, deliveryDateFilter, allContracts]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredContracts.length / ITEMS_PER_PAGE);
  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContracts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredContracts, currentPage]);

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
        const apiPathIndex = contractUrl.indexOf('/api/');
        const relativeUrl = apiPathIndex !== -1 ? contractUrl.substring(apiPathIndex) : contractUrl;
        setFileUrl(relativeUrl);
      }

      // Fetch optional quote file URL separately
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
      console.error('Failed to load contract detail', err);
      setError(err.message || 'Không thể tải chi tiết hợp đồng.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedContract(null);
    // setOrderDetails(null); // Keep details to prevent flash
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
      await contractService.approveContract(selectedContract.id, directorId, decision.note.trim() || undefined);
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
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(fullUrl, { headers });

      if (!response.ok) {
        throw new Error('Không thể tải file.');
      }

      let blob = await response.blob();
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
                          placeholder="Tìm theo Mã đơn hàng, tên khách hàng..."
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
                      <Form.Label className="mb-1 small">Lọc theo trạng thái</Form.Label>
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
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo ngày giao hàng</Form.Label>
                      <div className="custom-datepicker-wrapper">
                        <DatePicker
                          selected={parseDateString(deliveryDateFilter)}
                          onChange={(date) => {
                            if (date) {
                              // Format to yyyy-MM-dd for backend/state compatibility
                              setDeliveryDateFilter(formatDateForBackend(date));
                            } else {
                              setDeliveryDateFilter('');
                            }
                            setCurrentPage(1);
                          }}
                          dateFormat="dd/MM/yyyy"
                          locale="vi"
                          className="form-control"
                          placeholderText="dd/mm/yyyy"
                          isClearable
                          todayButton="Hôm nay"
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                Danh sách hợp đồng đã được nhân viên kinh doanh upload
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-5"><Spinner animation="border" /></div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>#</th>
                          <th style={{ width: 180 }}>Mã đơn hàng</th>
                          <th style={{ width: 160 }}>Khách hàng</th>
                          <th style={{ width: 160 }}>Ngày tạo</th>
                          <th style={{ width: 160 }}>Ngày giao</th>
                          <th style={{ width: 160 }}>Trạng thái</th>
                          <th style={{ width: 160 }}>Tổng tiền</th>
                          <th style={{ width: 140 }} className="text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedContracts.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-4 text-muted">
                              {filteredContracts.length === 0 ? 'Không tìm thấy hợp đồng nào phù hợp.' : 'Danh sách trống.'}
                            </td>
                          </tr>
                        ) : (
                          paginatedContracts.map((contract, index) => {
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
                      <div className="mt-3">
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

      <Modal show={!!selectedContract} onHide={closeModal} size="lg" centered className="contract-detail-modal">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold text-primary">
            {selectedContract?.contractNumber}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {detailsLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Đang tải thông tin chi tiết...</p>
            </div>
          ) : orderDetails ? (
            <div className="d-flex flex-column gap-4">
              {/* Customer & Order Info */}
              <Card className="border-0 shadow-sm bg-light">
                <Card.Body>
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="text-muted small text-uppercase fw-bold mb-1">Khách hàng</div>
                      <div className="fw-medium fs-5">{orderDetails.customerInfo?.customerName}</div>
                      <div className="text-muted"><small>SĐT:</small> {orderDetails.customerInfo?.phoneNumber || '—'}</div>
                    </Col>
                    <Col md={6}>
                      <Row>
                        <Col xs={6}>
                          <div className="text-muted small text-uppercase fw-bold mb-1">Ngày tạo</div>
                          <div>{formatDate(selectedContract?.createdAt)}</div>
                        </Col>
                        <Col xs={6}>
                          <div className="text-muted small text-uppercase fw-bold mb-1">Ngày giao</div>
                          <div>{formatDate(selectedContract?.deliveryDate)}</div>
                        </Col>
                        <Col xs={12} className="mt-3">
                          <div className="text-muted small text-uppercase fw-bold mb-1">Tổng giá trị</div>
                          <div className="text-success fw-bold fs-4">{formatCurrency(selectedContract?.totalAmount)}</div>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Order Items */}
              <div>
                <h6 className="fw-bold mb-3 border-bottom pb-2">Chi tiết đơn hàng</h6>
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0">Sản phẩm</th>
                        <th className="border-0 text-center" style={{ width: '100px' }}>Số lượng</th>
                        <th className="border-0 text-end" style={{ width: '150px' }}>Đơn giá</th>
                        <th className="border-0 text-end" style={{ width: '150px' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.orderItems?.map((item, index) => (
                        <tr key={item.productId || index}>
                          <td className="fw-medium">{item.productName}</td>
                          <td className="text-center">{item.quantity?.toLocaleString('vi-VN')}</td>
                          <td className="text-end text-muted">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-end fw-medium">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h6 className="fw-bold mb-3 border-bottom pb-2">Tài liệu đính kèm</h6>
                <Row className="g-3">
                  <Col md={6}>
                    <Card className={`h-100 ${fileUrl ? 'border-primary' : 'border-warning'}`}>
                      <Card.Body className="d-flex align-items-center justify-content-between p-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`bg-${fileUrl ? 'primary' : 'warning'} bg-opacity-10 p-2 rounded`}>
                            {fileUrl ? <FaFileContract className="text-primary fs-4" /> : <FaExclamationTriangle className="text-warning fs-4" />}
                          </div>
                          <div>
                            <div className="fw-medium">Hợp đồng đã ký</div>
                            <div className="small text-muted">{fileUrl ? 'Đã upload' : 'Chưa có file'}</div>
                          </div>
                        </div>
                        {fileUrl && (
                          <div className="d-flex gap-2">
                            <Button variant="light" size="sm" onClick={() => handleViewFile(fileUrl)} title="Xem">
                              <FaEye /> Xem
                            </Button>
                            <Button
                              variant="light"
                              size="sm"
                              href={fileUrl.startsWith('http') ? fileUrl : `${API_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`}
                              download
                              onClick={(e) => {
                                const token = sessionStorage.getItem('token') || sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
                                if (token && !fileUrl.startsWith('http')) {
                                  e.preventDefault();
                                  const fullUrl = `${API_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                                  fetch(fullUrl, { headers: { 'Authorization': `Bearer ${token}` } })
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
                                    });
                                }
                              }}
                              title="Tải về"
                            >
                              <FaDownload />
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className={`h-100 ${quoteFileUrl ? 'border-info' : 'border-warning'}`}>
                      <Card.Body className="d-flex align-items-center justify-content-between p-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`bg-${quoteFileUrl ? 'info' : 'warning'} bg-opacity-10 p-2 rounded`}>
                            {quoteFileUrl ? <FaFileInvoiceDollar className="text-info fs-4" /> : <FaExclamationTriangle className="text-warning fs-4" />}
                          </div>
                          <div>
                            <div className="fw-medium">Báo giá chi tiết</div>
                            <div className="small text-muted">{quoteFileUrl ? 'Đã upload' : 'Chưa có file'}</div>
                          </div>
                        </div>
                        {quoteFileUrl && (
                          <div className="d-flex gap-2">
                            <Button variant="light" size="sm" onClick={() => handleViewFile(quoteFileUrl)} title="Xem">
                              <FaEye /> Xem
                            </Button>
                            <Button
                              variant="light"
                              size="sm"
                              href={quoteFileUrl.startsWith('http') ? quoteFileUrl : `${API_BASE_URL}${quoteFileUrl.startsWith('/') ? '' : '/'}${quoteFileUrl}`}
                              download
                              onClick={(e) => {
                                const token = sessionStorage.getItem('token') || sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
                                if (token && !quoteFileUrl.startsWith('http')) {
                                  e.preventDefault();
                                  const fullUrl = `${API_BASE_URL}${quoteFileUrl.startsWith('/') ? '' : '/'}${quoteFileUrl}`;
                                  fetch(fullUrl, { headers: { 'Authorization': `Bearer ${token}` } })
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
                                    });
                                }
                              }}
                              title="Tải về"
                            >
                              <FaDownload />
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            </div>
          ) : (
            selectedContract && <Alert variant="warning">Không tìm thấy thông tin chi tiết.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0 pb-4 px-4">
          <div className="d-flex justify-content-end gap-2 w-100">
            <Button variant="light" onClick={closeModal} disabled={processing} className="px-4">
              Đóng
            </Button>
            {selectedContract?.status === 'PENDING_APPROVAL' && (
              <>
                <Button
                  variant="outline-danger"
                  onClick={() => {
                    const reason = window.prompt('Vui lòng nhập lý do từ chối hợp đồng:');
                    if (reason && reason.trim()) {
                      handleReject(reason.trim());
                    } else if (reason !== null) {
                      setError('Vui lòng nhập lý do từ chối hợp đồng.');
                    }
                  }}
                  disabled={processing}
                  className="px-4"
                >
                  Từ chối
                </Button>
                <Button variant="primary" onClick={handleApprove} disabled={processing} className="px-4">
                  Phê duyệt
                </Button>
              </>
            )}
          </div>
        </Modal.Footer>
      </Modal>

      {/* File Viewer Modal */}
      <Modal show={showFileViewer} onHide={handleCloseFileViewer} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Xem tài liệu</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0" style={{ height: '80vh' }}>
          {viewerUrl && (
            <iframe
              src={viewerUrl}
              title="File Viewer"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DirectorContractApproval;