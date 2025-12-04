import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';

import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productService } from '../../api/productService';
import { useAuth } from '../../context/AuthContext';
import { rfqService } from '../../api/rfqService';
import { isVietnamesePhoneNumber, validateQuantity } from '../../utils/validators';
import addressService from '../../api/addressService';
import { userService } from '../../api/userService';
import '../../styles/QuoteRequest.css';

registerLocale('vi', vi);

const getMinExpectedDeliveryDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 30);
  today.setHours(0, 0, 0, 0);
  return today;
};

const CreateRfqForCustomer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

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

  const [provinces, setProvinces] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [detailedAddress, setDetailedAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState({ provinces: false, communes: false });

  const [quoteItems, setQuoteItems] = useState([{ productId: '', quantity: '100', unit: 'cai', notes: '', standardDimensions: '' }]);
  const [step, setStep] = useState(1);

  useEffect(() => {
    addressService.getProvinces().then(setProvinces).catch(() => toast.error('Không thể tải danh sách Tỉnh/Thành phố.'));
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      setCommunes([]);
      setSelectedCommune(null);
      setAddressLoading(prev => ({ ...prev, communes: true }));
      addressService.getCommunes(selectedProvince.value).then(setCommunes).finally(() => setAddressLoading(prev => ({ ...prev, communes: false })));
    } else {
      setCommunes([]);
      setSelectedCommune(null);
    }
  }, [selectedProvince]);

  const provinceOptions = useMemo(() => provinces.map(p => ({ value: p.code, label: p.name })), [provinces]);
  const communeOptions = useMemo(() => communes.map(c => ({ value: c.code, label: c.name })), [communes]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng chức năng này.");
      navigate('/internal-login');
      return;
    }

    const initialize = async () => {
      setLoading(true);
      if (user?.employeeCode && user.employeeCode !== 'undefined' && user.employeeCode !== 'null') {
        setFormData(prev => ({ ...prev, employeeCode: user.employeeCode }));
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
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, expectedDeliveryDate: date }));
    if (errors.expectedDeliveryDate) setErrors(prev => ({ ...prev, expectedDeliveryDate: null }));
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
    // Allow free input for quantity - validation will be done with regex
    newItems[index][field] = value;
    setQuoteItems(newItems);
    
    // Clear error for this field when user starts typing
    if (errors.items?.[index]?.[field]) {
      const newErrors = { ...errors };
      if (newErrors.items?.[index]) {
        const itemErrors = { ...newErrors.items[index] };
        delete itemErrors[field];
        if (Object.keys(itemErrors).length === 0) {
          newErrors.items[index] = null;
        } else {
          newErrors.items[index] = itemErrors;
        }
      }
      setErrors(newErrors);
    }
  };

  const handleQuantityBlur = (index) => {
    const item = quoteItems[index];
    const quantityStr = item.quantity ? item.quantity.toString() : '';
    const quantityValidation = validateQuantity(quantityStr);
    
    if (!quantityValidation.isValid) {
      const newErrors = { ...errors };
      if (!newErrors.items) {
        newErrors.items = Array(quoteItems.length).fill(null);
      }
      if (!newErrors.items[index]) {
        newErrors.items[index] = {};
      }
      newErrors.items[index].quantity = quantityValidation.error;
      setErrors(newErrors);
    }
  };

  const handleAddProduct = () => {
    setQuoteItems([...quoteItems, { productId: '', quantity: '100', unit: 'cai', notes: '', standardDimensions: '' }]);
  };

  const handleRemoveProduct = (index) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter((_, i) => i !== index));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.contactPerson?.trim()) newErrors.contactPerson = 'Họ và tên là bắt buộc.';
    if (!formData.contactPhone?.trim()) {
      newErrors.contactPhone = 'Số điện thoại là bắt buộc.';
    } else if (!isVietnamesePhoneNumber(formData.contactPhone)) {
      newErrors.contactPhone = 'Số điện thoại không hợp lệ.';
    }
    if (!formData.contactEmail?.trim()) {
      newErrors.contactEmail = 'Email là bắt buộc.';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Email không hợp lệ.';
    }
    if (!selectedProvince || !selectedCommune || !detailedAddress.trim()) {
      newErrors.address = 'Vui lòng điền đầy đủ địa chỉ nhận hàng.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = { ...errors };
    let isValid = true;
    const itemErrors = quoteItems.map(item => {
      const itemError = {};
      if (!item.productId) {
        isValid = false;
        itemError.product = 'Vui lòng chọn sản phẩm.';
      }
      // Validate quantity using regex
      const quantityStr = item.quantity ? item.quantity.toString() : '';
      const quantityValidation = validateQuantity(quantityStr);
      if (!quantityValidation.isValid) {
        isValid = false;
        itemError.quantity = quantityValidation.error;
      }
      return Object.keys(itemError).length > 0 ? itemError : null;
    });

    if (itemErrors.some(e => e !== null)) {
      newErrors.items = itemErrors;
    }

    if (!formData.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Ngày giao hàng mong muốn là bắt buộc.';
      isValid = false;
    } else {
      const minDate = getMinExpectedDeliveryDate();
      if (formData.expectedDeliveryDate < minDate) {
        newErrors.expectedDeliveryDate = `Ngày giao hàng phải ít nhất 30 ngày kể từ hôm nay.`;
        isValid = false;
      }
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
      else toast.error('Vui lòng điền đầy đủ thông tin khách hàng và địa chỉ.');
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
      else toast.error('Vui lòng điền đầy đủ thông tin sản phẩm.');
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

    const fullAddress = `${detailedAddress}, ${selectedCommune?.label}, ${selectedProvince?.label}`;
    const details = quoteItems.map(item => ({
      productId: parseInt(item.productId),
      quantity: parseInt(item.quantity.toString().trim(), 10),
      unit: item.unit,
      notes: item.notes,
    }));

    const contactMethodMap = { 'Điện thoại': 'PHONE', 'Email': 'EMAIL', 'Cả hai': 'PHONE' };
    const apiContactMethod = contactMethodMap[formData.contactMethod] || 'PHONE';

    const rfqData = {
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      contactAddress: fullAddress,
      contactMethod: apiContactMethod,
      expectedDeliveryDate: formData.expectedDeliveryDate.toLocaleDateString('en-CA'), // YYYY-MM-DD in local time
      notes: formData.notes,
      details: details,
      employeeCode: formData.employeeCode || null,
      status: formData.employeeCode ? 'SENT' : 'DRAFT', // Only auto-send if employee code is provided
    };

    try {
      await rfqService.createRfqBySales(rfqData);
      toast.success('Yêu cầu báo giá đã được tạo thành công!');
      navigate('/sales/rfqs');
    } catch (err) {
      toast.error(err.message || 'Gửi yêu cầu thất bại.');
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
            <h5 className="mb-3">Bước 1: Thông Tin Khách Hàng</h5>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="contactPerson" value={formData.contactPerson} onChange={handleFormChange} isInvalid={!!errors.contactPerson} /><Form.Control.Feedback type="invalid">{errors.contactPerson}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="contactPhone" value={formData.contactPhone} onChange={handleFormChange} isInvalid={!!errors.contactPhone} /><Form.Control.Feedback type="invalid">{errors.contactPhone}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Email <span className="text-danger">*</span></Form.Label><Form.Control type="email" name="contactEmail" value={formData.contactEmail} onChange={handleFormChange} isInvalid={!!errors.contactEmail} /><Form.Control.Feedback type="invalid">{errors.contactEmail}</Form.Control.Feedback></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Mã nhân viên Sale (của bạn)</Form.Label><InputGroup><Form.Control type="text" name="employeeCode" value={formData.employeeCode} onChange={handleFormChange} /><Button variant="outline-secondary" onClick={async () => {
                const isValidCode = (code) => code && code !== 'undefined' && code !== 'null';
                const isValidId = (id) => id && id !== 'undefined' && id !== 'null';

                if (isValidCode(user?.employeeCode)) {
                  setFormData(prev => ({ ...prev, employeeCode: user.employeeCode }));
                  toast.success('Đã điền mã nhân viên của bạn.');
                } else if (isValidId(user?.userId)) {
                  try {
                    const userDetails = await userService.getUserById(user.userId);
                    if (isValidCode(userDetails?.employeeCode)) {
                      setFormData(prev => ({ ...prev, employeeCode: userDetails.employeeCode }));
                      toast.success('Đã điền mã nhân viên của bạn.');
                    } else {
                      toast.error('Không tìm thấy mã nhân viên trong hồ sơ của bạn.');
                    }
                  } catch (error) {
                    console.error('Error fetching user details:', error);
                    toast.error('Không thể lấy thông tin nhân viên. Vui lòng tự nhập.');
                  }
                } else {
                  toast.error('Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.');
                }
              }}>Dùng mã của tôi</Button></InputGroup></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Phương thức liên hệ</Form.Label><Form.Select name="contactMethod" value={formData.contactMethod} onChange={handleFormChange}><option>Điện thoại</option><option>Email</option><option>Cả hai</option></Form.Select></Form.Group></Col>
            </Row>
            <h5 className="mb-3 mt-3">Địa chỉ nhận hàng</h5>
            {errors.address && <Alert variant="danger" size="sm">{errors.address}</Alert>}
            <Row>
              <Col md={6} className="mb-3"><Form.Label>Tỉnh/Thành phố <span className="text-danger">*</span></Form.Label><Select options={provinceOptions} value={selectedProvince} onChange={setSelectedProvince} isLoading={addressLoading.provinces} placeholder="Chọn Tỉnh/Thành phố" isClearable isSearchable /></Col>
              <Col md={6} className="mb-3"><Form.Label>Xã/Phường <span className="text-danger">*</span></Form.Label><Select options={communeOptions} value={selectedCommune} onChange={setSelectedCommune} isDisabled={!selectedProvince || addressLoading.communes} isLoading={addressLoading.communes} placeholder="Chọn Xã/Phường" isClearable isSearchable /></Col>
              <Col md={12} className="mb-3"><Form.Label>Số nhà, tên đường <span className="text-danger">*</span></Form.Label><Form.Control type="text" value={detailedAddress} onChange={e => setDetailedAddress(e.target.value)} isInvalid={!!errors.address} placeholder="Ví dụ: 123 Nguyễn Văn Cừ" /><Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback></Col>
            </Row>
          </>
        );
      case 2:
        return (
          <>
            <h5 className="mb-3">Bước 2: Chi Tiết Yêu Cầu</h5>
            <div className="border rounded p-3">
              {quoteItems.map((item, index) => (
                <div key={index} className={index > 0 ? "mt-3 pt-3 border-top" : ""}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h6>Sản phẩm: <Form.Select size="sm" value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} isInvalid={errors.items?.[index]?.product} className="ms-2 d-inline-block" style={{ width: 'auto', minWidth: '200px' }}><option value="">Chọn sản phẩm</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Form.Select></h6>
                    {quoteItems.length > 1 && <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveProduct(index)}>Xóa</Button>}
                  </div>
                  <Row className="align-items-end mt-2">
                    <Col md={6}><Form.Group><Form.Label>Số lượng <span className="text-danger">*</span></Form.Label><Form.Control type="text" inputMode="numeric" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} onBlur={() => handleQuantityBlur(index)} isInvalid={errors.items?.[index]?.quantity} placeholder="Tối thiểu 100" /><Form.Control.Feedback type="invalid">{errors.items?.[index]?.quantity}</Form.Control.Feedback></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label>Kích thước</Form.Label><div className="form-control-plaintext border rounded px-3 py-2 bg-light" style={{ pointerEvents: 'none', userSelect: 'none' }}>{item.standardDimensions || 'N/A'}</div></Form.Group></Col>
                  </Row>
                </div>
              ))}
            </div>
            <Button variant="outline-primary" size="sm" className="mt-3" onClick={handleAddProduct}>+ Thêm sản phẩm</Button>
            <Row className="mt-3">
              <Col md={6}><Form.Group className="mb-3"><Form.Label className="mb-2 w-100">Ngày giao hàng mong muốn <span className="text-danger">*</span></Form.Label><DatePicker selected={formData.expectedDeliveryDate} onChange={handleDateChange} dateFormat="dd/MM/yyyy" minDate={getMinExpectedDeliveryDate()} className={`form-control ${errors.expectedDeliveryDate ? 'is-invalid' : ''}`} placeholderText="Chọn ngày" locale="vi" /><Form.Text muted className="w-100 d-block">Lưu ý: Ngày giao hàng phải sau ngày hiện tại ít nhất 30 ngày.</Form.Text><Form.Control.Feedback type="invalid" className="d-block">{errors.expectedDeliveryDate}</Form.Control.Feedback></Form.Group></Col>
              <Col md={12}><Form.Group className="mb-3"><Form.Label>Ghi chú chung</Form.Label><Form.Control as="textarea" rows={3} name="notes" value={formData.notes} onChange={handleFormChange} placeholder="Yêu cầu đặc biệt cho toàn bộ đơn hàng..." /></Form.Group></Col>
            </Row>
          </>
        );
      case 3:
        return (
          <>
            <h5 className="mb-3">Bước 3: Xem Lại Yêu Cầu</h5>
            <Card bg="light" className="p-3">
              <h6>Thông tin liên hệ</h6>
              <p className="mb-1"><strong>Họ tên:</strong> {formData.contactPerson}</p>
              <p className="mb-1"><strong>SĐT:</strong> {formData.contactPhone}</p>
              <p className="mb-1"><strong>Email:</strong> {formData.contactEmail}</p>
              <p className="mb-1"><strong>Địa chỉ nhận hàng:</strong> {`${detailedAddress}, ${selectedCommune?.label}, ${selectedProvince?.label}`}</p>
              <hr />
              <h6>Chi tiết sản phẩm</h6>
              <ul className="list-unstyled">
                {quoteItems.map((item, index) => {
                  const product = products.find(p => p.id === parseInt(item.productId));
                  return <li key={index} className="mb-2"><strong>{product?.name || 'Sản phẩm đã chọn'}:</strong> {item.quantity} cái</li>;
                })}
              </ul>
              <p><strong>Ngày giao mong muốn:</strong> {formData.expectedDeliveryDate ? formData.expectedDeliveryDate.toLocaleDateString('vi-VN') : 'Chưa chọn'}</p>
              <p><strong>Ghi chú:</strong> {formData.notes || 'Không có'}</p>
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
        <InternalSidebar userRole="sales" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container>
            <Row className="justify-content-center">
              <Col lg={10} xl={8}>
                <Card className="shadow-sm">
                  <Card.Body className="p-4">
                    <div className="text-center mb-4">
                      <h2 className="fw-bold">Tạo Yêu Cầu Báo Giá (Hộ Khách Hàng)</h2>
                      <p className="text-muted">Hoàn thành các bước sau để gửi yêu cầu cho chúng tôi</p>
                    </div>

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

export default CreateRfqForCustomer;
