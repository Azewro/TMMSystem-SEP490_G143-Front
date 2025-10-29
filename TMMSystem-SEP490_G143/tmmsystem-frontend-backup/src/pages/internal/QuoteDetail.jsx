import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert, Modal } from 'react-bootstrap';
import { FaArrowLeft, FaPaperPlane, FaSignInAlt } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v||0);
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : 'N/A';

const statusMap = {
  PENDING: { label: 'Chờ phê duyệt', variant: 'warning' },
  SENT: { label: 'Đã gửi khách hàng', variant: 'info' },
  ACCEPTED: { label: 'Đã duyệt', variant: 'success' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'danger' },
};

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  useEffect(() => {
    const loadQuote = async () => {
      setLoading(true); 
      setError('');
      
      console.log('=== LOADING QUOTE DETAIL ===');
      console.log('Quote ID:', id);
      console.log('Token exists:', !!localStorage.getItem('userToken'));
      
      try {
        const data = await quoteService.getQuoteDetails(id);
        console.log('Quote detail response:', data);
        setQuote(data);
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
      loadQuote();
    }
  }, [id]);

  const onSendToCustomer = async () => {
    if (!quote?.id) return;
    setSending(true); 
    setError(''); 
    setSuccess('');
    
    try {
      console.log('=== SENDING QUOTE TO CUSTOMER ===');
      console.log('Quote ID:', quote.id);
      
      await quoteService.sendQuoteToCustomer(quote.id);
      setSuccess('✅ Đã gửi báo giá cho khách hàng thành công!');
      
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
    return <Badge bg={m.variant} className="px-2 py-1">{m.label}</Badge>;
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/internal/quotations')}>
              <FaArrowLeft className="me-2"/> Quay lại danh sách
            </Button>

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

            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Chi tiết báo giá</h5>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary me-2" role="status"></div>
                    Đang tải chi tiết báo giá...
                  </div>
                ) : error && !quote ? (
                  <div className="text-center py-5 text-muted">
                    Không thể hiển thị chi tiết do lỗi trên
                  </div>
                ) : quote ? (
                  <>
                    <Row className="mb-4">
                      <Col md={6}>
                        <div className="mb-2">
                          <strong>Mã báo giá:</strong> 
                          <span className="ms-2 text-primary fw-semibold">
                            {quote.quotationNumber || `QUO-${quote.id}`}
                          </span>
                        </div>
                        <div className="mb-2">
                          <strong>Ngày tạo:</strong> 
                          <span className="ms-2">{formatDate(quote.createdAt)}</span>
                        </div>
                        <div>
                          <strong>RFQ liên quan:</strong> 
                          <span className="ms-2">{quote.rfq?.rfqNumber || `RFQ-${quote.rfqId || 'N/A'}`}</span>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-2">
                          <strong>Khách hàng:</strong> 
                          <span className="ms-2">{quote.customer?.companyName || quote.customer?.contactPerson || '—'}</span>
                        </div>
                        <div className="mb-2">
                          <strong>Người đại diện:</strong> 
                          <span className="ms-2">{quote.customer?.contactPerson || '—'}</span>
                        </div>
                        <div>
                          <strong>Trạng thái:</strong> 
                          <span className="ms-2"><StatusBadge status={quote.status} /></span>
                        </div>
                      </Col>
                    </Row>

                    <h6 className="mt-4 mb-3 text-primary">💰 Chi tiết giá</h6>
                    <Table size="sm" className="mb-4" bordered>
                      <tbody>
                        <tr>
                          <td className="fw-semibold" style={{width: '200px'}}>Nguyên vật liệu</td>
                          <td className="text-end">{formatCurrency(quote.materialCost || 0)}</td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">Gia công</td>
                          <td className="text-end">{formatCurrency(quote.processingCost || 0)}</td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">Hoàn thiện</td>
                          <td className="text-end">{formatCurrency(quote.finishingCost || 0)}</td>
                        </tr>
                        <tr className="table-success">
                          <td className="fw-bold">Tổng cộng</td>
                          <td className="text-end fw-bold text-success">
                            {formatCurrency(quote.totalAmount || 0)}
                          </td>
                        </tr>
                      </tbody>
                    </Table>

                    {Array.isArray(quote.items) && quote.items.length > 0 && (
                      <>
                        <h6 className="mt-4 mb-3 text-primary">📦 Sản phẩm báo giá</h6>
                        <Table responsive size="sm" className="mb-4" bordered>
                          <thead className="table-light">
                            <tr>
                              <th style={{width: '50px'}}>#</th>
                              <th>Sản phẩm</th>
                              <th style={{width: '100px'}}>Số lượng</th>
                              <th style={{width: '120px'}}>Đơn giá</th>
                              <th style={{width: '120px'}}>Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quote.items.map((it, idx) => (
                              <tr key={it.id || idx}>
                                <td className="text-center">{idx+1}</td>
                                <td>{it.productName || it.product?.name || '—'}</td>
                                <td className="text-center">{it.quantity || it.qty || 0}</td>
                                <td className="text-end">{formatCurrency(it.unitPrice || 0)}</td>
                                <td className="text-end text-success fw-semibold">
                                  {formatCurrency((it.unitPrice||0)*(it.quantity||it.qty||0))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </>
                    )}

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <Button 
                        variant="success" 
                        size="lg"
                        disabled={sending || quote.status==='SENT' || quote.status==='ACCEPTED' || quote.status==='APPROVED'} 
                        onClick={()=>setConfirmSend(true)}
                      >
                        <FaPaperPlane className="me-2"/> 
                        {quote.status === 'SENT' ? 'Đã gửi khách hàng' : 'Gửi khách hàng'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5 text-muted">
                    Không tìm thấy báo giá
                  </div>
                )}
              </Card.Body>
            </Card>

            <Modal show={confirmSend} onHide={()=>setConfirmSend(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>📧 Xác nhận gửi báo giá</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>Bạn có chắc chắn muốn gửi báo giá này cho khách hàng?</p>
                <div className="bg-light p-3 rounded">
                  <div><strong>Mã báo giá:</strong> {quote?.quotationNumber || `QUO-${quote?.id}`}</div>
                  <div><strong>Khách hàng:</strong> {quote?.customer?.companyName || quote?.customer?.contactPerson}</div>
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
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
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
