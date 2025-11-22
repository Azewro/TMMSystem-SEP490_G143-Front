import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';

import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { productService } from '../../api/productService';
import { customerService } from '../../api/customerService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { rfqService } from '../../api/rfqService';
import { isVietnamesePhoneNumber } from '../../utils/validators';
import addressService from '../../api/addressService';
import '../../styles/QuoteRequest.css';

registerLocale('vi', vi);

const getMinExpectedDeliveryDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 30);
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
    contactMethod: 'Điện thoại',
    expectedDeliveryDate: null,
    notes: '',
  });

  // State for 2-level address
  const [provinces, setProvinces] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState({ provinces: true, communes: false });

  const [quoteItems, setQuoteItems] = useState([{ productId: '', quantity: '1', unit: 'cai', notes: '', standardDimensions: '' }]);
  const [isFromCart, setIsFromCart] = useState(false);
  const formRef = useRef({});
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setAddressLoading(prev => ({ ...prev, provinces: true }));
        const provinceData = await addressService.getProvinces();
        setProvinces(provinceData);
      } catch (error) {
        toast.error('Không thể tải danh sách Tỉnh/Thành phố.');
      } finally {
        setAddressLoading(prev => ({ ...prev, provinces: false }));
      }
    };
    fetchProvinces();
  }, []);

  // Fetch communes when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setCommunes([]);
      setSelectedCommune('');
      return;
    }
    const fetchCommunes = async () => {
      try {
        setAddressLoading(prev => ({ ...prev, communes: true }));
        const communeData = await addressService.getCommunes(selectedProvince);
        setCommunes(communeData);
        setSelectedCommune('');
      } catch (error) {
        toast.error('Không thể tải danh sách Xã/Phường.');
      } finally {
        setAddressLoading(prev => ({ ...prev, communes: false }));
      }
    };
    fetchCommunes();
  }, [selectedProvince]);

  // Memoize options for react-select to prevent re-computation
  const provinceOptions = useMemo(() =>
    provinces.map(p => ({ value: p.code, label: p.name })),
    [provinces]
  );

  const communeOptions = useMemo(() =>
    communes.map(c => ({ value: c.code, label: c.name })),
    [communes]
  );

  useEffect(() => {
    if (authLoading) {
      return; // Wait for authentication to finish loading
    }

    const initialize = async () => {
      setLoading(true);

      if (isAuthenticated && user?.customerId) {
        try {
          const customerData = await customerService.getCustomerById(user.customerId);
          formRef.current = {
            ...formRef.current,
            contactPerson: customerData.contactPerson || user.name || '',
            contactEmail: customerData.email || user.email || '',
            contactPhone: customerData.phoneNumber || '',
          };
        } catch (error) {
          console.error("Failed to fetch customer details:", error);
        }
      }

      if (location.state?.cartProducts?.length > 0) {
        const itemsFromCart = location.state.cartProducts.map(p => ({
          productId: p.id.toString(),
          quantity: p.quantity.toString() || '1',
          unit: 'cai',
          notes: '',
          standardDimensions: p.standardDimensions || '',
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
          notes: '',
          standardDimensions: standardDimensions || '',
          name
        }]);
        setIsFromCart(false);
      } else if (!isAuthenticated) {
        // This is safe now because authLoading is false.
        // Redirect if user is not authenticated and did not arrive via a specific flow.
        navigate('/');
        setLoading(false);
        return;
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
  }, [authLoading, isAuthenticated, user, location.state, navigate]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    formRef.current[name] = value;
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    formRef.current.expectedDeliveryDate = date;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...quoteItems];
    if (field === 'productId' && value) {
      const isDuplicate = newItems.some((item, idx) => idx !== index && item.productId === value);
      if (isDuplicate) {
        toast.error('Sản phẩm này đã được thêm vào danh sách.');
        return;
      }
      const selectedProduct = products.find(p => p.id === parseInt(value, 10));
      newItems[index].standardDimensions = selectedProduct?.standardDimensions || '';
    }
    newItems[index][field] = value;
    setQuoteItems(newItems);
  };

  const handleAddProduct = () => {
    const hasEmptyProduct = quoteItems.some(item => !item.productId);
    if (hasEmptyProduct) {
      toast.error('Vui lòng chọn sản phẩm cho dòng hiện tại trước khi thêm mới.');
      return;
    }
    setQuoteItems([...quoteItems, { productId: '', quantity: '1', unit: 'cai', notes: '', standardDimensions: '' }]);
  };

  const handleRemoveProduct = (index) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter((_, i) => i !== index));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    const currentData = formRef.current;
    if (!currentData.contactPerson?.trim()) newErrors.contactPerson = 'Họ và tên là bắt buộc.';
    if (!currentData.contactPhone?.trim()) {
      newErrors.contactPhone = 'Số điện thoại là bắt buộc.';
    } else if (!isVietnamesePhoneNumber(currentData.contactPhone)) {
      newErrors.contactPhone = 'Số điện thoại không hợp lệ.';
    }
    if (!currentData.contactEmail?.trim()) {
      newErrors.contactEmail = 'Email là bắt buộc.';
    } else if (!/\S+@\S+\.\S+/.test(currentData.contactEmail)) {
      newErrors.contactEmail = 'Email không hợp lệ.';
    }
    if (!selectedProvince || !selectedCommune || !detailedAddress.trim()) {
      newErrors.address = 'Vui lòng điền đầy đủ địa chỉ nhận hàng.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = { ...errors, items: Array(quoteItems.length).fill(null) };
    let isValid = true;
    quoteItems.forEach((item, index) => {
      const itemErrors = {};
      if (!item.productId) {
        itemErrors.product = 'Vui lòng chọn sản phẩm.';
        isValid = false;
      }
      if (parseInt(item.quantity, 10) < 100) {
        itemErrors.quantity = 'Số lượng tối thiểu là 100.';
        isValid = false;
      }
      if (Object.keys(itemErrors).length > 0) {
        newErrors.items[index] = itemErrors;
      }
    });
    if (!formRef.current.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Ngày giao hàng mong muốn là bắt buộc.';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) {
      toast.error('Vui lòng kiểm tra lại các thông tin bắt buộc ở các bước trước.');
      return;
    }
    setSubmitting(true);

    const provinceName = provinces.find(p => p.code == selectedProvince)?.name || '';
    const communeName = communes.find(c => c.code == selectedCommune)?.name || '';
    const fullAddress = `${detailedAddress}, ${communeName}, ${provinceName}`;

    const details = quoteItems.map(item => ({
      productId: parseInt(item.productId),
      quantity: parseInt(item.quantity),
      unit: item.unit,
      notes: item.notes,
    }));

    const currentData = formRef.current;
    const formattedDate = currentData.expectedDeliveryDate
      ? currentData.expectedDeliveryDate.toLocaleDateString('en-CA') // YYYY-MM-DD in local time
      : null;

    const contactMethodMap = { 'Điện thoại': 'PHONE', 'Email': 'EMAIL', 'Cả hai': 'PHONE' };
    const apiContactMethod = contactMethodMap[currentData.contactMethod] || 'PHONE';

    // Conditional status based on employeeCode. If code exists, status is SENT, otherwise DRAFT.
    const rfqStatus = currentData.employeeCode && currentData.employeeCode.trim() !== '' ? 'SENT' : 'DRAFT';

    const rfqData = {
      // Common fields for all users
      contactMethod: apiContactMethod,
      expectedDeliveryDate: formattedDate,
      notes: currentData.notes,
      details: details,
      status: rfqStatus,
      employeeCode: currentData.employeeCode || null,
      contactPerson: currentData.contactPerson,
      contactEmail: currentData.contactEmail,
      contactPhone: currentData.contactPhone,
      contactAddress: fullAddress,

      // Add customerId only if authenticated
      ...(isAuthenticated && { customerId: user.customerId }),
    };

    try {
      await rfqService.createRfq(rfqData, isAuthenticated);
      toast.success('Yêu cầu báo giá đã được gửi thành công!');
      if (isFromCart) clearCart();
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Gửi yêu cầu thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" /></div>;
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h5 className="mb-3">Bước 1: Thông Tin Liên Hệ</h5>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="contactPerson" defaultValue={formRef.current.contactPerson} onChange={handleFormChange} isInvalid={!!errors.contactPerson} /><Form.Control.Feedback type="invalid">{errors.contactPerson}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="contactPhone" defaultValue={formRef.current.contactPhone} onChange={handleFormChange} isInvalid={!!errors.contactPhone} /><Form.Control.Feedback type="invalid">{errors.contactPhone}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Email <span className="text-danger">*</span></Form.Label><Form.Control type="email" name="contactEmail" defaultValue={formRef.current.contactEmail} onChange={handleFormChange} isInvalid={!!errors.contactEmail} /><Form.Control.Feedback type="invalid">{errors.contactEmail}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Mã nhân viên Sale (nếu có)</Form.Label><Form.Control type="text" name="employeeCode" defaultValue={formRef.current.employeeCode} onChange={handleFormChange} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Phương thức liên hệ</Form.Label><Form.Select name="contactMethod" defaultValue={formRef.current.contactMethod} onChange={handleFormChange}><option>Điện thoại</option><option>Email</option><option>Cả hai</option></Form.Select></Form.Group></Col>
            </Row>

            <h5 className="mb-3 mt-3">Địa chỉ nhận hàng</h5>
            {errors.address && <Alert variant="danger" size="sm">{errors.address}</Alert>}
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label>Tỉnh/Thành phố <span className="text-danger">*</span></Form.Label>
                <Select options={provinceOptions} value={provinceOptions.find(option => option.value === selectedProvince)} onChange={option => setSelectedProvince(option ? option.value : '')} isLoading={addressLoading.provinces} placeholder={addressLoading.provinces ? 'Đang tải...' : 'Chọn Tỉnh/Thành phố'} isClearable isSearchable />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Xã/Phường <span className="text-danger">*</span></Form.Label>
                <Select options={communeOptions} value={communeOptions.find(option => option.value === selectedCommune)} onChange={option => setSelectedCommune(option ? option.value : '')} isDisabled={!selectedProvince || addressLoading.communes} isLoading={addressLoading.communes} placeholder={addressLoading.communes ? 'Đang tải...' : 'Chọn Xã/Phường'} isClearable isSearchable />
              </Col>
              <Col md={12} className="mb-3">
                <Form.Label>Số nhà, tên đường <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" defaultValue={detailedAddress} onChange={e => setDetailedAddress(e.target.value)} placeholder="Ví dụ: 123 Nguyễn Văn Cừ" />
              </Col>
            </Row>
          </>
        );
      case 2:
        return (
          <>
            <h5 className="mb-3">Bước 2: Chi Tiết Yêu Cầu</h5>
            <div className="border rounded p-3">
              {quoteItems.map((item, index) => {
                const selectedProduct = products.find(p => p.id === parseInt(item.productId, 10));
                const productName = selectedProduct?.name || item.name || 'Chưa chọn sản phẩm';
                return (
                  <div key={item.productId || index} className={index > 0 ? "mt-3 pt-3 border-top" : ""}>
                    <div className="d-flex justify-content-between align-items-center">
                      <h6>Sản phẩm: {isFromCart ? <span className="fw-normal text-muted ms-2">{productName}</span> : <Form.Select size="sm" value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} required className="ms-2 d-inline-block" style={{ width: 'auto', minWidth: '200px' }}><option value="">Chọn sản phẩm</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select>}</h6>
                      {!isFromCart && quoteItems.length > 1 && <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveProduct(index)}>Xóa</Button>}
                    </div>
                    <Row className="align-items-end mt-2">
                      <Col md={6}><Form.Group><Form.Label>Số lượng <span className="text-danger">*</span></Form.Label><Form.Control type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="1" required isInvalid={!!errors.items?.[index]?.quantity} /><Form.Control.Feedback type="invalid">{errors.items?.[index]?.quantity}</Form.Control.Feedback></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label>Kích thước</Form.Label><div className="form-control-plaintext border rounded px-3 py-2 bg-light" style={{ pointerEvents: 'none', userSelect: 'none' }}>{item.standardDimensions || 'N/A'}</div></Form.Group></Col>
                    </Row>
                  </div>
                );
              })}
            </div>
            {!isFromCart && <Button variant="outline-primary" size="sm" className="mt-3" onClick={handleAddProduct}>+ Thêm sản phẩm</Button>}
            <Row className="mt-3">
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="mb-2 w-100">Ngày giao hàng mong muốn <span className="text-danger">*</span></Form.Label><DatePicker selected={selectedDate} onChange={handleDateChange} dateFormat="dd/MM/yyyy" minDate={getMinExpectedDeliveryDate()} className={`form-control ${!!errors.expectedDeliveryDate ? 'is-invalid' : ''}`} placeholderText="Chọn ngày" locale="vi" /><Form.Text muted className="w-100 d-block">Lưu ý: Ngày giao hàng phải sau ngày hiện tại ít nhất 30 ngày.</Form.Text></Form.Group></Col>
              <Col md={12}><Form.Group className="mb-3"><Form.Label>Ghi chú chung</Form.Label><Form.Control as="textarea" rows={3} name="notes" defaultValue={formRef.current.notes} onChange={handleFormChange} placeholder="Yêu cầu đặc biệt cho toàn bộ đơn hàng..." /></Form.Group></Col>
            </Row>
          </>
        );
      case 3:
        return (
          <>
            <h5 className="mb-3">Bước 3: Xem Lại Yêu Cầu</h5>
            <Card bg="light" className="p-3">
              <h6>Thông tin liên hệ</h6>
              <p className="mb-1"><strong>Họ tên:</strong> {formRef.current.contactPerson}</p>
              <p className="mb-1"><strong>SĐT:</strong> {formRef.current.contactPhone}</p>
              <p className="mb-1"><strong>Email:</strong> {formRef.current.contactEmail}</p>
              <p className="mb-1"><strong>Địa chỉ nhận hàng:</strong> {`${detailedAddress}, ${communes.find(c => c.code == selectedCommune)?.name || ''}, ${provinces.find(p => p.code == selectedProvince)?.name || ''}`}</p>
              <hr />
              <h6>Chi tiết sản phẩm</h6>
              <ul className="list-unstyled">
                {quoteItems.map((item, index) => {
                  const product = products.find(p => p.id === parseInt(item.productId));
                  return <li key={index} className="mb-2"><strong>{product?.name || 'Sản phẩm đã chọn'}:</strong> {item.quantity} cái</li>;
                })}
              </ul>
              <p><strong>Ngày giao mong muốn:</strong> {formRef.current.expectedDeliveryDate ? formRef.current.expectedDeliveryDate.toLocaleDateString('vi-VN') : 'Chưa chọn'}</p>
              <p><strong>Ghi chú:</strong> {formRef.current.notes || 'Không có'}</p>
            </Card>
          </>
        );
      default:
        return null;
    }
  };

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
                      <p className="text-muted">Hoàn thành các bước sau để gửi yêu cầu cho chúng tôi</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="d-flex justify-content-between mb-4">
                      <div className={`step-item ${step >= 1 ? 'active' : ''}`}>Bước 1: Liên hệ</div>
                      <div className={`step-item ${step >= 2 ? 'active' : ''}`}>Bước 2: Sản phẩm</div>
                      <div className={`step-item ${step >= 3 ? 'active' : ''}`}>Bước 3: Gửi đi</div>
                    </div>

                    <Form onSubmit={handleSubmit} noValidate>
                      {renderStepContent()}
                      <div className="d-flex justify-content-between mt-4">
                        <div>
                          {step > 1 && <Button variant="secondary" onClick={handleBack}>Quay lại</Button>}
                        </div>
                        <div>
                          {step < 3 && <Button variant="primary" onClick={handleNext}>Tiếp theo</Button>}
                          {step === 3 &&
                            <Button variant="success" type="submit" disabled={submitting}>
                              {submitting ? <><Spinner size="sm" /> Gửi Yêu Cầu...</> : "Xác Nhận và Gửi Yêu Cầu"}
                            </Button>
                          }
                        </div>
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