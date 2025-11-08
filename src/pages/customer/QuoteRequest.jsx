import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { productService } from '../../api/productService';
import { customerService } from '../../api/customerService';
import { useAuth } from '../../context/AuthContext';
import { rfqService } from '../../api/rfqService';
import '../../styles/QuoteRequest.css';

const QuoteRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    employeeCode: '',
    contactAddress: '',
    contactMethod: 'Điện thoại', // Default value for the new dropdown
    expectedDeliveryDate: '',
    notes: '',
    agreedToTerms: false, // New state for checkbox
  });
  
  const [quoteItems, setQuoteItems] = useState([{ productId: '', quantity: '1', unit: 'cai', notes: '' }]);
  const [isFromCart, setIsFromCart] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      if (isAuthenticated && user?.customerId) {
        try {
          const customerData = await customerService.getCustomerById(user.customerId);
          setFormData(prev => ({
            ...prev,
            contactPerson: customerData.contactPerson || user.name || '',
            contactEmail: customerData.email || user.email || '',
            contactPhone: customerData.phoneNumber || '',
            contactAddress: customerData.address || ''
          }));
        } catch (error) {
          console.error("Failed to fetch customer details:", error);
        }
      }

      if (location.state?.cartProducts?.length > 0) {
        const itemsFromCart = location.state.cartProducts.map(p => ({
          productId: p.id.toString(),
          quantity: p.quantity.toString() || '1',
          unit: 'cai',
          notes: p.standardDimensions || '',
          name: p.name
        }));
        setQuoteItems(itemsFromCart);
        setIsFromCart(true);
      } else if (location.state?.preSelectedProduct) {
        const { id, standardDimensions, name } = location.state.preSelectedProduct;
        setQuoteItems([{ productId: id.toString(), quantity: '1', unit: 'cai', notes: standardDimensions || '', name }]);
        setIsFromCart(false);
      }
      
      try {
        const productData = await productService.getAllProducts();
        setProducts(productData || []);
      } catch (err) {
        setError('Lỗi khi tải danh sách sản phẩm.');
      }

      setLoading(false);
    };
    initialize();
  }, [isAuthenticated, user, location.state]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...quoteItems];
    newItems[index][field] = value;
    setQuoteItems(newItems);
  };

  const handleAddProduct = () => {
    setQuoteItems([...quoteItems, { productId: '', quantity: '1', unit: 'cai', notes: '' }]);
  };

  const handleRemoveProduct = (index) => {
    if (quoteItems.length > 1) {
      const newItems = quoteItems.filter((_, i) => i !== index);
      setQuoteItems(newItems);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreedToTerms) {
      setError('Bạn phải đồng ý với điều khoản và điều kiện của công ty.');
      return;
    }
    setError('');
    setSubmitting(true);

    const details = quoteItems.map(item => ({
      productId: parseInt(item.productId),
      quantity: parseInt(item.quantity),
      unit: item.unit,
      notes: item.notes,
    }));

    const rfqData = {
      ...(isAuthenticated ? { customerId: user.customerId } : {
        contactPerson: formData.contactPerson,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        contactAddress: formData.contactAddress,
        employeeCode: formData.employeeCode,
      }),
      expectedDeliveryDate: formData.expectedDeliveryDate,
      notes: formData.notes,
      details: details,
      status: 'DRAFT', // Explicitly set status
    };

    try {
      await rfqService.createRfq(rfqData, isAuthenticated);
      setSuccess('Yêu cầu báo giá đã được gửi thành công!');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.message || 'Gửi yêu cầu thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" /></div>;
  }

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        {isAuthenticated && <Sidebar />}
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container>
            <Row className="justify-content-center">
              <Col lg={10} xl={8}>
                <Card className="shadow-sm">
                  <Card.Body className="p-4">
                    <div className="text-center mb-4">
                      <h2 className="fw-bold">Tạo Yêu Cầu Báo Giá</h2>
                      <p className="text-muted">Điền thông tin và sản phẩm bạn muốn nhận báo giá.</p>
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form onSubmit={handleSubmit}>
                      <h5 className="mb-3">Thông Tin Liên Hệ</h5>
                      <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Họ và tên *</Form.Label><Form.Control type="text" name="contactPerson" value={formData.contactPerson} onChange={handleFormChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Số điện thoại *</Form.Label><Form.Control type="text" name="contactPhone" value={formData.contactPhone} onChange={handleFormChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Email *</Form.Label><Form.Control type="email" name="contactEmail" value={formData.contactEmail} onChange={handleFormChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Mã nhân viên Sale (nếu có)</Form.Label><Form.Control type="text" name="employeeCode" value={formData.employeeCode} onChange={handleFormChange} /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Địa chỉ *</Form.Label><Form.Control as="textarea" rows={1} name="contactAddress" value={formData.contactAddress} onChange={handleFormChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Phương thức liên hệ</Form.Label><Form.Select name="contactMethod" value={formData.contactMethod} onChange={handleFormChange}><option>Điện thoại</option><option>Email</option><option>Cả hai</option></Form.Select></Form.Group></Col>
                      </Row>
                      <hr />

                      <h5 className="mb-3">Chi Tiết Yêu Cầu</h5>
                      <div className="border rounded p-3">
                        {quoteItems.map((item, index) => (
                          <div key={item.productId || index} className={index > 0 ? "mt-3 pt-3 border-top" : ""}>
                            <div className="d-flex justify-content-between align-items-center">
                              <h6>Sản phẩm: {isFromCart || (location.state?.preSelectedProduct && index === 0) ? <strong>{item.name}</strong> :
                                <Form.Select size="sm" value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} required>
                                  <option value="">Chọn sản phẩm</option>
                                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Form.Select>
                              }</h6>
                              {!isFromCart && quoteItems.length > 1 && (
                                <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveProduct(index)}>
                                  Xóa
                                </Button>
                              )}
                            </div>
                            <Row className="align-items-end mt-2">
                              <Col md={6}><Form.Group><Form.Label>Số lượng *</Form.Label><Form.Control type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="1" required /></Form.Group></Col>
                              <Col md={6}><Form.Group><Form.Label>Ghi chú (Kích thước...)</Form.Label><Form.Control type="text" value={item.notes} onChange={(e) => handleItemChange(index, 'notes', e.target.value)} placeholder="VD: 30x30cm" /></Form.Group></Col>
                            </Row>
                          </div>
                        ))}
                      </div>
                      
                      {!isFromCart && (
                        <Button variant="outline-primary" size="sm" className="mt-3" onClick={handleAddProduct}>
                          + Thêm sản phẩm
                        </Button>
                      )}

                      <Row className="mt-3">
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Ngày giao hàng mong muốn</Form.Label><Form.Control type="date" name="expectedDeliveryDate" value={formData.expectedDeliveryDate} onChange={handleFormChange} /></Form.Group></Col>
                        <Col md={12}><Form.Group className="mb-3"><Form.Label>Ghi chú chung</Form.Label><Form.Control as="textarea" rows={3} name="notes" value={formData.notes} onChange={handleFormChange} placeholder="Yêu cầu đặc biệt cho toàn bộ đơn hàng..." /></Form.Group></Col>
                      </Row>

                      <Form.Group className="my-3">
                        <Form.Check type="checkbox" name="agreedToTerms" label="Tôi đồng ý với điều khoản và điều kiện của công ty" checked={formData.agreedToTerms} onChange={handleFormChange} required />
                      </Form.Group>

                      <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button variant="secondary" type="button" onClick={() => navigate(-1)} disabled={submitting}>Quay Lại</Button>
                        <Button variant="primary" type="submit" disabled={submitting || !formData.agreedToTerms}>
                          {submitting ? <><Spinner size="sm" /> Gửi Yêu Cầu...</> : "Gửi Yêu Cầu Báo Giá"}
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QuoteRequest;