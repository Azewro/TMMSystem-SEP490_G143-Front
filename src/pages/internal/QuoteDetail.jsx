import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert, Modal, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaPaperPlane, FaSignInAlt } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';
import toast from 'react-hot-toast';

const getStatusBadge = (status) => {
  switch (status) {
    case 'DRAFT': return 'secondary';
    case 'SENT': return 'info';
    case 'ACCEPTED': return 'success';
    case 'REJECTED': return 'danger';
    case 'EXPIRED': return 'light';
    case 'CANCELED': return 'dark';
    case 'ORDER_CREATED': return 'primary';
    default: return 'light';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'DRAFT': return 'Chờ gửi khách hàng';
    case 'SENT': return 'Đã gửi';
    case 'ACCEPTED': return 'Đã chấp nhận';
    case 'REJECTED': return 'Đã từ chối';
    case 'EXPIRED': return 'Hết hạn';
    case 'CANCELED': return 'Đã hủy';
    case 'ORDER_CREATED': return 'Đã tạo đơn hàng';
    default: return status;
  }
};

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v||0);
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : 'N/A';

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [products, setProducts] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const canSend = quote?.status === 'DRAFT' || quote?.status === 'QUOTED';

  const loadQuoteData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      // Step 1: Fetch products and the main quote data in parallel
      const [productsData, initialQuoteData] = await Promise.all([
        productService.getAllProducts(),
        quoteService.getQuoteDetails(id)
      ]);

      const productMap = new Map(productsData.map(p => [p.id, p]));
      setProducts(productMap);

      let finalQuoteData = { ...initialQuoteData };

      // Step 2: If rfqId exists, fetch RFQ details to get rfqNumber
      if (initialQuoteData && initialQuoteData.rfqId) {
        try {
          const rfqData = await quoteService.getRFQDetails(initialQuoteData.rfqId);
          // Step 3: Merge rfqNumber into the quote data
          finalQuoteData.rfqNumber = rfqData.rfqNumber;
        } catch (rfqError) {
          console.warn("Could not fetch RFQ details:", rfqError);
          // Non-critical error, we can still display the quote without the rfqNumber
        }
      }
      
      console.log("Final Quote Data with RFQ number:", JSON.stringify(finalQuoteData, null, 2));
      setQuote(finalQuoteData);

    } catch (e) {
      console.error('=== QUOTE DETAIL ERROR ===', e);
      if (e?.response?.status === 401) {
        setError('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (e?.response?.status === 404) {
        setError('❌ Không tìm thấy báo giá này.');
      } else {
        setError(e.message || 'Lỗi khi tải chi tiết báo giá');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuoteData();
  }, [loadQuoteData]);

  const onSendToCustomer = async () => {
    if (!quote?.id || !canSend) return;
    setSending(true);
    try {
      await quoteService.sendQuoteToCustomer(quote.id);
      toast.success('Đã gửi báo giá cho khách hàng thành công!');
      setQuote(prev => ({ ...prev, status: 'SENT' }));
    } catch (e) {
      toast.error(e.message || 'Gửi báo giá thất bại');
    } finally {
      setSending(false);
      setShowConfirmModal(false);
    }
  };

  const handleRetryLogin = () => {
    sessionStorage.setItem('returnTo', `/sales/quotations/${id}`);
    navigate('/login');
  };

  if (loading) {
    return <div className="d-flex vh-100 justify-content-center align-items-center"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="sales" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container>
            <Row className="justify-content-center">
              <Col lg={10} xl={9}>
                {error && (
                  <Alert variant={error.includes('hết hạn') ? 'warning' : 'danger'} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span>{error}</span>
                      {error.includes('hết hạn') && (
                        <Button variant="outline-primary" size="sm" onClick={handleRetryLogin}>
                          <FaSignInAlt className="me-1" /> Đăng nhập lại
                        </Button>
                      )}
                    </div>
                  </Alert>
                )}

                {!quote && !error && (
                  <Alert variant="light">Không tìm thấy chi tiết báo giá.</Alert>
                )}

                {quote && (
                  <Card className="shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h4 className="mb-0">Chi tiết báo giá: {quote.quotationNumber}</h4>
                      <Button variant="outline-secondary" size="sm" onClick={() => navigate('/sales/quotations')}>
                        <FaArrowLeft className="me-2" /> Quay lại
                      </Button>
                    </Card.Header>
                    <Card.Body>
                      {/* General Info */}
                      <h5 className="mb-3">1. Thông tin chung</h5>
                      <Row className="mb-4">
                        <Col md={6}>
                          <h6>Thông tin báo giá</h6>
                          <p className="mb-1"><strong>Mã RFQ liên quan:</strong> {quote.rfqNumber || '—'}</p>
                          <p className="mb-1"><strong>Ngày tạo:</strong> {formatDate(quote.createdAt)}</p>
                          <p className="mb-1"><strong>Tổng giá trị:</strong> <span className="text-success fw-semibold">{formatCurrency(quote.totalAmount)}</span></p>
                          <p className="mb-1"><strong>Trạng thái:</strong> 
                            <Badge bg={getStatusBadge(quote.status)} className="ms-2">{getStatusText(quote.status)}</Badge>
                          </p>
                        </Col>
                        <Col md={6}>
                          <h6>Thông tin khách hàng</h6>
                          <p className="mb-1"><strong>Tên:</strong> {quote.contactPersonSnapshot || '—'}</p>
                          <p className="mb-1"><strong>Số điện thoại:</strong> {quote.contactPhoneSnapshot || '—'}</p>
                          <p className="mb-1"><strong>Email:</strong> {quote.contactEmailSnapshot || '—'}</p>
                        </Col>
                      </Row>

                      {/* Product List */}
                      <h5 className="mb-3">2. Danh sách sản phẩm</h5>
                      {/* TODO: rfqNumber is still missing from the backend API response for GET /v1/quotations/{id} */}
                      <Table striped bordered hover responsive className="mb-4">
                        <thead className="table-light">
                          <tr>
                            <th>STT</th>
                            <th>Sản phẩm</th>
                            <th>Kích thước</th>
                            <th className="text-center">Số lượng</th>
                            <th className="text-end">Đơn giá</th>
                            <th className="text-end">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quote.details?.length ? quote.details.map((item, index) => (
                            <tr key={item.id}>
                              <td className="text-center">{index + 1}</td>
                              <td>{products.get(item.productId)?.name || 'Sản phẩm không xác định'}</td>
                              <td>{products.get(item.productId)?.standardDimensions || '—'}</td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                              <td className="text-end fw-semibold">{formatCurrency(item.totalPrice)}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan="6" className="text-center text-muted">Không có sản phẩm.</td></tr>
                          )}
                        </tbody>
                        <tfoot className="table-group-divider">
                          <tr>
                            <td colSpan="5" className="text-end fw-bold">Tổng cộng</td>
                            <td className="text-end fw-bold text-success fs-5">{formatCurrency(quote.totalAmount)}</td>
                          </tr>
                        </tfoot>
                      </Table>

                      {/* Action */}
                      <h5 className="mb-3">3. Hành động</h5>
                      <Card border="light">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">Gửi báo giá cho khách hàng</h6>
                            </div>
                            <Button variant="success" disabled={!canSend || sending} onClick={() => setShowConfirmModal(true)}>
                              <FaPaperPlane className="me-2" />
                              {sending ? 'Đang gửi...' : (canSend ? 'Gửi khách hàng' : 'Đã gửi')}
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Card.Body>
                  </Card>
                )}
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận gửi báo giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn gửi báo giá này cho khách hàng?</p>
          <div className="bg-light p-3 rounded">
            <div><strong>Mã báo giá:</strong> {quote?.quotationNumber}</div>
            <div><strong>Khách hàng:</strong> {quote?.customer?.contactPerson}</div>
            <div><strong>Tổng giá trị:</strong> <span className="text-success fw-semibold">{formatCurrency(quote?.totalAmount)}</span></div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Hủy</Button>
          <Button variant="success" onClick={onSendToCustomer} disabled={sending}>
            {sending ? <><Spinner as="span" size="sm" className="me-2" /> Đang gửi...</> : 'Xác nhận gửi'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QuoteDetail;
