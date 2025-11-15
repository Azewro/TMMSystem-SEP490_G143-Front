import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';

import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { productService } from '../../api/productService';
import { customerService } from '../../api/customerService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { rfqService } from '../../api/rfqService';
import '../../styles/QuoteRequest.css';

registerLocale('vi', vi);

const getMinExpectedDeliveryDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 30); // Add 30 days
  return today;
};

const QuoteRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { clearCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    employeeCode: '',
    contactAddress: '',
    contactMethod: 'Điện thoại',
    expectedDeliveryDate: null, // Changed to null for Date object
    notes: '',
  });
  
  const [quoteItems, setQuoteItems] = useState([{ productId: '', quantity: '1', unit: 'cai', notes: '', standardDimensions: '' }]);
  const [isFromCart, setIsFromCart] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      
      // Reset form when user logs out
      if (!isAuthenticated) {
        setFormData({
          contactPerson: '',
          contactPhone: '',
          contactEmail: '',
          employeeCode: '',
          contactAddress: '',
          contactMethod: 'Điện thoại',
          expectedDeliveryDate: null,
          notes: '',
        });
        setQuoteItems([{ productId: '', quantity: '1', unit: 'cai', notes: '', standardDimensions: '' }]);
        setIsFromCart(false);
        setErrors({});
        // Navigate to home page if not authenticated and no cart products
        if (!location.state?.cartProducts?.length && !location.state?.preSelectedProduct) {
          navigate('/');
          setLoading(false);
          return;
        }
      }
      
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
          notes: '', // notes should be empty initially
          standardDimensions: p.standardDimensions || '', // Correctly assign to standardDimensions
          name: p.name
        }));
        setQuoteItems(itemsFromCart);
        setIsFromCart(true);
      } else if (location.state?.preSelectedProduct) {
        const { id, standardDimensions, name } = location.state.preSelectedProduct;
        setQuoteItems([{ 
          productId: id.toString(), 
          quantity: '1', 
          unit: 'cai', 
          notes: '', // notes should be empty initially
          standardDimensions: standardDimensions || '', 
          name 
        }]);
        setIsFromCart(false);
      }
      
      try {
        const productData = await productService.getAllProducts();
        setProducts(productData || []);
      } catch (err) {
        toast.error('Lỗi khi tải danh sách sản phẩm.');
      }

      setLoading(false);
    };
    initialize();
  }, [isAuthenticated, user, location.state, navigate]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, expectedDeliveryDate: date }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...quoteItems];
    
    // Kiểm tra trùng lặp khi chọn sản phẩm
    if (field === 'productId' && value) {
      const productIdInt = parseInt(value, 10);
      // Kiểm tra xem sản phẩm này đã được chọn ở dòng khác chưa
      const isDuplicate = newItems.some((item, idx) => 
        idx !== index && item.productId && parseInt(item.productId, 10) === productIdInt
      );
      
      if (isDuplicate) {
        toast.error('Sản phẩm này đã được thêm vào danh sách. Vui lòng chọn sản phẩm khác.');
        return; // Không cập nhật nếu trùng lặp
      }
      
      const selectedProduct = products.find(p => p.id === productIdInt);
      if (selectedProduct) {
        newItems[index].standardDimensions = selectedProduct.standardDimensions;
      } else {
        newItems[index].standardDimensions = '';
      }
    }
    
    newItems[index][field] = value;
    setQuoteItems(newItems);
  };

  const handleAddProduct = () => {
    // Kiểm tra xem có sản phẩm nào chưa được chọn (productId rỗng) không
    const hasEmptyProduct = quoteItems.some(item => !item.productId || item.productId === '');
    if (hasEmptyProduct) {
      toast.error('Vui lòng chọn sản phẩm cho dòng hiện tại trước khi thêm sản phẩm mới.');
      return;
    }
    setQuoteItems([...quoteItems, { productId: '', quantity: '1', unit: 'cai', notes: '', standardDimensions: '' }]);
  };

  const handleRemoveProduct = (index) => {
    if (quoteItems.length > 1) {
      const newItems = quoteItems.filter((_, i) => i !== index);
      setQuoteItems(newItems);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Họ và tên là bắt buộc.';
    if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Số điện thoại là bắt buộc.';
    if (!formData.contactEmail.trim()) {
        newErrors.contactEmail = 'Email là bắt buộc.';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
        newErrors.contactEmail = 'Email không hợp lệ.';
    }
    if (!formData.contactAddress.trim()) newErrors.contactAddress = 'Địa chỉ nhận hàng là bắt buộc.';
    if (!formData.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Ngày giao hàng mong muốn là bắt buộc.';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      if (validationErrors.contactEmail) {
        toast.error(validationErrors.contactEmail);
      } else if (validationErrors.expectedDeliveryDate) {
        toast.error(validationErrors.expectedDeliveryDate);
      } else {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      }
      return;
    }
    setSubmitting(true);

    const details = quoteItems.map(item => ({
      productId: parseInt(item.productId),
      quantity: parseInt(item.quantity),
      unit: item.unit,
      notes: item.notes,
    }));

    // Format date object to YYYY-MM-DD string for API
    const formattedDate = formData.expectedDeliveryDate 
      ? formData.expectedDeliveryDate.toISOString().split('T')[0] 
      : null;

    const contactMethodMap = {
      'Điện thoại': 'PHONE',
      'Email': 'EMAIL',
      'Cả hai': 'PHONE', // Default to PHONE when 'Both' is selected
    };
    const apiContactMethod = contactMethodMap[formData.contactMethod] || 'PHONE';

    const rfqData = {
      contactMethod: apiContactMethod,
      expectedDeliveryDate: formattedDate,
      notes: formData.notes,
      details: details,
      status: 'DRAFT',
      ...(isAuthenticated ? { customerId: user.customerId } : {
        contactPerson: formData.contactPerson,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        contactAddress: formData.contactAddress,
        employeeCode: formData.employeeCode,
      }),
    };

    try {
      await rfqService.createRfq(rfqData, isAuthenticated);
      toast.success('Yêu cầu báo giá đã được gửi thành công!');
      clearCart();
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      toast.error(err.message || 'Gửi yêu cầu thất bại. Vui lòng kiểm tra lại thông tin.');
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
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/')}>
              &larr; Quay lại trang chủ
            </Button>
            <Row className="justify-content-center">
              <Col lg={10} xl={8}>
                <Card className="shadow-sm">
                  <Card.Body className="p-4">
                    <div className="text-center mb-4">
                      <h2 className="fw-bold">Tạo Yêu Cầu Báo Giá</h2>
                      <p className="text-muted">Điền thông tin và sản phẩm bạn muốn nhận báo giá.</p>
                    </div>

                    <Form onSubmit={handleSubmit} noValidate>
                      <h5 className="mb-3">Thông Tin Liên Hệ</h5>
                      <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Họ và tên <span style={{ color: 'red' }}>*</span></Form.Label><Form.Control type="text" name="contactPerson" value={formData.contactPerson} onChange={handleFormChange} isInvalid={!!errors.contactPerson} /><Form.Control.Feedback type="invalid">{errors.contactPerson}</Form.Control.Feedback></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Số điện thoại <span style={{ color: 'red' }}>*</span></Form.Label><Form.Control type="text" name="contactPhone" value={formData.contactPhone} onChange={handleFormChange} isInvalid={!!errors.contactPhone} /><Form.Control.Feedback type="invalid">{errors.contactPhone}</Form.Control.Feedback></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Email <span style={{ color: 'red' }}>*</span></Form.Label><Form.Control type="email" name="contactEmail" value={formData.contactEmail} onChange={handleFormChange} isInvalid={!!errors.contactEmail} /><Form.Control.Feedback type="invalid">{errors.contactEmail}</Form.Control.Feedback></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Mã nhân viên Sale (nếu có)</Form.Label><Form.Control type="text" name="employeeCode" value={formData.employeeCode} onChange={handleFormChange} /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Địa chỉ nhận hàng <span style={{ color: 'red' }}>*</span></Form.Label><Form.Control as="textarea" rows={1} name="contactAddress" value={formData.contactAddress} onChange={handleFormChange} isInvalid={!!errors.contactAddress} /><Form.Control.Feedback type="invalid">{errors.contactAddress}</Form.Control.Feedback></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Phương thức liên hệ</Form.Label><Form.Select name="contactMethod" value={formData.contactMethod} onChange={handleFormChange}><option>Điện thoại</option><option>Email</option><option>Cả hai</option></Form.Select></Form.Group></Col>
                      </Row>
                      <hr />

                      <h5 className="mb-3">Chi Tiết Yêu Cầu</h5>
                      <div className="border rounded p-3">
                        {quoteItems.map((item, index) => {
                          const selectedProduct = products.find(p => p.id === parseInt(item.productId, 10));
                          const productName = selectedProduct?.name || item.name || 'Chưa chọn sản phẩm';
                          
                          return (
                            <div key={item.productId || index} className={index > 0 ? "mt-3 pt-3 border-top" : ""}>
                              <div className="d-flex justify-content-between align-items-center">
                                <h6>
                                  Sản phẩm: {isFromCart ? (
                                    <span className="fw-normal text-muted ms-2">{productName}</span>
                                  ) : (
                                    <Form.Select
                                      size="sm"
                                      value={item.productId}
                                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                      required
                                      className="ms-2 d-inline-block"
                                      style={{ width: 'auto', minWidth: '200px' }}
                                    >
                                      <option value="">Chọn sản phẩm</option>
                                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </Form.Select>
                                  )}
                                </h6>
                                {!isFromCart && quoteItems.length > 1 && (
                                  <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveProduct(index)}>
                                    Xóa
                                  </Button>
                                )}
                              </div>
                              <Row className="align-items-end mt-2">
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Số lượng <span style={{ color: 'red' }}>*</span></Form.Label>
                                    <div className="form-control-plaintext border rounded px-3 py-2 bg-light" style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
                                      {item.quantity}
                                    </div>
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Kích thước</Form.Label>
                                    <div className="form-control-plaintext border rounded px-3 py-2 bg-light" style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
                                      {item.standardDimensions || 'N/A'}
                                    </div>
                                  </Form.Group>
                                </Col>
                              </Row>
                            </div>
                          );
                        })}
                      </div>
                      
                      {!isFromCart && (
                        <Button variant="outline-primary" size="sm" className="mt-3" onClick={handleAddProduct}>
                          + Thêm sản phẩm
                        </Button>
                      )}

                      <Row className="mt-3">
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="mb-2 w-100">Ngày giao hàng mong muốn <span style={{ color: 'red' }}>*</span></Form.Label>
                            <DatePicker
                              selected={formData.expectedDeliveryDate}
                              onChange={handleDateChange}
                              dateFormat="dd/MM/yyyy"
                              minDate={getMinExpectedDeliveryDate()}
                              className="form-control"
                              placeholderText="Chọn ngày"
                              locale="vi"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={12}><Form.Group className="mb-3"><Form.Label>Ghi chú chung</Form.Label><Form.Control as="textarea" rows={3} name="notes" value={formData.notes} onChange={handleFormChange} placeholder="Yêu cầu đặc biệt cho toàn bộ đơn hàng..." /></Form.Group></Col>
                      </Row>

                      <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button variant="primary" type="submit" disabled={submitting}>
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