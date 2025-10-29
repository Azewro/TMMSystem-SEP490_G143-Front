import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaPlus, FaTrash, FaPaperPlane, FaExclamationTriangle } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { productService } from '../../api/productService';
import { quoteService } from '../../api/quoteService';
import '../../styles/QuoteRequest.css';

const QuoteRequest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Data states
  const [products, setProducts] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Form state
  const [quoteItems, setQuoteItems] = useState([{
    productId: '',
    size: '',
    quantity: ''
  }]);
  const [deliveryDate, setDeliveryDate] = useState('');

  // Handle pre-selected product from navigation
  useEffect(() => {
    if (location.state?.preSelectedProduct) {
      const preSelected = location.state.preSelectedProduct;
      setQuoteItems([{
        productId: preSelected.id.toString(),
        size: preSelected.size || preSelected.dimensions || '',
        quantity: '1'
      }]);
    }
  }, [location.state]);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      
      try {
        console.log('Fetching products...');
        const productData = await productService.getAllProducts();
        console.log('Products fetched:', productData);
        
        if (!productData || !Array.isArray(productData)) {
          throw new Error('Định dạng dữ liệu sản phẩm không hợp lệ');
        }
        
        setProducts(productData);
        
        if (productData.length === 0) {
          setError('Hiện tại không có sản phẩm nào. Vui lòng liên hệ bộ phận kinh doanh.');
        }
        
      } catch (err) {
        console.error('Product fetch error:', err);
        setError(
          err.message === 'Network Error' 
            ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
            : err.message || 'Lỗi khi tải danh sách sản phẩm.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Validation function
  const validateForm = () => {
    const errors = {};
    
    // Check if we have at least one item
    if (quoteItems.length === 0) {
      errors.general = 'Vui lòng thêm ít nhất một sản phẩm';
      return errors;
    }
    
    // Validate each item
    quoteItems.forEach((item, index) => {
      if (!item.productId) {
        errors[`product_${index}`] = 'Vui lòng chọn sản phẩm';
      }
      if (!item.quantity || parseInt(item.quantity) <= 0) {
        errors[`quantity_${index}`] = 'Vui lòng nhập số lượng hợp lệ';
      }
    });
    
    // Validate delivery date
    if (!deliveryDate) {
      errors.deliveryDate = 'Vui lòng chọn ngày giao hàng';
    } else {
      const selectedDate = new Date(deliveryDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (selectedDate <= tomorrow) {
        errors.deliveryDate = 'Ngày giao hàng phải từ ngày mai trở đi';
      }
    }
    
    return errors;
  };

  const handleAddProduct = () => {
    setQuoteItems([...quoteItems, {
      productId: '',
      size: '',
      quantity: ''
    }]);
    // Clear validation errors for the form
    setValidationErrors({});
  };

  const handleRemoveProduct = (index) => {
    if (quoteItems.length > 1) {
      const newItems = quoteItems.filter((_, i) => i !== index);
      setQuoteItems(newItems);
      
      // Clean up validation errors for removed item
      const newErrors = { ...validationErrors };
      delete newErrors[`product_${index}`];
      delete newErrors[`quantity_${index}`];
      setValidationErrors(newErrors);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...quoteItems];
    newItems[index][field] = value;

    // If product changes, reset size
    if (field === 'productId') {
      newItems[index].size = '';
    }

    setQuoteItems(newItems);
    
    // Clear specific validation error
    if (validationErrors[`${field}_${index}`]) {
      const newErrors = { ...validationErrors };
      delete newErrors[`${field}_${index}`];
      setValidationErrors(newErrors);
    }
  };

  const getAvailableSizes = (productId) => {
    if (!productId) return [];

    const selectedProduct = products.find(p => p.id.toString() === productId);
    if (!selectedProduct) return [];

    // Use standardDimensions from your API
    const availableSizes = [
      selectedProduct.standardDimensions
    ].filter(size => size && size !== 'undefined' && size !== null);

    // If no standardDimensions, show contact message
    if (availableSizes.length === 0) {
      return ['Liên hệ để biết kích thước'];
    }

    return availableSizes;
  };

  const getSelectedProductInfo = (productId) => {
    if (!productId) return null;
    return products.find(p => p.id.toString() === productId);
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
    setValidationErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    clearMessages();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      if (errors.general) {
        setError(errors.general);
      }
      return;
    }

    setSubmitting(true);
    
    try {
      // Get user info from localStorage
      const customerId = localStorage.getItem('customerId') || localStorage.getItem('userId');
      
      if (!customerId) {
        throw new Error('Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại.');
      }
      
      console.log('=== SUBMITTING RFQ ===');
      console.log('Customer ID:', customerId);
      console.log('Quote Items:', quoteItems);
      console.log('Delivery Date:', deliveryDate);
      
      // Prepare the RFQ data matching backend requirements
      const rfqData = {
        customerId: parseInt(customerId),
        expectedDeliveryDate: deliveryDate,
        details: quoteItems.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          unit: 'pcs', // Backend expects unit field
          notes: item.size || 'Standard size'
        }))
      };
      
      console.log('Final RFQ payload:', rfqData);
      
      // Submit to API
      const result = await quoteService.submitQuoteRequest(rfqData);
      console.log('RFQ submitted successfully:', result);
      
      // Show success message
      setSuccess('Yêu cầu báo giá đã được gửi thành công! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
      
      // Reset form after a delay
      setTimeout(() => {
        setQuoteItems([{
          productId: '',
          size: '',
          quantity: ''
        }]);
        setDeliveryDate('');
        
        // Navigate to quotations list
        navigate('/customer/quotations');
      }, 2000);
      
    } catch (error) {
      console.error('=== RFQ SUBMISSION ERROR ===');
      console.error(error);
      
      let errorMessage = 'Có lỗi xảy ra khi gửi yêu cầu báo giá.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện chức năng này.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau ít phút.';
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <Sidebar />
          <div className="flex-grow-1 d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Đang tải danh sách sản phẩm...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <Header />

      <div className="d-flex">
        <Sidebar />

        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Row className="justify-content-center">
              <Col lg={8} xl={6}>
                <Card className="quote-request-card shadow">
                  <Card.Body className="p-5">
                    <div className="quote-header mb-4">
                      <h2 className="quote-title d-flex align-items-center">
                        <FaPaperPlane className="me-3 text-primary" />
                        Tạo yêu cầu báo giá
                      </h2>
                      <p className="quote-subtitle text-muted">
                        Chọn sản phẩm, kích thước, số lượng và ngày giao hàng mong muốn.
                      </p>
                    </div>

                    {error && (
                      <Alert variant="danger" className="d-flex align-items-center">
                        <FaExclamationTriangle className="me-2" />
                        {error}
                      </Alert>
                    )}
                    
                    {success && (
                      <Alert variant="success">
                        {success}
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      {quoteItems.map((item, index) => {
                        const selectedProduct = getSelectedProductInfo(item.productId);
                        
                        return (
                          <div key={index} className="product-item-section mb-4 p-3 border rounded">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0">Sản phẩm {index + 1}</h6>
                              {quoteItems.length > 1 && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveProduct(index)}
                                  title="Xóa sản phẩm"
                                >
                                  <FaTrash />
                                </Button>
                              )}
                            </div>
                            
                            <Row>
                              <Col md={12} className="mb-3">
                                <Form.Label>Sản phẩm *</Form.Label>
                                <Form.Select
                                  value={item.productId}
                                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                  isInvalid={!!validationErrors[`product_${index}`]}
                                  required
                                >
                                  <option value="">Chọn sản phẩm</option>
                                  {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                      {product.name} {product.category && `(${product.category})`}
                                    </option>
                                  ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                  {validationErrors[`product_${index}`]}
                                </Form.Control.Feedback>
                                
                                {selectedProduct && (
                                  <div className="mt-2">
                                    <small className="text-muted">
                                      {selectedProduct.description && (
                                        <span>Mô tả: {selectedProduct.description}</span>
                                      )}
                                    </small>
                                  </div>
                                )}
                              </Col>

                              <Col md={6} className="mb-3">
                                <Form.Label>Kích thước</Form.Label>
                                <Form.Select
                                  value={item.size}
                                  onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                                  disabled={!item.productId}
                                >
                                  <option value="">
                                    {item.productId ? 'Chọn kích thước' : 'Chọn sản phẩm trước'}
                                  </option>
                                  {getAvailableSizes(item.productId).map(size => (
                                    <option key={size} value={size}>
                                      {size}
                                    </option>
                                  ))}
                                </Form.Select>
                                <Form.Text className="text-muted">
                                  Để trống nếu sử dụng kích thước tiêu chuẩn
                                </Form.Text>
                              </Col>

                              <Col md={6} className="mb-3">
                                <Form.Label>Số lượng *</Form.Label>
                                <Form.Control
                                  type="number"
                                  placeholder="Nhập số lượng"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                  min="1"
                                  isInvalid={!!validationErrors[`quantity_${index}`]}
                                  required
                                />
                                <Form.Control.Feedback type="invalid">
                                  {validationErrors[`quantity_${index}`]}
                                </Form.Control.Feedback>
                              </Col>
                            </Row>
                          </div>
                        );
                      })}

                      <div className="text-center mb-4">
                        <Button
                          variant="outline-primary"
                          onClick={handleAddProduct}
                          className="add-product-btn"
                          disabled={submitting}
                        >
                          <FaPlus className="me-2" />
                          Thêm sản phẩm
                        </Button>
                      </div>

                      <div className="delivery-date-section mb-4">
                        <Form.Label>Ngày giao hàng mong muốn *</Form.Label>
                        <Form.Control
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => {
                            setDeliveryDate(e.target.value);
                            if (validationErrors.deliveryDate) {
                              const newErrors = { ...validationErrors };
                              delete newErrors.deliveryDate;
                              setValidationErrors(newErrors);
                            }
                          }}
                          min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                          isInvalid={!!validationErrors.deliveryDate}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.deliveryDate}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Vui lòng chọn ngày từ ngày mai trở đi
                        </Form.Text>
                      </div>

                      {quoteItems.length > 0 && (
                        <div className="quote-summary mb-4 p-3 bg-light rounded">
                          <h6>Tóm tắt yêu cầu:</h6>
                          <ul className="mb-0">
                            {quoteItems.map((item, index) => {
                              const product = getSelectedProductInfo(item.productId);
                              return (
                                <li key={index}>
                                  {product ? product.name : 'Sản phẩm chưa chọn'} - 
                                  Số lượng: {item.quantity || '0'}
                                  {item.size && ` - Kích thước: ${item.size}`}
                                </li>
                              );
                            })}
                          </ul>
                          {deliveryDate && (
                            <div className="mt-2">
                              <Badge bg="info">Giao hàng: {new Date(deliveryDate).toLocaleDateString('vi-VN')}</Badge>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-center">
                        <Button
                          type="submit"
                          className="submit-btn px-5 py-2"
                          disabled={submitting || quoteItems.length === 0 || products.length === 0}
                          size="lg"
                        >
                          {submitting ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Đang gửi...
                            </>
                          ) : (
                            <>
                              <FaPaperPlane className="me-2" />
                              Gửi yêu cầu báo giá
                            </>
                          )}
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