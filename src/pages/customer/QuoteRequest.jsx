import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
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
import addressService from '../../api/addressService'; // Import new service
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
    contactMethod: 'Điện thoại',
    expectedDeliveryDate: null,
    notes: '',
  });

  // New state for structured address
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState({ provinces: true, districts: false, wards: false });
  
  const [quoteItems, setQuoteItems] = useState([{ productId: '', quantity: '1', unit: 'cai', notes: '', standardDimensions: '' }]);
  const [isFromCart, setIsFromCart] = useState(false);

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

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setWards([]);
      setSelectedDistrict('');
      setSelectedWard('');
      return;
    }
    const fetchDistricts = async () => {
      try {
        setAddressLoading(prev => ({ ...prev, districts: true }));
        const districtData = await addressService.getDistricts(selectedProvince);
        setDistricts(districtData);
        setWards([]);
        setSelectedDistrict('');
        setSelectedWard('');
      } catch (error) {
        toast.error('Không thể tải danh sách Quận/Huyện.');
      } finally {
        setAddressLoading(prev => ({ ...prev, districts: false }));
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard('');
      return;
    }
    const fetchWards = async () => {
      try {
        setAddressLoading(prev => ({ ...prev, wards: true }));
        const wardData = await addressService.getWards(selectedDistrict);
        setWards(wardData);
        setSelectedWard('');
      } catch (error) {
        toast.error('Không thể tải danh sách Phường/Xã.');
      } finally {
        setAddressLoading(prev => ({ ...prev, wards: false }));
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      
      if (!isAuthenticated) {
        setFormData({
          contactPerson: '',
          contactPhone: '',
          contactEmail: '',
          employeeCode: '',
          contactMethod: 'Điện thoại',
          expectedDeliveryDate: null,
          notes: '',
        });
        setQuoteItems([{ productId: '', quantity: '1', unit: 'cai', notes: '', standardDimensions: '' }]);
        setIsFromCart(false);
        setErrors({});
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
          }));
          // Note: We don't pre-fill address dropdowns from a single string
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
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, expectedDeliveryDate: date }));
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

  const validate = () => {
    const newErrors = {};
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Họ và tên là bắt buộc.';
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Số điện thoại là bắt buộc.';
    } else if (!/^0\d{9,10}$/.test(formData.contactPhone.trim())) {
      newErrors.contactPhone = 'Số điện thoại không hợp lệ. Phải có 10-11 chữ số và bắt đầu bằng 0.';
    }
    if (!formData.contactEmail.trim()) {
        newErrors.contactEmail = 'Email là bắt buộc.';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
        newErrors.contactEmail = 'Email không hợp lệ.';
    }
    if (!selectedProvince) newErrors.address = 'Vui lòng chọn Tỉnh/Thành phố.';
    if (!selectedDistrict) newErrors.address = 'Vui lòng chọn Quận/Huyện.';
    if (!selectedWard) newErrors.address = 'Vui lòng chọn Phường/Xã.';
    if (!detailedAddress.trim()) newErrors.address = 'Vui lòng nhập địa chỉ chi tiết (số nhà, đường).';
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
      toast.error(Object.values(validationErrors)[0]); // Show first error
      return;
    }
    setSubmitting(true);

    const provinceName = provinces.find(p => p.code == selectedProvince)?.name || '';
    const districtName = districts.find(d => d.code == selectedDistrict)?.name || '';
    const wardName = wards.find(w => w.code == selectedWard)?.name || '';
    const fullAddress = `${detailedAddress}, ${wardName}, ${districtName}, ${provinceName}`;

    const details = quoteItems.map(item => ({
      productId: parseInt(item.productId),
      quantity: parseInt(item.quantity),
      unit: item.unit,
      notes: item.notes,
    }));

    const formattedDate = formData.expectedDeliveryDate 
      ? formData.expectedDeliveryDate.toISOString().split('T')[0] 
      : null;

    const contactMethodMap = { 'Điện thoại': 'PHONE', 'Email': 'EMAIL', 'Cả hai': 'PHONE' };
    const apiContactMethod = contactMethodMap[formData.contactMethod] || 'PHONE';

    const rfqData = {
      contactMethod: apiContactMethod,
      expectedDeliveryDate: formattedDate,
      notes: formData.notes,
      details: details,
      status: 'DRAFT',
      ...(isAuthenticated ? { customerId: user.customerId, contactAddress: fullAddress } : {
        contactPerson: formData.contactPerson,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        contactAddress: fullAddress,
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
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="contactPerson" value={formData.contactPerson} onChange={handleFormChange} isInvalid={!!errors.contactPerson} /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="contactPhone" value={formData.contactPhone} onChange={handleFormChange} isInvalid={!!errors.contactPhone} /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Email <span className="text-danger">*</span></Form.Label><Form.Control type="email" name="contactEmail" value={formData.contactEmail} onChange={handleFormChange} isInvalid={!!errors.contactEmail} /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Mã nhân viên Sale (nếu có)</Form.Label><Form.Control type="text" name="employeeCode" value={formData.employeeCode} onChange={handleFormChange} /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Phương thức liên hệ</Form.Label><Form.Select name="contactMethod" value={formData.contactMethod} onChange={handleFormChange}><option>Điện thoại</option><option>Email</option><option>Cả hai</option></Form.Select></Form.Group></Col>
                      </Row>
                      
                      <h5 className="mb-3 mt-3">Địa chỉ nhận hàng</h5>
                      {errors.address && <Alert variant="danger" size="sm">{errors.address}</Alert>}
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Label>Tỉnh/Thành phố <span className="text-danger">*</span></Form.Label>
                          <Form.Select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)} disabled={addressLoading.provinces}>
                            <option value="">{addressLoading.provinces ? 'Đang tải...' : 'Chọn Tỉnh/Thành phố'}</option>
                            {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                          </Form.Select>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label>Quận/Huyện <span className="text-danger">*</span></Form.Label>
                          <Form.Select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} disabled={!selectedProvince || addressLoading.districts}>
                            <option value="">{addressLoading.districts ? 'Đang tải...' : 'Chọn Quận/Huyện'}</option>
                            {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                          </Form.Select>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label>Phường/Xã <span className="text-danger">*</span></Form.Label>
                          <Form.Select value={selectedWard} onChange={e => setSelectedWard(e.target.value)} disabled={!selectedDistrict || addressLoading.wards}>
                            <option value="">{addressLoading.wards ? 'Đang tải...' : 'Chọn Phường/Xã'}</option>
                            {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                          </Form.Select>
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label>Số nhà, tên đường <span className="text-danger">*</span></Form.Label>
                          <Form.Control type="text" value={detailedAddress} onChange={e => setDetailedAddress(e.target.value)} placeholder="Ví dụ: 123 Nguyễn Văn Cừ" />
                        </Col>
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
                                    <Form.Select size="sm" value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)} required className="ms-2 d-inline-block" style={{ width: 'auto', minWidth: '200px' }}>
                                      <option value="">Chọn sản phẩm</option>
                                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </Form.Select>
                                  )}
                                </h6>
                                {!isFromCart && quoteItems.length > 1 && (
                                  <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveProduct(index)}>Xóa</Button>
                                )}
                              </div>
                              <Row className="align-items-end mt-2">
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Số lượng <span className="text-danger">*</span></Form.Label>
                                    {isAuthenticated ? (
                                      <div className="form-control-plaintext border rounded px-3 py-2 bg-light" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                                        {item.quantity}
                                      </div>
                                    ) : (
                                      <Form.Control type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="1" required />
                                    )}
                                  </Form.Group>
                                </Col>
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Kích thước</Form.Label>
                                    <div className="form-control-plaintext border rounded px-3 py-2 bg-light" style={{ pointerEvents: 'none', userSelect: 'none' }}>
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
                        <Button variant="outline-primary" size="sm" className="mt-3" onClick={handleAddProduct}>+ Thêm sản phẩm</Button>
                      )}

                      <Row className="mt-3">
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="mb-2 w-100">Ngày giao hàng mong muốn <span className="text-danger">*</span></Form.Label>
                            <DatePicker selected={formData.expectedDeliveryDate} onChange={handleDateChange} dateFormat="dd/MM/yyyy" minDate={getMinExpectedDeliveryDate()} className="form-control" placeholderText="Chọn ngày" locale="vi" />
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
