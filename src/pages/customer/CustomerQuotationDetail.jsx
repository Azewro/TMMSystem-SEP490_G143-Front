import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Alert, Modal, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';
import { customerService } from '../../api/customerService';
import { authService } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';
import ConfirmOrderProfileModal from '../../components/modals/ConfirmOrderProfileModal';
import toast from 'react-hot-toast';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
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
      } else if (u > 0) {
        if (h > 0 || num >= 1000) {
          chunkWords.push("linh " + units[u]);
        } else {
          chunkWords.push(units[u]);
        }
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

const CountdownTimer = ({ sentAt }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!sentAt) return;

    const calculateTimeLeft = () => {
      const sentTime = new Date(sentAt).getTime();
      const expirationTime = sentTime + 12 * 60 * 60 * 1000; // + 12 hours
      const now = new Date().getTime();
      const difference = expirationTime - now;

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null); // Expired
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [sentAt]);

  if (!timeLeft) {
    return <Badge bg="danger" className="p-2 fs-6">Đã hết hạn</Badge>;
  }

  return (
    <Badge bg="warning" text="dark" className="p-2 fs-6">
      {timeLeft.hours.toString().padStart(2, '0')}:{timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
    </Badge>
  );
};


const CustomerQuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quote, setQuote] = useState(null);
  const [productDetails, setProductDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirm, setConfirm] = useState({ type: null, open: false });
  const [working, setWorking] = useState(false);
  const [showConfirmOrderModal, setShowConfirmOrderModal] = useState(false);

  const handleAcceptQuoteAndCreateOrder = async () => {
    if (!quote?.id) return;
    setWorking(true);
    setError('');
    setSuccess('');
    try {
      await quoteService.updateQuotationStatus(quote.id, 'ACCEPTED');
      try {
        await quoteService.createOrderFromQuotation({ quotationId: quote.id });
      } catch (orderErr) {
        console.log('Order creation failed or already exists:', orderErr.message);
      }
      setSuccess('✅ Bạn đã đồng ý báo giá. Đơn hàng đã được tạo và đang chờ xử lý.');
      toast.success('Chấp nhận báo giá thành công! Đơn hàng đã được tạo.');
      setTimeout(() => navigate('/customer/orders'), 3000);
    } catch (e) {
      setError(e.message || 'Thao tác thất bại');
      toast.error(e.message || 'Thao tác thất bại');
    } finally {
      setWorking(false);
    }
  };

  const handleAcceptClick = async () => {
    if (!user?.customerId) {
      toast.error('Không thể xác thực thông tin khách hàng.');
      return;
    }
    setWorking(true);
    try {
      const profile = await customerService.getCustomerById(user.customerId);
      const isInfoComplete = profile.companyName && profile.address && profile.taxCode;

      setShowConfirmOrderModal(true);

      if (isInfoComplete) {
        toast.success('Vui lòng xác nhận lại thông tin trước khi tạo đơn hàng.');
      } else {
        toast.error('Vui lòng điền đầy đủ thông tin công ty, địa chỉ và mã số thuế.');
      }
    } catch (err) {
      toast.error('Không thể tải thông tin cá nhân.');
    } finally {
      setWorking(false);
    }
  };


  useEffect(() => {
    const fetchDetails = async () => {
      if (!user?.customerId) {
        setError('Không thể xác thực người dùng.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        // Workaround: Fetch both detail and list to get correct status
        const [quoteData, customerQuotes] = await Promise.all([
          quoteService.getQuoteDetails(parseInt(id, 10)),
          quoteService.getCustomerQuotations(user.customerId)
        ]);

        // Find the quote from the list to get the correct status
        const correctQuoteInfo = customerQuotes.find(q => q.id === parseInt(id, 10));
        if (correctQuoteInfo) {
          quoteData.status = correctQuoteInfo.status; // Patch the status
        }

        // Fetch all product details in parallel
        const productPromises = quoteData.details.map(item =>
          productService.getProductById(item.productId)
        );
        const products = await Promise.all(productPromises);

        const productsMap = products.reduce((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {});
        setProductDetails(productsMap);

        const enrichedDetails = quoteData.details.map(item => ({
          ...item,
          totalPrice: item.unitPrice * item.quantity
        }));

        setQuote({
          ...quoteData,
          details: enrichedDetails,
        });

      } catch (e) {
        setError(e.message || 'Không thể tải báo giá');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDetails();
    }
  }, [id, user]);

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
      setTimeout(() => navigate('/customer/quotations'), 2000);
    } catch (e) {
      setError(e.message || 'Thao tác thất bại');
    } finally {
      setWorking(false);
      setConfirm({ type: null, open: false });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return { text: 'Bản nháp', bg: 'secondary' };
      case 'SENT': return { text: 'Đã gửi', bg: 'info' };
      case 'ACCEPTED': return { text: 'Đã chấp nhận', bg: 'success' };
      case 'REJECTED': return { text: 'Đã từ chối', bg: 'danger' };
      case 'ORDER_CREATED': return { text: 'Đã chấp nhận', bg: 'success' };
      default: return { text: status || 'Không xác định', bg: 'secondary' };
    }
  };

  const totalWeight = quote?.details.reduce((total, item) => {
    const product = productDetails[item.productId];
    const weight = (product?.standardWeight || 0) / 1000;
    return total + (item.quantity * weight);
  }, 0) || 0;


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

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : quote ? (
              <Card className="shadow-sm p-5 mx-auto" style={{ maxWidth: '800px' }}>
                <div className="text-end mb-4">
                  <h5 className="mb-0">CÔNG TY TNHH DỆT MAY MỸ ĐỨC</h5>
                  <p className="mb-0">Địa chỉ: X. Phùng Xá, H. Mỹ Đức, Hà Nội, Việt Nam</p>
                </div>

                <div className="mb-4">
                  <p className="mb-1">Mã báo giá: {quote?.quotationNumber || `QUO-${quote?.id}`}</p>
                </div>

                <h2 className="text-center mb-4 fw-bold">BẢNG BÁO GIÁ</h2>

                <div className="mb-4">
                  <p className="mb-1">Kính gửi: {quote.contactPersonSnapshot || quote.customer?.contactPerson || quote.customer?.companyName || 'Quý khách hàng'}</p>
                  <p className="mb-1">{quote.customer?.companyName || 'Công Ty TNHH Dệt May Mỹ Đức'}</p>
                  <p className="mb-0">xin trân trọng báo giá các sản phẩm như sau:</p>
                </div>

                <Table bordered responsive className="mb-4">
                  <thead>
                    <tr className="text-center">
                      <th style={{ width: '5%' }}>STT</th>
                      <th style={{ width: '35%' }}>THÔNG TIN SẢN PHẨM</th>
                      <th style={{ width: '10%' }}>SỐ LƯỢNG</th>
                      <th style={{ width: '10%' }}>KHỐI LƯỢNG (kg)</th>
                      <th style={{ width: '15%' }}>ĐƠN GIÁ (VNĐ)</th>
                      <th style={{ width: '25%' }}>THÀNH TIỀN (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.details.map((item, idx) => {
                      const product = productDetails[item.productId];
                      const itemWeight = product ? (item.quantity * (product.standardWeight || 0)) / 1000 : 0;
                      return (
                        <tr key={item.id || idx}>
                          <td className="text-center">{idx + 1}</td>
                          <td>
                            <div>{product?.name || 'Sản phẩm không xác định'}</div>
                            <small className="text-muted">Kích thước: {product?.standardDimensions || 'N/A'}</small>
                          </td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-center">{itemWeight.toFixed(2)}</td>
                          <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                          <td className="text-end fw-bold">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end fw-bold">TỔNG CỘNG:</td>
                      <td className="text-center fw-bold">{totalWeight.toFixed(2)}</td>
                      <td className="text-end fw-bold"></td>
                      <td className="text-end fw-bold">{formatCurrency(quote.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </Table>

                <div className="mb-3">
                  <p className="mb-1">(Bằng chữ: {numberToWords(quote.totalAmount)})</p>
                </div>

                <div className="mb-3">
                  <p className="mb-1 fw-bold">Ghi chú:</p>
                  <ul className="list-unstyled ms-3">
                    <li>- Đơn giá chưa bao gồm thuế VAT</li>
                    <li>- Đơn giá chưa bao gồm phí vận chuyển</li>
                  </ul>
                </div>

                <div className="text-end mb-5">
                  <p className="mb-1">Hà Nội, ngày {formatDate(quote.createdAt)}</p>
                  <p className="mb-0 fw-bold">CÔNG TY TNHH DỆT MAY MỸ ĐỨC</p>
                </div>

                <p className="mb-0">Trân trọng kính chào!</p>
              </Card>
            ) : (
              <div className="text-center py-5 text-muted">Không tìm thấy báo giá</div>
            )}



            {quote && quote.status === 'SENT' && (
              <>
                <div className="d-flex flex-column align-items-end mt-4">
                  <div className="mb-2">
                    <span className="text-muted me-2">Thời gian còn lại để phản hồi:</span>
                    <CountdownTimer sentAt={quote.sentAt} />
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={() => setConfirm({ type: 'REJECTED', open: true })}
                    disabled={working}
                  >
                    <FaTimesCircle className="me-2" /> Từ Chối
                  </Button>
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleAcceptClick}
                    disabled={working}
                  >
                    <FaCheckCircle className="me-2" /> Chấp Nhận Báo Giá
                  </Button>
                </div>
              </>
            )}

            <ConfirmOrderProfileModal
              show={showConfirmOrderModal}
              onHide={() => setShowConfirmOrderModal(false)}
              onConfirm={handleAcceptQuoteAndCreateOrder}
            />

            <Modal show={confirm.open} onHide={() => setConfirm({ type: null, open: false })} centered>
              <Modal.Header closeButton>
                <Modal.Title>
                  {confirm.type === 'ACCEPTED' ? 'Xác nhận đồng ý báo giá' : 'Xác nhận từ chối báo giá'}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>Bạn có chắc chắn muốn <strong>{confirm.type === 'ACCEPTED' ? 'chấp nhận' : 'từ chối'}</strong> báo giá này không? Hành động này không thể hoàn tác.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setConfirm({ type: null, open: false })} disabled={working}>
                  Hủy
                </Button>
                <Button
                  variant={confirm.type === 'ACCEPTED' ? 'success' : 'danger'}
                  onClick={() => onConfirm(confirm.type)}
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
