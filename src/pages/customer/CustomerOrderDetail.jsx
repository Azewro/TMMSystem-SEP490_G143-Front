import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Table, ListGroup, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { contractService } from '../../api/contractService';
import { quotationService } from '../../api/quotationService';
import { API_BASE_URL } from '../../utils/constants';
import toast from 'react-hot-toast';

// Helper functions for file handling
const getFileExtension = (url) => {
  if (!url) return '';
  const cleanUrl = url.split(/[?#]/)[0];
  const parts = cleanUrl.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const isDocx = (url) => ['docx', 'doc'].includes(getFileExtension(url));

const formatCurrency = (value) => {
  if (!value) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('vi-VN');
  } catch {
    return iso;
  }
};

const CustomerOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contractFileUrl, setContractFileUrl] = useState('');
  const [quotationFileUrl, setQuotationFileUrl] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(false);

  // File viewer modal state
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!id) {
        setError('Không tìm thấy ID đơn hàng');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Fetch contract details
        const contractId = parseInt(id, 10);

        // Fetch contract object to get quotationId (similar to director)
        let contract = null;
        try {
          const contractsResponse = await contractService.getAllContracts(0, 1000);
          const contractsArray = contractsResponse?.content || (Array.isArray(contractsResponse) ? contractsResponse : []);
          contract = contractsArray.find(c => c.id === contractId);
        } catch (contractFetchError) {
          console.error('Could not fetch contract list:', contractFetchError);
        }

        const [details, contractUrl] = await Promise.all([
          contractService.getOrderDetails(contractId),
          contractService.getContractFileUrl(contractId).catch(() => null)
        ]);

        setOrderDetails(details);

        // Process contract file URL
        if (contractUrl) {
          const apiPathIndex = contractUrl.indexOf('/api/');
          const relativeUrl = apiPathIndex !== -1 ? contractUrl.substring(apiPathIndex) : contractUrl;
          setContractFileUrl(relativeUrl);
        }

        // Fetch quotation file URL if available
        // Try multiple sources: contract.quotationId (like director), details.quotationId, or details.quotation?.id
        const quotationId = contract?.quotationId || details?.quotationId || details?.quotation?.id;

        if (quotationId) {
          try {
            const quoteUrl = await quotationService.getQuoteFileUrl(quotationId);
            if (quoteUrl) {
              const apiPathIndex = quoteUrl.indexOf('/api/');
              const relativeUrl = apiPathIndex !== -1 ? quoteUrl.substring(apiPathIndex) : quoteUrl;
              setQuotationFileUrl(relativeUrl);
            }
          } catch (quoteUrlError) {
            console.error('Could not fetch quote file URL:', quoteUrlError);
            // Do not set a blocking error, just let the UI show that the file is missing.
          }
        }

        // Set order data from contract
        setOrder({
          id: details.contractNumber || `HD-${contractId}`,
          orderDate: formatDate(details.contractDate),
          expectedDeliveryDate: formatDate(details.deliveryDate),
          status: details.status,
          customerInfo: {
            name: details.customerInfo?.companyName || '',
            contactPerson: details.customerInfo?.customerName || '',
            phone: details.customerInfo?.phoneNumber || '',
            shippingAddress: details.customerInfo?.address || '',
          },
          items: details.orderItems || [],
          summary: {
            subtotal: details.totalAmount || 0,
            total: details.totalAmount || 0,
          },
        });

      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [id]);

  const handleViewFile = async (url) => {
    if (!url || isDocx(url)) {
      if (isDocx(url)) {
        toast.error('File DOCX cần được tải về để xem');
      }
      return;
    }

    const toastId = toast.loading('Đang chuẩn bị file để xem...');
    try {
      // Construct full URL if it's a relative path (similar to director)
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

  const handleCloseFileViewer = () => {
    if (viewerUrl) {
      URL.revokeObjectURL(viewerUrl);
    }
    setShowFileViewer(false);
    setViewerUrl('');
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="d-flex">
          <Sidebar />
          <Container fluid className="p-4">
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-3">Đang tải thông tin đơn hàng...</p>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div>
        <Header />
        <div className="d-flex">
          <Sidebar />
          <Container fluid className="p-4">
            <Alert variant="danger">{error}</Alert>
            <Button variant="outline-secondary" onClick={() => navigate('/customer/orders')}>
              &larr; Quay lại danh sách
            </Button>
          </Container>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div>
      <Header />
      <div className="d-flex">
        <Sidebar />
        <Container fluid className="p-4">
          <Button
            variant="outline-secondary"
            className="mb-3"
            onClick={() => navigate('/customer/orders')}
          >
            &larr; Quay lại danh sách
          </Button>
          <h2 className="mb-4">Chi tiết đơn hàng #{order.id}</h2>

          <Card className="mb-4">
            <Card.Header as="h5">Thông tin chung</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Ngày đặt hàng:</strong> {order.orderDate}</p>
                  <p className="mb-0"><strong>Ngày giao dự kiến:</strong> {order.expectedDeliveryDate}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Người nhận:</strong> {order.customerInfo.contactPerson}</p>
                  <p className="mb-0"><strong>Địa chỉ giao hàng:</strong> {order.customerInfo.shippingAddress}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header as="h5">Chi tiết sản phẩm</Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sản phẩm</th>
                    <th className="text-end">Số lượng</th>
                    <th className="text-end">Đơn giá</th>
                    <th className="text-end">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <tr key={item.id || item.productId || index}>
                        <td>{index + 1}</td>
                        <td>{item.productName || 'Sản phẩm không xác định'}</td>
                        <td className="text-end">{(item.quantity || 0).toLocaleString('vi-VN')}</td>
                        <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-end">{formatCurrency(item.totalPrice || (item.unitPrice * item.quantity))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">Không có sản phẩm nào</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="text-end fw-bold">Tổng tiền hàng</td>
                    <td className="text-end fw-bold">{formatCurrency(order.summary.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="text-end fw-bold fs-5">Tổng cộng</td>
                    <td className="text-end fw-bold fs-5">{formatCurrency(order.summary.total)}</td>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>

          {/* Hide documents section when contract is not yet approved */}
          {!['DRAFT', 'PENDING_APPROVAL', 'CANCELED'].includes(order.status) && (
          <Card className="mb-4">
            <Card.Header as="h5">Tài liệu đã ký</Card.Header>
            <Card.Body>
              <Row className="g-3">
                {/* Signed Quotation */}
                <Col md={6}>
                  <div className="border rounded p-3">
                    <h6 className="mb-3">Báo giá đã ký</h6>
                    {quotationFileUrl ? (
                      <div className="d-flex gap-2 flex-wrap">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleViewFile(quotationFileUrl)}
                          disabled={isDocx(quotationFileUrl)}
                          title={isDocx(quotationFileUrl) ? 'File DOCX cần được tải về để xem' : 'Xem file báo giá'}
                        >
                          👁️ Xem báo giá
                        </Button>
                        <Button
                          variant="info"
                          size="sm"
                          href={quotationFileUrl.startsWith('http') ? quotationFileUrl : `${API_BASE_URL}${quotationFileUrl.startsWith('/') ? '' : '/'}${quotationFileUrl}`}
                          download
                          onClick={(e) => {
                            // Ensure download works with authentication
                            const token = sessionStorage.getItem('token') || sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
                            if (token && !quotationFileUrl.startsWith('http')) {
                              e.preventDefault();
                              const fullUrl = `${API_BASE_URL}${quotationFileUrl.startsWith('/') ? '' : '/'}${quotationFileUrl}`;
                              fetch(fullUrl, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              })
                                .then(res => res.blob())
                                .then(blob => {
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = quotationFileUrl.split('/').pop() || 'quotation.pdf';
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
                          ⬇️ Tải về báo giá
                        </Button>
                      </div>
                    ) : (
                      <Alert variant="info" className="mb-0 py-2">
                        Chưa có file báo giá đã ký
                      </Alert>
                    )}
                  </div>
                </Col>

                {/* Signed Contract */}
                <Col md={6}>
                  <div className="border rounded p-3">
                    <h6 className="mb-3">Hợp đồng đã ký</h6>
                    {contractFileUrl ? (
                      <div className="d-flex gap-2 flex-wrap">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleViewFile(contractFileUrl)}
                          disabled={isDocx(contractFileUrl)}
                          title={isDocx(contractFileUrl) ? 'File DOCX cần được tải về để xem' : 'Xem file hợp đồng'}
                        >
                          👁️ Xem hợp đồng
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          href={contractFileUrl.startsWith('http') ? contractFileUrl : `${API_BASE_URL}${contractFileUrl.startsWith('/') ? '' : '/'}${contractFileUrl}`}
                          download
                          onClick={(e) => {
                            // Ensure download works with authentication
                            const token = sessionStorage.getItem('token') || sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
                            if (token && !contractFileUrl.startsWith('http')) {
                              e.preventDefault();
                              const fullUrl = `${API_BASE_URL}${contractFileUrl.startsWith('/') ? '' : '/'}${contractFileUrl}`;
                              fetch(fullUrl, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              })
                                .then(res => res.blob())
                                .then(blob => {
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = contractFileUrl.split('/').pop() || 'contract.pdf';
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
                          ⬇️ Tải về hợp đồng
                        </Button>
                      </div>
                    ) : (
                      <Alert variant="info" className="mb-0 py-2">
                        Chưa có file hợp đồng đã ký
                      </Alert>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          )}

          <Card>
            <Card.Header as="h5">Lịch sử đơn hàng</Card.Header>
            <Card.Body>
              {orderDetails?.history && orderDetails.history.length > 0 ? (
                <ListGroup variant="flush">
                  {orderDetails.history.map((event, index) => (
                    <ListGroup.Item key={index}>
                      <div className="d-flex justify-content-between">
                        <span className="fw-bold">{event.status}</span>
                        <span className="text-muted">{formatDate(event.date)}</span>
                      </div>
                      {event.description && (
                        <p className="mb-0 text-muted small">{event.description}</p>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted mb-0">Chưa có lịch sử đơn hàng</p>
              )}
            </Card.Body>
          </Card>

        </Container>
      </div>

      {/* File Viewer Modal */}
      <Modal show={showFileViewer} onHide={handleCloseFileViewer} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Xem file</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: '80vh' }}>
          {viewerUrl ? (
            <iframe
              src={viewerUrl}
              width="100%"
              height="100%"
              title="File Viewer"
              style={{ border: 'none' }}
            />
          ) : (
            <div className="text-center">Đang tải file...</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CustomerOrderDetail;