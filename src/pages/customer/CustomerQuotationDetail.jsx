import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Alert, Modal, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v||0);
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : 'N/A';

// Helper function to convert number to Vietnamese words
const numberToWords = (num) => {
    const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const teens = ["mười", "mười một", "mười hai", "mười ba", "mười bốn", "mười lăm", "mười sáu", "mười bảy", "mười tám", "mười chín"];
    const tens = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
    const powers = ["", "nghìn", "triệu", "tỷ"];

    if (num === 0) return "không đồng";

    let words = [];
    let i = 0;

    while (num > 0) {
        let chunk = num % 1000;
        if (chunk > 0) {
            let chunkWords = [];
            let h = Math.floor(chunk / 100);
            let t = Math.floor((chunk % 100) / 10);
            let u = chunk % 10;

            if (h > 0) {
                chunkWords.push(units[h] + " trăm");
            }

            if (t > 1) {
                chunkWords.push(tens[t]);
                if (u === 1) {
                    chunkWords.push("mốt");
                } else if (u > 0) {
                    chunkWords.push(units[u]);
                }
            } else if (t === 1) {
                chunkWords.push(teens[u]);
            } else if (u > 0 && (h > 0 || i > 0)) {
                chunkWords.push("linh " + units[u]);
            } else if (u > 0) {
                chunkWords.push(units[u]);
            }
            
            if (powers[i]) {
                chunkWords.push(powers[i]);
            }
            words.unshift(chunkWords.join(" "));
        }
        num = Math.floor(num / 1000);
        i++;
    }
    
    const finalWords = words.join(" ").trim();
    return finalWords.charAt(0).toUpperCase() + finalWords.slice(1) + " đồng";
};


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
        const quoteData = await quoteService.getQuoteDetails(id);
        const enrichedDetails = quoteData.details.map(item => ({
          ...item,
          totalPrice: item.unitPrice * item.quantity
        }));
        
        const subTotal = enrichedDetails.reduce((sum, item) => sum + item.totalPrice, 0);
        
        // Assuming totalAmount from API is the final price including VAT
        const vatAmount = quoteData.totalAmount - subTotal;
        const vatRate = subTotal > 0 ? (vatAmount / subTotal) * 100 : 0;

        setQuote({ 
            ...quoteData, 
            details: enrichedDetails,
            subTotal,
            vatAmount,
            vatRate: vatRate.toFixed(0) // Assuming integer VAT rate
        });

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
      setTimeout(()=> navigate('/customer/quotations'), 2000);
    } catch (e) {
      setError(e.message || 'Thao tác thất bại');
    } finally {
      setWorking(false);
      setConfirm({ type: null, open: false });
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'SENT': return { text: 'Chờ phản hồi', bg: 'warning' };
      case 'ACCEPTED': return { text: 'Đã chấp nhận', bg: 'success' };
      case 'REJECTED': return { text: 'Đã từ chối', bg: 'danger' };
      default: return { text: status || 'Không xác định', bg: 'secondary' };
    }
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/customer/quotations')}>
              <FaArrowLeft className="me-2" /> Quay lại danh sách
            </Button>

            {error && <Alert variant="danger" onClose={()=>setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={()=>setSuccess('')} dismissible>{success}</Alert>}

            <Card className="shadow-sm">
              <Card.Header className="bg-light p-3">
                <Row className="align-items-center">
                    <Col md={8}>
                        <h4 className="mb-0">Chi Tiết Báo Giá</h4>
                        <span className="text-muted">Mã: {quote?.rfqNumber || quote?.rfq?.rfqNumber || `RFQ-${quote?.rfqId || quote?.id}`}</span>
                    </Col>
                    <Col md={4} className="text-md-end">
                        {quote && <Badge bg={getStatusBadge(quote.status).bg} className="fs-6">{getStatusBadge(quote.status).text}</Badge>}
                    </Col>
                </Row>
              </Card.Header>
              <Card.Body className="p-4">
                {loading ? (
                  <div className="text-center py-5"><Spinner animation="border" /></div>
                ) : quote ? (
                  <>
                    <Table responsive bordered className="align-middle">
                      <thead className="table-light text-center">
                        <tr>
                          <th>STT</th>
                          <th>Tên sản phẩm</th>
                          <th>Kích thước</th>
                          <th>Số lượng</th>
                          <th>Đơn vị tính</th>
                          <th className="text-end">Đơn giá</th>
                          <th className="text-end">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quote.details.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="text-center">{idx + 1}</td>
                            <td>{item.productName || 'Sản phẩm không xác định'}</td>
                            <td className="text-center">{item.notes || 'Tiêu chuẩn'}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-center">{item.unit || 'cái'}</td>
                            <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                            <td className="text-end fw-bold">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    <Row className="justify-content-end mt-4">
                        <Col md={5}>
                            <Table borderless size="sm">
                                <tbody>
                                    <tr>
                                        <td><strong>Tổng cộng:</strong></td>
                                        <td className="text-end">{formatCurrency(quote.subTotal)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Thuế GTGT ({quote.vatRate}%):</strong></td>
                                        <td className="text-end">{formatCurrency(quote.vatAmount)}</td>
                                    </tr>
                                    <tr className="fs-5">
                                        <td className="fw-bold">Tổng thanh toán:</td>
                                        <td className="text-end fw-bold text-danger">{formatCurrency(quote.totalAmount)}</td>
                                    </tr>
                                </tbody>
                            </Table>
                            <div className="text-end fst-italic text-muted">
                                Bằng chữ: {numberToWords(quote.totalAmount)}
                            </div>
                        </Col>
                    </Row>

                    <hr className="my-4" />

                    <div className="d-flex justify-content-end gap-2">
                      <Button 
                        variant="danger" 
                        size="lg"
                        onClick={()=>setConfirm({ type: 'REJECTED', open: true })} 
                        disabled={working || quote.status !== 'SENT'}
                      >
                        <FaTimesCircle className="me-2" /> Từ Chối
                      </Button>
                      <Button 
                        variant="success" 
                        size="lg"
                        onClick={()=>setConfirm({ type: 'ACCEPTED', open: true })} 
                        disabled={working || quote.status !== 'SENT'}
                      >
                        <FaCheckCircle className="me-2" /> Chấp Nhận Báo Giá
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-5 text-muted">Không tìm thấy báo giá</div>
                )}
              </Card.Body>
            </Card>

            <Modal show={confirm.open} onHide={()=>setConfirm({ type: null, open: false })} centered>
              <Modal.Header closeButton>
                <Modal.Title>
                  {confirm.type==='ACCEPTED' ? 'Xác nhận đồng ý báo giá' : 'Xác nhận từ chối báo giá'}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>Bạn có chắc chắn muốn <strong>{confirm.type==='ACCEPTED' ? 'chấp nhận' : 'từ chối'}</strong> báo giá này không? Hành động này không thể hoàn tác.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={()=>setConfirm({ type: null, open: false })} disabled={working}>
                  Hủy
                </Button>
                <Button 
                  variant={confirm.type==='ACCEPTED' ? 'success' : 'danger'} 
                  onClick={()=>onConfirm(confirm.type)} 
                  disabled={working}
                >
                  {working ? <><Spinner size="sm" /> Đang xử lý...</> : (confirm.type === 'ACCEPTED' ? 'Chấp Nhận' : 'Từ Chối')}
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
