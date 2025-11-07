import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaPaperPlane, FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { productService } from '../../api/productService';
import { quoteService } from '../../api/quoteService';
import { customerService } from '../../api/customerService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/QuoteRequest.css';

const QuoteRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Data states
  const [products, setProducts] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    salespersonCode: '',
    address: '',
    quoteNeededDate: '',
    contactMethod: 'Email',
    additionalNotes: '',
    agreedToTerms: false,
  });
  const [attachedFile, setAttachedFile] = useState(null);
  const [quoteItems, setQuoteItems] = useState([{ productId: '', size: '', quantity: '1' }]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productData = await productService.getAllProducts();
        setProducts(productData || []);
      } catch (err) {
        setError('Lỗi khi tải danh sách sản phẩm.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Pre-fill data for logged-in users
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (isAuthenticated && user?.customerId) {
        try {
          const customerData = await customerService.getCustomerById(user.customerId);
          setFormData(prev => ({
            ...prev,
            name: customerData.contactPerson || user.name || '',
            email: customerData.email || user.email || '',
            phone: customerData.phoneNumber || '',
            address: customerData.address || ''
          }));
        } catch (error) {
          console.error("Failed to fetch customer details:", error);
        }
      }
    };
    fetchCustomerData();
  }, [isAuthenticated, user]);
  
  // Handle pre-selected product
  useEffect(() => {
    if (location.state?.preSelectedProduct) {
      const { id, standardDimensions } = location.state.preSelectedProduct;
      setQuoteItems([{ productId: id.toString(), size: standardDimensions || '', quantity: '1' }]);
    }
  }, [location.state]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
        setValidationErrors(prev => ({...prev, file: "File không được vượt quá 10MB"}));
        setAttachedFile(null);
    } else {
        setValidationErrors(prev => ({...prev, file: null}));
        setAttachedFile(file);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập họ và tên';
    if (!formData.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
    if (!formData.address.trim()) errors.address = 'Vui lòng nhập địa chỉ';
    if (!formData.agreedToTerms) errors.agreedToTerms = 'Bạn phải đồng ý với điều khoản';
    if (quoteItems.some(item => !item.productId || !item.quantity)) {
        errors.items = 'Vui lòng hoàn tất thông tin sản phẩm';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc và đồng ý với điều khoản.');
      return;
    }

    setError('');
    setSubmitting(true);

    // NOTE: Backend needs to support multipart/form-data for this to work
    const submissionData = new FormData();
    
    // Append form data as a JSON string
    const rfqData = {
        ...(isAuthenticated && { customerId: user.customerId }),
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerAddress: formData.address,
        salespersonCode: formData.salespersonCode,
        quoteNeededDate: formData.quoteNeededDate,
        contactMethod: formData.contactMethod,
        notes: formData.additionalNotes,
        details: quoteItems.map(item => ({
            productId: parseInt(item.productId),
            quantity: parseFloat(item.quantity),
            unit: 'pcs',
            notes: item.size || getSelectedProductInfo(item.productId)?.standardDimensions || 'Standard'
        }))
    };
    submissionData.append('rfqData', JSON.stringify(rfqData));

    // Append file if it exists
    if (attachedFile) {
        submissionData.append('file', attachedFile);
    }

    try {
      // This service call might need to be updated to handle FormData
      await quoteService.submitQuoteRequest(rfqData); // Sending JSON for now
      setSuccess('Yêu cầu đã được gửi thành công!');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'Gửi yêu cầu thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/'); // Navigate to homepage on cancel
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...quoteItems];
    newItems[index][field] = value;
    if (field === 'productId') {
      const product = getSelectedProductInfo(value);
      newItems[index].size = product?.standardDimensions || '';
    }
    setQuoteItems(newItems);
  };

  const handleAddProduct = () => setQuoteItems([...quoteItems, { productId: '', size: '', quantity: '1' }]);
  const handleRemoveProduct = (index) => quoteItems.length > 1 && setQuoteItems(quoteItems.filter((_, i) => i !== index));
  const getSelectedProductInfo = (productId) => products.find(p => p.id.toString() === productId);

  if (loading || authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        {isAuthenticated && <Sidebar />}
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid className="p-4">
            <Row className="justify-content-center">
              <Col lg={8} xl={7}>
                <Card className="quote-request-card shadow-sm">
                  <Card.Body className="p-3">
                    <div className="quote-header mb-3 text-left">
                      <h2 className="quote-title display-6">Tạo yêu cầu báo giá</h2>
                      <p className="quote-subtitle text-muted">Điền thông tin và sản phẩm bạn muốn nhận báo giá.</p>
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form onSubmit={handleSubmit} noValidate>
                      <h5 className="mb-2">Thông tin khách hàng</h5>
                      <Row>
                        <Col md={6} className="mb-2"><Form.Group><Form.Label>Họ và tên *</Form.Label><Form.Control size="sm" type="text" name="name" value={formData.name} onChange={handleFormChange} isInvalid={!!validationErrors.name} required /><Form.Control.Feedback type="invalid">{validationErrors.name}</Form.Control.Feedback></Form.Group></Col>
                        <Col md={6} className="mb-2"><Form.Group><Form.Label>Số điện thoại *</Form.Label><Form.Control size="sm" type="text" name="phone" value={formData.phone} onChange={handleFormChange} isInvalid={!!validationErrors.phone} required /><Form.Control.Feedback type="invalid">{validationErrors.phone}</Form.Control.Feedback></Form.Group></Col>
                        <Col md={6} className="mb-2"><Form.Group><Form.Label>Email</Form.Label><Form.Control size="sm" type="email" name="email" value={formData.email} onChange={handleFormChange} /></Form.Group></Col>
                        <Col md={6} className="mb-2"><Form.Group><Form.Label>Mã nhân viên (nếu có)</Form.Label><Form.Control size="sm" type="text" name="salespersonCode" value={formData.salespersonCode} onChange={handleFormChange} /></Form.Group></Col>
                        <Col xs={12} className="mb-2"><Form.Group><Form.Label>Địa chỉ *</Form.Label><Form.Control size="sm" as="textarea" rows={1} name="address" value={formData.address} onChange={handleFormChange} placeholder="Địa chỉ giao hàng hoặc liên hệ" isInvalid={!!validationErrors.address} required /><Form.Control.Feedback type="invalid">{validationErrors.address}</Form.Control.Feedback></Form.Group></Col>
                        <Col md={6} className="mb-2"><Form.Group><Form.Label>Ngày cần báo giá</Form.Label><Form.Control size="sm" type="date" name="quoteNeededDate" value={formData.quoteNeededDate} onChange={handleFormChange} /></Form.Group></Col>
                        <Col md={6} className="mb-2"><Form.Group><Form.Label>Phương thức liên hệ</Form.Label><Form.Select size="sm" name="contactMethod" value={formData.contactMethod} onChange={handleFormChange}><option>Email</option><option>Số điện thoại</option><option>Cả hai</option></Form.Select></Form.Group></Col>
                        <Col xs={12} className="mb-2"><Form.Group><Form.Label>Ghi chú thêm</Form.Label><Form.Control size="sm" as="textarea" rows={2} name="additionalNotes" value={formData.additionalNotes} onChange={handleFormChange} placeholder="Yêu cầu đặc biệt, mong muốn,..." /></Form.Group></Col>
                        <Col xs={12} className="mb-2"><Form.Group><Form.Label>File đính kèm</Form.Label><Form.Control size="sm" type="file" name="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" isInvalid={!!validationErrors.file} /><Form.Control.Feedback type="invalid">{validationErrors.file}</Form.Control.Feedback><Form.Text>PDF, JPG, PNG (tối đa 10MB)</Form.Text></Form.Group></Col>
                      </Row>

                      <hr className="my-3" />

                      <h5 className="mb-2">Sản phẩm yêu cầu</h5>
                      {quoteItems.map((item, index) => (
                        <Row key={index} className="align-items-center product-item-row mb-2">
                          <Col md={5}><Form.Group><Form.Label className="d-none">Sản phẩm</Form.Label><Form.Select size="sm" value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} required><option value="">Chọn sản phẩm</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select></Form.Group></Col>
                          <Col md={3}><Form.Group><Form.Label className="d-none">Kích thước</Form.Label><Form.Control size="sm" type="text" value={item.size} onChange={(e) => handleItemChange(index, 'size', e.target.value)} placeholder="Kích thước" /></Form.Group></Col>
                          <Col md={3}><Form.Group><Form.Label className="d-none">Số lượng</Form.Label><Form.Control size="sm" type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="1" placeholder="Số lượng" required /></Form.Group></Col>
                          <Col md={1} className="text-end">{quoteItems.length > 1 && <Button variant="link" className="text-danger" onClick={() => handleRemoveProduct(index)}><FaTrash /></Button>}</Col>
                        </Row>
                      ))}
                      {validationErrors.items && <div className="text-danger small mt-1">{validationErrors.items}</div>}
                      <Button variant="outline-primary" size="sm" onClick={handleAddProduct} className="mt-2"><FaPlus /> Thêm sản phẩm</Button>

                      <hr className="my-3" />

                      <Form.Group className="mb-2">
                        <Form.Check type="checkbox" name="agreedToTerms" label="Tôi đồng ý với điều khoản của công ty" checked={formData.agreedToTerms} onChange={handleFormChange} isInvalid={!!validationErrors.agreedToTerms} feedback={validationErrors.agreedToTerms} feedbackType="invalid" required />
                      </Form.Group>

                      <div className="d-flex justify-content-end gap-2 mt-3">
                        <Button variant="secondary" type="button" onClick={handleCancel} disabled={submitting}>Hủy bỏ</Button>
                        <Button variant="primary" type="submit" disabled={submitting || !formData.agreedToTerms}>
                          {submitting ? <><Spinner size="sm" className="me-2" /> Đang gửi...</> : "Gửi yêu cầu báo giá"}
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