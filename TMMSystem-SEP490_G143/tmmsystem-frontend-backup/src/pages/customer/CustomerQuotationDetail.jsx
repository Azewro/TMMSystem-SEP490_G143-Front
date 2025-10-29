import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Alert, Modal, Row, Col, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Header from '../../components/common/Header';
import CustomerSidebar from '../../components/common/CustomerSidebar';
import { quoteService } from '../../api/quoteService';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v||0);
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : 'N/A';

const CustomerQuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirm, setConfirm] = useState({ type: null, open: false });
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true); setError('');
      try {
        const data = await quoteService.getQuoteDetails(id);
        setQuote(data);
      } catch (e) { setError(e.message || 'Không thể tải báo giá'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const onConfirm = async (type) => {
    if (!quote?.id) return;
    setWorking(true); setError(''); setSuccess('');
    try {
      if (type === 'ACCEPTED') {
        await quoteService.updateQuotationStatus(quote.id, 'ACCEPTED');
        // Optional: create order explicitly if backend doesn't auto-create
        try { 
          await quoteService.createOrderFromQuotation({ quotationId: quote.id }); 
        } catch (orderErr) {
          console.log('Order creation failed or already exists:', orderErr.message);
        }
        setSuccess('✅ Bạn đã đồng ý báo giá. Đơn hàng đã được tạo.');
      } else {
        await quoteService.updateQuotationStatus(quote.id, 'REJECTED');
        setSuccess('✅ Bạn đã từ chối báo giá.');
      }
      setTimeout(()=> navigate('/customer/quotations'), 1200);
    } catch (e) {
      setError(e.message || 'Thao tác thất bại');
    } finally {
      setWorking(false);
      setConfirm({ type: null, open: false });
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SENT': return { text: 'Chưa đồng ý', bg: 'warning' };
      case 'ACCEPTED': return { text: 'Đã đồng ý', bg: 'success' };
      case 'REJECTED': return { text: 'Đã từ chối', bg: 'danger' };
      default: return { text: status || 'Unknown', bg: 'secondary' };
    }
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <CustomerSidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/customer/quotations')}>
              <FaArrowLeft className="me-2" /> Quay lại
            </Button>

            {error && <Alert variant="danger" onClose={()=>setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={()=>setSuccess('')} dismissible>{success}</Alert>}

            <Card className="shadow-sm">
              <Card.Header className="bg-white border-0">
                <h4 className="mb-0 text-danger">Báo Giá Lô Hàng Mã {quote?.rfqNumber || quote?.rfq?.rfqNumber || `RFQ-${quote?.rfqId || quote?.id}`}</h4>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-4">Đang tải...</div>
                ) : quote ? (
                  <>
                    <Row className="mb-4">
                      <Col md={6}>
                        <div><strong>Trạng thái:</strong></div>
                        <Badge bg={getStatusBadge(quote.status).bg} className="fs-6">
                          {getStatusBadge(quote.status).text}
                        </Badge>
                      </Col>
                      <Col md={6} className="text-end">
                        <div><strong>Ngày giao hàng dự kiến:</strong></div>
                        <div>{formatDate(quote.validUntil) || '29/05/2025'}</div>
                      </Col>
                    </Row>

                    <Table bordered responsive>
                      <thead className="table-light">
                        <tr>
                          <th>Sản phẩm</th>
                          <th>Kích thước</th>
                          <th>Số lượng (Cái)</th>
                          <th>Đơn giá (VND)</th>
                          <th>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(quote.items) && quote.items.length > 0 ? quote.items.map((it, idx) => (
                          <tr key={it.id || idx}>
                            <td>{it.productName || it.product?.name || 'Sản phẩm'}</td>
                            <td>{it.size || it.product?.standardDimensions || it.dimensions || 'Tờ 150D-500m'}</td>
                            <td>{it.quantity || it.qty || 0}</td>
                            <td>{(it.unitPrice || 0).toLocaleString('vi-VN')}</td>
                            <td>{it.notes || 'Đồng/cái'}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td>Khăn mặt Bambo</td>
                            <td>Tờ 150D-500m</td>
                            <td>200</td>
                            <td>13,000</td>
                            <td>Đồng/cái</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>

                    <div className="d-flex gap-3 mt-4">
                      <Button 
                        variant="success" 
                        size="lg"
                        onClick={()=>setConfirm({ type: 'ACCEPTED', open: true })} 
                        disabled={working || quote.status==='ACCEPTED'}
                      >
                        Đồng ý
                      </Button>
                      <Button 
                        variant="danger" 
                        size="lg"
                        onClick={()=>setConfirm({ type: 'REJECTED', open: true })} 
                        disabled={working || quote.status==='ACCEPTED' || quote.status==='REJECTED'}
                      >
                        Không đồng ý
                      </Button>
                      <Button variant="outline-primary" size="lg">
                        📄 Quay lại
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted">Không tìm thấy báo giá</div>
                )}
              </Card.Body>
            </Card>

            <Modal show={confirm.open} onHide={()=>setConfirm({ type: null, open: false })} centered>
              <Modal.Header closeButton>
                <Modal.Title>
                  {confirm.type==='ACCEPTED' ? 'Xác nhận báo giá' : 'Xác nhận hủy đơn báo giá'}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="text-center">
                  <div className="mb-3">
                    {confirm.type==='ACCEPTED' ? '✅' : '❌'}
                  </div>
                  <p>Hành động này không thể hoàn tác!</p>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={()=>setConfirm({ type: null, open: false })}>
                  Hủy
                </Button>
                <Button 
                  variant={confirm.type==='ACCEPTED' ? 'success' : 'danger'} 
                  onClick={()=>onConfirm(confirm.type)} 
                  disabled={working}
                >
                  {working ? 'Đang xử lý...' : (confirm.type==='ACCEPTED' ? 'Đồng ý' : 'Hủy')}
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default CustomerQuotationDetail;
