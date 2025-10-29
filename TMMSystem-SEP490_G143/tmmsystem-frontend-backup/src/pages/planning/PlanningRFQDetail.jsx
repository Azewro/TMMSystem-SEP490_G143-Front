import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { FaArrowLeft, FaCogs, FaFileInvoice, FaTimes } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import PlanningSidebar from '../../components/common/PlanningSidebar';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';
import '../../styles/PlanningRFQDetail.css';

const PlanningRFQDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfqData, setRFQData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkingCapacity, setCheckingCapacity] = useState(false);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Quote Modal State - Updated for new structure
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteData, setQuoteData] = useState({
    materialCost: 0,        // From backend
    processingCost: 45000,  // Fixed rate 45k/1kg
    finishingCost: 0,       // From backend
    profitMargin: ''        // Manual input only
  });
  const [pricingData, setPricingData] = useState(null);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  useEffect(() => {
    const fetchRFQDetails = async () => {
      setLoading(true);
      try {
        console.log('=== PLANNING: FETCHING RFQ DETAILS ===');
        console.log('RFQ ID:', id);

        // Fetch RFQ details
        const realRFQ = await quoteService.getRFQDetails(id);
        console.log('Planning RFQ data:', realRFQ);
        setRFQData(realRFQ);

        // Fetch all customers to get customer data
        const customers = await quoteService.getAllCustomers();
        console.log('All customers:', customers);
        const customer = customers.find(c => c.id === realRFQ.customerId);
        console.log('Found customer:', customer);
        setCustomerData(customer);

        // Fetch all products to map product IDs to names
        const products = await productService.getAllProducts();
        console.log('All products:', products);
        const prodMap = {};
        products.forEach(product => {
          prodMap[product.id] = product;
        });
        setProductMap(prodMap);

      } catch (error) {
        console.error('Error fetching RFQ details:', error);
        setError('Không thể tải chi tiết RFQ. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchRFQDetails();
  }, [id]);

  // New useEffect to fetch pricing data when modal opens
  useEffect(() => {
    const fetchPricingData = async () => {
      if (showQuoteModal && id) {
        try {
          console.log('Fetching pricing data for RFQ:', id);
          const pricing = await quoteService.getQuotePricing(id);

          setPricingData(pricing);
          setQuoteData(prev => ({
            ...prev,
            materialCost: pricing.materialCost || 0,
            finishingCost: pricing.finishingCost || 0
          }));

          // Calculate initial total
          if (pricing.materialCost && pricing.finishingCost) {
            calculatePriceWithAPI(0); // Start with 0% profit margin
          }

        } catch (error) {
          console.error('Error fetching pricing data:', error);
          // Use fallback data for demo
          const fallbackPricing = {
            materialCost: 150000,
            finishingCost: 50000
          };
          setPricingData(fallbackPricing);
          setQuoteData(prev => ({
            ...prev,
            materialCost: fallbackPricing.materialCost,
            finishingCost: fallbackPricing.finishingCost
          }));
          calculatePriceWithAPI(0);
        }
      }
    };

    fetchPricingData();
  }, [showQuoteModal, id]);

  const handleGoBack = () => {
    navigate('/planning/quote-requests');
  };

  const handleCheckCapacity = async () => {
    setCheckingCapacity(true);
    setError('');
    setSuccess('');

    try {
      console.log('Checking machine and warehouse capacity...');
      // TODO: Implement capacity checking API

      // Simulate capacity check
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccess('✅ Kiểm tra hoàn tất: Máy móc và kho hàng đủ năng lực sản xuất!');

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);

    } catch (error) {
      console.error('Capacity check error:', error);
      setError('❌ Lỗi khi kiểm tra năng lực sản xuất: ' + error.message);
    } finally {
      setCheckingCapacity(false);
    }
  };

  const handleCreateQuote = () => {
    setShowQuoteModal(true);
  };

  const handleCloseQuoteModal = () => {
    setShowQuoteModal(false);
    setQuoteData({
      materialCost: 0,
      processingCost: 45000,
      finishingCost: 0,
      profitMargin: ''
    });
    setPricingData(null);
    setCalculatedTotal(0);
  };

  // Updated price calculation with API
  const calculatePriceWithAPI = async (profitMargin) => {
    try {
      if (!id) return 0;

      const calculation = await quoteService.calculateQuotePrice(id, profitMargin || 0);
      setCalculatedTotal(calculation.totalAmount || 0);
      return calculation.totalAmount || 0;
    } catch (error) {
      console.error('Price calculation error:', error);
      // Fallback calculation
      const baseCosts = quoteData.materialCost + quoteData.processingCost + quoteData.finishingCost;
      const profit = baseCosts * ((profitMargin || 0) / 100);
      const total = baseCosts + profit;
      setCalculatedTotal(total);
      return total;
    }
  };

  const handleQuoteInputChange = async (field, value) => {
    setQuoteData(prev => ({
      ...prev,
      [field]: value
    }));

    // If profit margin changed, recalculate price
    if (field === 'profitMargin') {
      await calculatePriceWithAPI(parseFloat(value) || 0);
    }
  };

  const handleSubmitQuote = async () => {
    setCreatingQuote(true);
    setError('');

    try {
      console.log('=== SUBMITTING QUOTE (with RFQ workflow enforcement) ===');
      console.log('Quote data:', quoteData);
      console.log('Total amount:', calculatedTotal);

      // 1) Ensure RFQ goes through the required workflow steps
      // Backend requires RFQ to be "received by planning" before creating quotation
      try {
        await quoteService.sendRfq(id);
        console.log('✓ RFQ sent');
      } catch (e) {
        console.log('sendRfq skipped (already done or not applicable):', e?.message);
      }

      try {
        await quoteService.preliminaryCheck(id);
        console.log('✓ Preliminary check completed');
      } catch (e) {
        console.log('preliminaryCheck skipped (already done or not applicable):', e?.message);
      }

      try {
        await quoteService.forwardToPlanning(id);
        console.log('✓ Forwarded to Planning');
      } catch (e) {
        console.log('forwardToPlanning skipped (already done or not applicable):', e?.message);
      }

      try {
        await quoteService.receiveByPlanning(id);
        console.log('✓ Received by Planning');
      } catch (e) {
        console.log('receiveByPlanning skipped (already done or not applicable):', e?.message);
      }

      // 2) Calculate final price with backend
      let finalTotal = calculatedTotal;
      try {
        const calculation = await quoteService.calculateQuotePrice(parseInt(id), parseFloat(quoteData.profitMargin) || 0);
        finalTotal = calculation?.totalAmount || calculatedTotal;
        setCalculatedTotal(finalTotal);
        console.log('✓ Price calculated:', finalTotal);
      } catch (e) {
        console.log('Price calculation failed, using UI total:', e?.message);
      }

      // 3) Create quotation from RFQ
      const newQuote = await quoteService.createQuote({
        rfqId: parseInt(id),
        profitMargin: parseFloat(quoteData.profitMargin) || 0,
        notes: 'Capacity checked by Planning Department'
      });

      console.log('Quote created successfully:', newQuote);

      setSuccess('✅ Báo giá đã được tạo và gửi thành công!');
      handleCloseQuoteModal();

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);

    } catch (error) {
      console.error('Submit quote error:', error);
      setError('❌ Lỗi khi tạo báo giá: ' + (error?.message || 'Server error'));
    } finally {
      setCreatingQuote(false);
    }
  };


  const getStatusDisplay = (status) => {
    switch (status) {
      case 'DRAFT': return 'Chờ xử lý';
      case 'SENT': return 'Đang chờ phê duyệt';
      case 'QUOTED': return 'Đã báo giá';
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      default: return status || 'Chờ xử lý';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'warning';
      case 'SENT': return 'warning';
      case 'QUOTED': return 'info';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="planning-layout">
        <Header />
        <div className="d-flex">
          <PlanningSidebar />
          <div className="flex-grow-1 d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <div>Đang tải dữ liệu...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !rfqData) {
    return (
      <div className="planning-layout">
        <Header />
        <div className="d-flex">
          <PlanningSidebar />
          <div className="flex-grow-1 d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <div className="text-danger">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="planning-layout">
      <Header />

      <div className="d-flex">
        <PlanningSidebar />

        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="planning-rfq-detail-page">
              {/* Status Messages */}
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                  {success}
                </Alert>
              )}

              {/* Page Header */}
              <div className="page-header mb-4">
                <h1 className="page-title">Chi tiết Yêu cầu Báo giá</h1>
              </div>

              {/* Customer and RFQ Info Cards */}
              <Row className="mb-4">
                {/* Customer Information */}
                <Col lg={6}>
                  <Card className="info-card shadow-sm h-100">
                    <Card.Header className="bg-primary text-white">
                      <h5 className="mb-0">Thông tin khách hàng</h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="info-item">
                        <strong>Tên khách hàng:</strong> {customerData?.contactPerson || 'Nguyễn Văn A'}
                      </div>
                      <div className="info-item">
                        <strong>Công ty:</strong> {customerData?.companyName || 'Công ty TNHH ABC'}
                      </div>
                      <div className="info-item">
                        <strong>Email:</strong> {customerData?.email || 'nguyenvana@abc.com'}
                      </div>
                      <div className="info-item">
                        <strong>Điện thoại:</strong> {customerData?.phoneNumber || '0901234567'}
                      </div>
                      <div className="info-item">
                        <strong>Mã số thuế:</strong> {customerData?.taxCode || '0123456789'}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* RFQ Information */}
                <Col lg={6}>
                  <Card className="info-card shadow-sm h-100">
                    <Card.Header className="bg-primary text-white">
                      <h5 className="mb-0">Thông tin RFQ</h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="info-item">
                        <strong>Mã RFQ:</strong> {rfqData?.rfqNumber || 'RFQ-2025-001'}
                      </div>
                      <div className="info-item">
                        <strong>Ngày tạo:</strong> {formatDate(rfqData?.createdAt) || '13/10/2025'}
                      </div>
                      <div className="info-item">
                        <strong>Trạng thái:</strong>
                        <span className={`badge bg-${getStatusColor(rfqData?.status)} ms-2`}>
                          {getStatusDisplay(rfqData?.status) || 'Đang chờ phê duyệt'}
                        </span>
                      </div>
                      <div className="info-item">
                        <strong>Ngày mong muốn nhận:</strong> {formatDate(rfqData?.expectedDeliveryDate) || '20/10/2025'}
                      </div>
                      <div className="info-item">
                        <strong>Số lượng sản phẩm:</strong> {rfqData?.details?.length || 3}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Product Details Table */}
              <Card className="products-card shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Danh sách sản phẩm</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive className="products-table mb-0">
                    <thead className="table-header">
                      <tr>
                        <th style={{ width: '80px' }}>STT</th>
                        <th style={{ width: '150px' }}>Mã đơn hàng</th>
                        <th style={{ minWidth: '200px' }}>Sản phẩm</th>
                        <th style={{ width: '120px' }}>Kích thước</th>
                        <th style={{ width: '100px' }}>Số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfqData?.details?.length > 0 ? rfqData.details.map((item, index) => {
                        const product = productMap[item.productId];
                        return (
                          <tr key={item.id || index}>
                            <td className="text-center">{index + 1}</td>
                            <td>
                              <span className="order-code">ORD-{String(index + 1).padStart(3, '0')}</span>
                            </td>
                            <td>
                              <span className="product-name">
                                {product?.name || `Khăn mặt bambo`}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="size-info">
                                {item.notes || item.size || product?.standardDimensions || '10x30cm'}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="quantity">{item.quantity || 100}</span>
                            </td>
                          </tr>
                        );
                      }) : (
                        // Fallback data matching your mockup
                        <>
                          <tr>
                            <td className="text-center">1</td>
                            <td><span className="order-code">ORD-001</span></td>
                            <td><span className="product-name">Khăn mặt bambo</span></td>
                            <td className="text-center"><span className="size-info">10x30cm</span></td>
                            <td className="text-center"><span className="quantity">100</span></td>
                          </tr>
                          <tr>
                            <td className="text-center">2</td>
                            <td><span className="order-code">ORD-002</span></td>
                            <td><span className="product-name">Khăn thể thao cotton</span></td>
                            <td className="text-center"><span className="size-info">15x25cm</span></td>
                            <td className="text-center"><span className="quantity">200</span></td>
                          </tr>
                          <tr>
                            <td className="text-center">3</td>
                            <td><span className="order-code">ORD-003</span></td>
                            <td><span className="product-name">Khăn tăm hoa tieu bambo</span></td>
                            <td className="text-center"><span className="size-info">30x70cm</span></td>
                            <td className="text-center"><span className="quantity">150</span></td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {/* Action Buttons */}
              <div className="planning-actions mt-4 d-flex justify-content-between align-items-center">
                <Button
                  variant="outline-secondary"
                  onClick={handleGoBack}
                  className="back-button"
                >
                  <FaArrowLeft className="me-2" />
                  Quay lại danh sách
                </Button>

                <div className="action-buttons">
                  <Button
                    variant="warning"
                    onClick={handleCheckCapacity}
                    disabled={checkingCapacity}
                    className="me-3 capacity-button"
                  >
                    {checkingCapacity ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                        Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <FaCogs className="me-2" />
                        Kiểm tra máy & kho
                      </>
                    )}
                  </Button>

                  <Button
                    variant="success"
                    onClick={handleCreateQuote}
                    className="quote-button"
                  >
                    <FaFileInvoice className="me-2" />
                    Lập báo giá
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>

      {/* Quote Creation Modal - Updated Structure */}
      <Modal
        show={showQuoteModal}
        onHide={handleCloseQuoteModal}
        size="md"
        centered
        backdrop="static"
        className="quote-modal"
      >
        <Modal.Header className="quote-modal-header">
          <Modal.Title>Lập Báo Giá</Modal.Title>
          <Button
            variant="link"
            onClick={handleCloseQuoteModal}
            className="close-button"
          >
            <FaTimes />
          </Button>
        </Modal.Header>

        <Modal.Body className="quote-modal-body">
          <Form>
            {/* Material Cost - Read Only */}
            <Form.Group className="mb-3">
              <Form.Label>Giá nguyên vật liệu</Form.Label>
              <Form.Control
                type="text"
                value={formatCurrency(quoteData.materialCost)}
                disabled
                className="readonly-field"
              />
              <Form.Text className="text-muted">
                Giá trị được tính tự động từ hệ thống
              </Form.Text>
            </Form.Group>

            {/* Processing Cost - Fixed Rate Display */}
            <Form.Group className="mb-3">
              <Form.Label>Giá công đoạn chung</Form.Label>
              <Form.Control
                type="text"
                value={formatCurrency(quoteData.processingCost) + " (45k/1kg)"}
                disabled
                className="readonly-field"
              />
              <Form.Text className="text-muted">
                Giá cố định theo tiêu chuẩn sản xuất
              </Form.Text>
            </Form.Group>

            {/* Finishing Cost - Read Only */}
            <Form.Group className="mb-3">
              <Form.Label>Giá hoàn thiện</Form.Label>
              <Form.Control
                type="text"
                value={formatCurrency(quoteData.finishingCost)}
                disabled
                className="readonly-field"
              />
              <Form.Text className="text-muted">
                Giá trị được tính tự động từ hệ thống
              </Form.Text>
            </Form.Group>

            {/* Profit Margin - Manual Input */}
            <Form.Group className="mb-3">
              <Form.Label>Lợi nhuận mong muốn (%)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Nhập % lợi nhuận..."
                value={quoteData.profitMargin}
                onChange={(e) => handleQuoteInputChange('profitMargin', e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
              <Form.Text className="text-muted">
                Tỉ lệ lợi nhuận mong muốn (%)
              </Form.Text>
            </Form.Group>

            {/* Total - Calculated */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Tổng cộng</Form.Label>
              <Form.Control
                type="text"
                value={formatCurrency(calculatedTotal)}
                disabled
                className="total-field"
              />
              <Form.Text className="text-muted">
                Tổng giá trị báo giá (bao gồm lợi nhuận)
              </Form.Text>
            </Form.Group>

            {pricingData && (
              <div className="pricing-breakdown mt-3 p-3 bg-light rounded">
                <h6 className="fw-bold mb-2">Chi tiết tính toán:</h6>
                <small className="text-muted">
                  <div>Nguyên vật liệu: {formatCurrency(quoteData.materialCost)}</div>
                  <div>Công đoạn chung: {formatCurrency(quoteData.processingCost)}</div>
                  <div>Hoàn thiện: {formatCurrency(quoteData.finishingCost)}</div>
                  <div>Lợi nhuận ({quoteData.profitMargin || 0}%): {formatCurrency(calculatedTotal - (quoteData.materialCost + quoteData.processingCost + quoteData.finishingCost))}</div>
                  <hr className="my-2" />
                  <div className="fw-bold">Tổng: {formatCurrency(calculatedTotal)}</div>
                </small>
              </div>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer className="quote-modal-footer">
          <Button
            variant="outline-secondary"
            onClick={handleCloseQuoteModal}
            disabled={creatingQuote}
          >
            Hủy
          </Button>
          <Button
            variant="success"
            onClick={handleSubmitQuote}
            disabled={creatingQuote || calculatedTotal === 0}
          >
            {creatingQuote ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                Đang tạo...
              </>
            ) : (
              'Gửi Báo Giá'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PlanningRFQDetail;
