import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert, Modal } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import { FaArrowLeft, FaPaperPlane, FaSignInAlt } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v||0);
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : 'N/A';

const statusMap = {
  PENDING: { label: 'Chờ phê duyệt', variant: 'warning' },
  SENT: { label: 'Đã gửi khách hàng', variant: 'info' },
  ACCEPTED: { label: 'Đã duyệt', variant: 'success' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'danger' },
  QUOTED: { label: 'Đã báo giá', variant: 'info' }, // Added QUOTED status
};

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [products, setProducts] = useState(new Map());
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const canSend = ['DRAFT', 'PENDING', 'QUOTED'].includes(quote?.status); // Adjusted canSend logic

  useEffect(() => {
    const loadQuoteData = async () => {
      setLoading(true);
      setError('');
      try {
        const [quoteData, productsData, customersData] = await Promise.all([
          quoteService.getQuoteDetails(id),
          productService.getAllProducts(),
          quoteService.getAllCustomers()
        ]);

        const productMap = new Map(productsData.map(p => [p.id, p]));
        setProducts(productMap);

        const currentCustomer = customersData.find(c => c.id === quoteData.customerId);
        setCustomer(currentCustomer || null);

        setQuote({ ...quoteData, customer: currentCustomer || null });

      } catch (e) {
        console.error('=== QUOTE DETAIL ERROR ===');
        console.error('Error status:', e?.response?.status);
        console.error('Error message:', e?.message);
        
        if (e?.response?.status === 401) {
          setError('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem chi tiết báo giá.');
        } else if (e?.response?.status === 404) {
          setError('❌ Không tìm thấy báo giá này.');
        } else {
          setError(e.message || 'Lỗi khi tải chi tiết báo giá');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadQuoteData();
    }
  }, [id]);

  const onSendToCustomer = async () => {
    if (!quote?.id || !canSend) return;
    setSending(true); 
    setError(''); 
    setSuccess('');
    
    try {
      console.log('=== SENDING QUOTE TO CUSTOMER ===');
      console.log('Quote ID:', quote.id);
      
      await quoteService.sendQuoteToCustomer(quote.id);
      setSuccess('Đã gửi báo giá cho khách hàng thành công!');
      
      // Update quote status locally
      setQuote(prev => ({ ...prev, status: 'SENT' }));
      
      setTimeout(() => {
        setSuccess('');
        navigate('/internal/quotations');
      }, 2000);
    } catch (e) {
      console.error('=== SEND QUOTE ERROR ===');
      console.error('Error:', e);
      
      if (e?.response?.status === 401) {
        setError('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(e.message || 'Gửi báo giá thất bại');
      }
    } finally { 
      setSending(false); 
      setConfirmSend(false); 
    }
  };

  const handleRetryLogin = () => {
    sessionStorage.setItem('returnTo', `/internal/quotations/${id}`);
    navigate('/login');
  };

  const StatusBadge = ({ status }) => {
    const m = statusMap[status] || statusMap.PENDING;
    return <Badge bg={m.variant} className="px-2 py-1">{status}</Badge>;
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="sales" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">Chi tiết báo giá</h2>
                <Button variant="outline-secondary" onClick={() => navigate('/sales/quotations')}>
                    <FaArrowLeft className="me-2"/> Quay lại danh sách
                </Button>
            </div>

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

            {success && (
              <Alert variant="success" onClose={()=>setSuccess('')} dismissible>
                {success}
              </Alert>
            )}

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : quote ? (
              <>
                <Row>
                  <Col lg={6} className="mb-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">Thông tin khách hàng</h5>
                      </Card.Header>
                      <Card.Body>
                        <p><strong>Công ty:</strong> {customer?.companyName || '—'}</p>
                        <p><strong>Người đại diện:</strong> {customer?.contactPerson || '—'}</p>
                        <p><strong>Email:</strong> {customer?.email || '—'}</p>
                        <p><strong>Điện thoại:</strong> {customer?.phoneNumber || '—'}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={6} className="mb-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Header className="bg-light">
                        <h5 className="mb-0">Thông tin báo giá</h5>
                      </Card.Header>
                      <Card.Body>
                        <p><strong>Mã báo giá:</strong> <span className="fw-semibold text-primary">{quote.quotationNumber || `QUO-${quote.id}`}</span></p>
                        <p><strong>Ngày tạo:</strong> {formatDate(quote.createdAt)}</p>
                        <p><strong>Trạng thái:</strong> <StatusBadge status={quote.status} /></p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Card className="shadow-sm">
                    <Card.Header className="bg-light">
                        <h5 className="mb-0">Sản phẩm báo giá</h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table responsive striped hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                <th style={{width: '50px'}}>STT</th>
                                <th>Tên sản phẩm</th>
                                <th>Kích thước</th>
                                <th className="text-center">Số lượng</th>
                                <th className="text-end">Đơn giá</th>
                                <th className="text-end">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quote.details && quote.details.length > 0 ? (
                                quote.details.map((item, index) => {
                                    const product = products.get(item.productId);
                                    return (
                                    <tr key={item.id}>
                                        <td className="text-center">{index + 1}</td>
                                        <td>{product?.name || 'Sản phẩm không xác định'}</td>
                                        <td>{product?.standardDimensions || '—'}</td>
                                        <td className="text-center">{item.quantity}</td>
                                        <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                                        <td className="text-end fw-semibold">{formatCurrency(item.totalPrice)}</td>
                                    </tr>
                                    );
                                })
                                ) : (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-4">Chưa có sản phẩm nào trong báo giá.</td>
                                </tr>
                                )}
                            </tbody>
                            <tfoot className="table-group-divider">
                                <tr>
                                <td colSpan="5" className="text-end fw-bold">Tổng cộng</td>
                                <td className="text-end fw-bold text-success fs-5">{formatCurrency(quote.totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </Table>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <Button
                    variant="success"
                    size="lg"
                    disabled={sending || !canSend}
                    onClick={()=>setConfirmSend(true)}
                    >
                    <FaPaperPlane className="me-2"/>
                    {canSend ? 'Gửi khách hàng' : 'Đã gửi khách hàng'}
                    </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-5 text-muted">Không tìm thấy báo giá</div>
            )}

            <Modal show={confirmSend} onHide={()=>setConfirmSend(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>Xác nhận gửi báo giá</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>Bạn có chắc chắn muốn gửi báo giá này cho khách hàng?</p>
                <div className="bg-light p-3 rounded">
                  <div><strong>Mã báo giá:</strong> {quote?.quotationNumber || `QUO-${quote?.id}`}</div>
                  <div><strong>Khách hàng:</strong> {customer?.contactPerson || customer?.companyName}</div>
                  <div><strong>Tổng giá trị:</strong> <span className="text-success fw-semibold">{formatCurrency(quote?.totalAmount)}</span></div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={()=>setConfirmSend(false)}>
                  Hủy
                </Button>
                <Button variant="success" onClick={onSendToCustomer} disabled={sending}>
                  {sending ? (
                    <>
                      <Spinner as="span" size="sm" className="me-2" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="me-2" />
                      Gửi khách hàng
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;
