import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';

import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar'; // Changed to InternalSidebar
import { productService } from '../../api/productService';
import { useAuth } from '../../context/AuthContext';
import { rfqService } from '../../api/rfqService';
import '../../styles/QuoteRequest.css';

registerLocale('vi', vi);

const getMinExpectedDeliveryDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 30); // Add 30 days
  return today;
};

// Renamed component
const CreateRfqForCustomer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // Sales user is authenticated

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    employeeCode: '', // Sales can fill this
    contactAddress: '',
    contactMethod: 'Điện thoại',
    expectedDeliveryDate: null,
    notes: '',
  });
  
  const [quoteItems, setQuoteItems] = useState([{ productId: '', quantity: '1', unit: 'cai', notes: '', standardDimensions: '' }]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      
      // Pre-fill sales employee code if available from logged-in user
      if (user?.employeeCode) {
        setFormData(prev => ({ ...prev, employeeCode: user.employeeCode }));
      }

      // Logic for pre-selected products (if any) remains the same
      if (location.state?.preSelectedProduct) {
        const { id, standardDimensions, name } = location.state.preSelectedProduct;
        setQuoteItems([{ 
          productId: id.toString(), 
          quantity: '1', 
          unit: 'cai', 
          notes: '',
          standardDimensions: standardDimensions || '', 
          name 
        }]);
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
  }, [user, location.state]);

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
    newItems[index][field] = value;

    if (field === 'productId' && value) {
      const selectedProduct = products.find(p => p.id === parseInt(value, 10));
      if (selectedProduct) {
        newItems[index].standardDimensions = selectedProduct.standardDimensions;
      } else {
        newItems[index].standardDimensions = '';
      }
    }
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
    if (quoteItems.some(item => !item.productId)) {
        toast.error('Vui lòng chọn sản phẩm cho tất cả các mục.');
        return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setSubmitting(true);

    const details = quoteItems.map(item => ({
      productId: parseInt(item.productId),
      quantity: parseInt(item.quantity),
      unit: item.unit,
      notes: item.notes,
    }));

    const formattedDate = formData.expectedDeliveryDate 
      ? formData.expectedDeliveryDate.toISOString().split('T')[0] 
      : null;

    const contactMethodMap = {
      'Điện thoại': 'PHONE',
      'Email': 'EMAIL',
      'Cả hai': 'PHONE',
    };
    const apiContactMethod = contactMethodMap[formData.contactMethod] || 'PHONE';

    // This payload is for creating an RFQ for a new/external customer
    const rfqData = {
      contactMethod: apiContactMethod,
      expectedDeliveryDate: formattedDate,
      notes: formData.notes,
      details: details,
      status: 'DRAFT',
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      contactAddress: formData.contactAddress,
      employeeCode: formData.employeeCode,
    };

    try {
      // Always use the public endpoint (isAuthenticated = false) for this form
      await rfqService.createRfq(rfqData, false);
      toast.success('Yêu cầu báo giá đã được tạo thành công!');
      setTimeout(() => navigate('/sales/rfqs'), 2000); // Navigate to sales RFQ list
    } catch (err) {
      toast.error(err.message || 'Tạo yêu cầu thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" /></div>;
  }

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="sales" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container>
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/sales/rfqs')}>
              &larr; Quay lại danh sách RFQ
            </Button>
            <Row className="justify-content-center">
              <Col lg={10} xl={8}>
                <Card className="shadow-sm">
                  <Card.Body className="p-4">
                    <div className="text-center mb-4">
                      <h2 className="fw-bold">Tạo Yêu Cầu Báo Giá (Hộ Khách Hàng)</h2>
                      <p className="text-muted">Điền thông tin khách hàng và sản phẩm cần báo giá.</p>
                    </div>

                    <Form onSubmit={handleSubmit} noValidate>
                      <h5 className="mb-3">Thông Tin Khách Hàng</h5>
                      <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Họ và tên *</Form.Label><Form.Control type="text" name="contactPerson" value={formData.contactPerson} onChange={handleFormChange} isInvalid={!!errors.contactPerson} /><Form.Control.Feedback type="invalid">{errors.contactPerson}</Form.Control.Feedback></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Số điện thoại *</Form.Label><Form.Control type="text" name="contactPhone" value={formData.contactPhone} onChange={handleFormChange} isInvalid={!!errors.contactPhone} /><Form.Control.Feedback type="invalid">{errors.contactPhone}</Form.Control.Feedback></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Email *</Form.Label><Form.Control type="email" name="contactEmail" value={formData.contactEmail} onChange={handleFormChange} isInvalid={!!errors.contactEmail} /><Form.Control.Feedback type="invalid">{errors.contactEmail}</Form.Control.Feedback></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Mã nhân viên Sale (của bạn)</Form.Label><Form.Control type="text" name="employeeCode" value={formData.employeeCode} onChange={handleFormChange} /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Địa chỉ nhận hàng *</Form.Label><Form.Control as="textarea" rows={1} name="contactAddress" value={formData.contactAddress} onChange={handleFormChange} isInvalid={!!errors.contactAddress} /><Form.Control.Feedback type="invalid">{errors.contactAddress}</Form.Control.Feedback></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Phương thức liên hệ</Form.Label><Form.Select name="contactMethod" value={formData.contactMethod} onChange={handleFormChange}><option>Điện thoại</option><option>Email</option><option>Cả hai</option></Form.Select></Form.Group></Col>
                      </Row>
                      <hr />

                      <h5 className="mb-3">Chi Tiết Yêu Cầu</h5>
                      <div className="border rounded p-3">
                        {quoteItems.map((item, index) => (
                          <div key={index} className={index > 0 ? "mt-3 pt-3 border-top" : ""}>
                            <div className="d-flex justify-content-between align-items-center">
                              <h6>Sản phẩm:
                                <Form.Select
                                  size="sm"
                                  value={item.productId}
                                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                  required
                                >
                                  <option value="">Chọn sản phẩm</option>
                                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Form.Select>
                              </h6>
                              {quoteItems.length > 1 && (
                                <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveProduct(index)}>
                                  Xóa
                                </Button>
                              )}
                            </div>
                            <Row className="align-items-end mt-2">
                              <Col md={6}><Form.Group><Form.Label>Số lượng *</Form.Label><Form.Control type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="1" required /></Form.Group></Col>
                              <Col md={6}><Form.Group><Form.Label>Kích thước</Form.Label><Form.Control type="text" value={item.standardDimensions || ''} readOnly /></Form.Group></Col>
                            </Row>
                          </div>
                        ))}
                      </div>
                      
                      <Button variant="outline-primary" size="sm" className="mt-3" onClick={handleAddProduct}>
                        + Thêm sản phẩm
                      </Button>

                      <Row className="mt-3">
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="mb-2 w-100">Ngày giao hàng mong muốn *</Form.Label>
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
                          {submitting ? <><Spinner size="sm" /> Đang tạo...</> : "Tạo Yêu Cầu"}
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

export default CreateRfqForCustomer;
