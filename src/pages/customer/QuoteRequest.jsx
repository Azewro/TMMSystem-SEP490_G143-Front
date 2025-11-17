import React, { useState, useEffect, useMemo } from 'react';
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
    const newErrors = { items: Array(quoteItems.length).fill(null) };

    // Validate contact person
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Họ và tên là bắt buộc.';
    } else if (formData.contactPerson.trim().length < 2) {
      newErrors.contactPerson = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    // Validate phone number
    const phoneTrimmed = formData.contactPhone.trim();
    if (!phoneTrimmed) {
      newErrors.contactPhone = 'Số điện thoại là bắt buộc.';
    } else if (!isVietnamesePhoneNumber(formData.contactPhone)) {
      newErrors.contactPhone = 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.';
    }

    // Validate email
    const emailTrimmed = formData.contactEmail.trim();
    if (!emailTrimmed) {
      newErrors.contactEmail = 'Email là bắt buộc.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        if (!emailTrimmed.includes('@')) {
          newErrors.contactEmail = 'Email phải chứa ký tự @.';
        } else if (!emailTrimmed.includes('.')) {
          newErrors.contactEmail = 'Email phải chứa dấu chấm (.) sau ký tự @.';
        } else if (emailTrimmed.split('@').length !== 2) {
          newErrors.contactEmail = 'Email chỉ được chứa một ký tự @.';
        } else {
          newErrors.contactEmail = 'Email không hợp lệ. Vui lòng nhập đúng định dạng email (ví dụ: example@email.com).';
        }
      }
    }

    // Validate address
    if (!selectedProvince) {
      newErrors.address = 'Vui lòng chọn Tỉnh/Thành phố.';
    } else if (!selectedCommune) {
      newErrors.address = 'Vui lòng chọn Xã/Phường.';
    } else if (!detailedAddress.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường).';
    } else if (detailedAddress.trim().length < 5) {
      newErrors.address = 'Địa chỉ chi tiết phải có ít nhất 5 ký tự.';
    }

    // Validate expected delivery date
    if (!formData.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Ngày giao hàng mong muốn là bắt buộc.';
    } else {
      const minDate = getMinExpectedDeliveryDate();
      if (formData.expectedDeliveryDate < minDate) {
        newErrors.expectedDeliveryDate = `Ngày giao hàng phải sau ngày hiện tại ít nhất 30 ngày. Ngày sớm nhất có thể chọn là ${minDate.toLocaleDateString('vi-VN')}.`;
      }
    }

    // Item specific validation
    quoteItems.forEach((item, index) => {
      const itemErrors = {};
      if (!item.productId) {
        itemErrors.product = 'Vui lòng chọn sản phẩm.';
      }
      if (!item.quantity || item.quantity.trim() === '') {
        itemErrors.quantity = 'Số lượng là bắt buộc.';
      } else {
        const quantityNum = parseInt(item.quantity, 10);
        if (isNaN(quantityNum)) {
          itemErrors.quantity = 'Số lượng phải là một số hợp lệ.';
        } else if (quantityNum < 1) {
          itemErrors.quantity = 'Số lượng phải lớn hơn 0.';
        } else if (quantityNum < 100) {
          itemErrors.quantity = 'Số lượng tối thiểu là 100.';
        }
      }
      if (Object.keys(itemErrors).length > 0) {
        newErrors.items[index] = itemErrors;
      }
    });

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    
    const hasGeneralError = ['contactPerson', 'contactPhone', 'contactEmail', 'address', 'expectedDeliveryDate'].some(key => validationErrors[key]);
    const hasItemError = validationErrors.items.some(item => item !== null);

    if (hasGeneralError || hasItemError) {
      toast.error('Vui lòng kiểm tra lại các thông tin bắt buộc.');
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
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                              type="text" 
                              name="contactPerson" 
                              value={formData.contactPerson} 
                              onChange={handleFormChange} 
                              isInvalid={!!errors.contactPerson}
                              placeholder="Nhập họ và tên đầy đủ"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.contactPerson}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                              type="text" 
                              name="contactPhone" 
                              value={formData.contactPhone} 
                              onChange={handleFormChange} 
                              isInvalid={!!errors.contactPhone}
                              placeholder="Ví dụ: 0912345678"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.contactPhone}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                              Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                            <Form.Control 
                              type="email" 
                              name="contactEmail" 
                              value={formData.contactEmail} 
                              onChange={handleFormChange} 
                              isInvalid={!!errors.contactEmail}
                              placeholder="Ví dụ: example@email.com"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.contactEmail}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Mã nhân viên Sale (nếu có)</Form.Label>
                            <Form.Control 
                              type="text" 
                              name="employeeCode" 
                              value={formData.employeeCode} 
                              onChange={handleFormChange}
                              placeholder="Nhập mã nhân viên (nếu có)"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phương thức liên hệ</Form.Label>
                            <Form.Select name="contactMethod" value={formData.contactMethod} onChange={handleFormChange}>
                              <option>Điện thoại</option>
                              <option>Email</option>
                              <option>Cả hai</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <h5 className="mb-3 mt-3">Địa chỉ nhận hàng</h5>
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Label>Tỉnh/Thành phố <span className="text-danger">*</span></Form.Label>
                          <Select
                            options={provinceOptions}
                            value={provinceOptions.find(option => option.value === selectedProvince)}
                            onChange={option => {
                              setSelectedProvince(option ? option.value : '');
                              if (errors.address) {
                                setErrors(prev => ({ ...prev, address: null }));
                              }
                            }}
                            isLoading={addressLoading.provinces}
                            placeholder={addressLoading.provinces ? 'Đang tải...' : 'Chọn Tỉnh/Thành phố'}
                            isClearable
                            isSearchable
                          />
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label>Xã/Phường <span className="text-danger">*</span></Form.Label>
                          <Select
                            options={communeOptions}
                            value={communeOptions.find(option => option.value === selectedCommune)}
                            onChange={option => {
                              setSelectedCommune(option ? option.value : '');
                              if (errors.address) {
                                setErrors(prev => ({ ...prev, address: null }));
                              }
                            }}
                            isDisabled={!selectedProvince || addressLoading.communes}
                            isLoading={addressLoading.communes}
                            placeholder={addressLoading.communes ? 'Đang tải...' : 'Chọn Xã/Phường'}
                            isClearable
                            isSearchable
                          />
                        </Col>
                        <Col md={12} className="mb-3">
                          <Form.Label>Số nhà, tên đường <span className="text-danger">*</span></Form.Label>
                          <Form.Control 
                            type="text" 
                            value={detailedAddress} 
                            onChange={e => {
                              setDetailedAddress(e.target.value);
                              if (errors.address) {
                                setErrors(prev => ({ ...prev, address: null }));
                              }
                            }}
                            isInvalid={!!errors.address}
                            placeholder="Ví dụ: 123 Nguyễn Văn Cừ"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.address}
                          </Form.Control.Feedback>
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
                                <div className="flex-grow-1">
                                  <h6>
                                    Sản phẩm: {isFromCart ? (
                                      <span className="fw-normal text-muted ms-2">{productName}</span>
                                    ) : (
                                      <>
                                        <Form.Select 
                                          size="sm" 
                                          value={item.productId} 
                                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)} 
                                          required 
                                          className={`ms-2 d-inline-block ${errors.items?.[index]?.product ? 'is-invalid' : ''}`}
                                          style={{ width: 'auto', minWidth: '200px' }}
                                        >
                                          <option value="">Chọn sản phẩm</option>
                                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </Form.Select>
                                        {errors.items?.[index]?.product && (
                                          <div className="invalid-feedback d-block ms-2">
                                            {errors.items[index].product}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </h6>
                                </div>
                                {!isFromCart && quoteItems.length > 1 && (
                                  <Button variant="link" className="text-danger p-0" onClick={() => handleRemoveProduct(index)}>Xóa</Button>
                                )}
                              </div>
                              <Row className="align-items-end mt-2">
                                <Col md={6}>
                                  <Form.Group>
                                    <Form.Label>Số lượng <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                      min="1"
                                      required
                                      isInvalid={!!errors.items?.[index]?.quantity}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                      {errors.items?.[index]?.quantity}
                                    </Form.Control.Feedback>
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
                            <DatePicker 
                              selected={formData.expectedDeliveryDate} 
                              onChange={(date) => {
                                handleDateChange(date);
                                if (errors.expectedDeliveryDate) {
                                  setErrors(prev => ({ ...prev, expectedDeliveryDate: null }));
                                }
                              }} 
                              dateFormat="dd/MM/yyyy" 
                              minDate={getMinExpectedDeliveryDate()} 
                              className={`form-control ${errors.expectedDeliveryDate ? 'is-invalid' : ''}`}
                              placeholderText="Chọn ngày" 
                              locale="vi" 
                            />
                            {errors.expectedDeliveryDate && (
                              <div className="invalid-feedback d-block">
                                {errors.expectedDeliveryDate}
                              </div>
                            )}
                            <Form.Text className={`w-100 d-block ${errors.expectedDeliveryDate ? 'text-danger' : 'text-muted'}`}>
                              Lưu ý: Ngày giao hàng phải sau ngày hiện tại ít nhất 30 ngày.
                            </Form.Text>
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