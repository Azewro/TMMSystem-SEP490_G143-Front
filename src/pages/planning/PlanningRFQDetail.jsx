import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Modal, Form, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaCogs, FaWarehouse, FaFileInvoice, FaInbox, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';
import InsufficientCapacityModal from '../../components/modals/InsufficientCapacityModal';
import toast from 'react-hot-toast';

const PlanningRFQDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfqData, setRFQData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteData, setQuoteData] = useState({ profitMargin: 10, notes: '' });
  const [pricingData, setPricingData] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'SENT': return 'info';
      case 'FORWARDED_TO_PLANNING': return 'warning';
      case 'PRELIMINARY_CHECKED': return 'primary';
      case 'RECEIVED_BY_PLANNING': return 'info';
      case 'QUOTED': return 'success';
      case 'REJECTED': return 'danger';
      default: return 'light';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'DRAFT': return 'Bản nháp';
      case 'SENT': return 'Đã gửi Sale';
      case 'FORWARDED_TO_PLANNING': return 'Chờ xử lý';
      case 'PRELIMINARY_CHECKED': return 'Sale đã kiểm tra';
      case 'RECEIVED_BY_PLANNING': return 'Đã tiếp nhận';
      case 'QUOTED': return 'Đã báo giá';
      case 'REJECTED': return 'Đã từ chối';
      default: return status;
    }
  };

  const loadRFQ = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [rfq, customers, products] = await Promise.all([
        quoteService.getRFQDetails(id),
        quoteService.getAllCustomers(),
        productService.getAllProducts()
      ]);
      setRFQData(rfq);
      const customer = customers.find(c => c.id === rfq.customerId);
      setCustomerData(customer || null);
      const prodMap = {};
      products.forEach(product => { prodMap[product.id] = product; });
      setProductMap(prodMap);
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết RFQ.');
      toast.error(err.message || 'Không thể tải chi tiết RFQ.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRFQ();
  }, [loadRFQ]);

  const handleReceive = async () => {
    if (!id) return;
    setWorking(true);
    try {
      await quoteService.receiveByPlanning(id);
      toast.success('Đã xác nhận tiếp nhận RFQ.');
      await loadRFQ();
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái.');
    } finally {
      setWorking(false);
    }
  };

  const handleCapacityCheck = async (checkType) => {
    setWorking(true);
    try {
      let result;
      let isSufficient = false;

      if (checkType === 'machine') {
        result = await quoteService.checkMachineCapacity(id);
        isSufficient = result?.machineCapacity?.sufficient;
      } else {
        result = await quoteService.checkWarehouseCapacity(id);
        isSufficient = result?.warehouseCapacity?.sufficient;
      }
      
      if (isSufficient) {
        toast.success(`Kiểm tra ${checkType === 'machine' ? 'máy móc' : 'kho'}: Đủ năng lực.`);
        // Call the evaluation endpoint but don't use its response, as it's missing the required flags.
        await quoteService.evaluateCapacity(id, { status: 'SUFFICIENT', checkType });
        
        // Manually update the state to reflect the successful check.
        setRFQData(prevRfqData => ({
          ...prevRfqData,
          ...(checkType === 'machine' && { machineCapacitySufficient: true }),
          ...(checkType === 'warehouse' && { warehouseCapacitySufficient: true }),
        }));

      } else {
        setShowInsufficientModal(true);
      }
    } catch (err) {
      toast.error(err.message || `Lỗi khi kiểm tra năng lực ${checkType}.`);
      setShowInsufficientModal(true);
    } finally {
      setWorking(false);
    }
  };

  const handleInsufficientCapacitySubmit = async ({ reason, proposedNewDate }) => {
    setEvaluationLoading(true);
    try {
      await quoteService.evaluateCapacity(id, {
        status: 'INSUFFICIENT',
        reason,
        proposedNewDate: proposedNewDate || undefined
      });
      toast.success('Đã gửi thông báo năng lực không đủ cho bộ phận Sales.');
      setShowInsufficientModal(false);
      loadRFQ();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi gửi thông báo.');
    } finally {
      setEvaluationLoading(false);
    }
  };

  const openQuoteModal = async () => {
    setShowQuoteModal(true);
    setPricingLoading(true);
    try {
      const data = await quoteService.getQuotePricing(id);
      setPricingData(data);
    } catch (err) {
      toast.error(err.message || 'Không thể tải dữ liệu giá.');
      setShowQuoteModal(false);
    } finally {
      setPricingLoading(false);
    }
  };

  const closeQuoteModal = () => {
    setShowQuoteModal(false);
    setPricingData(null);
    setQuoteData({ profitMargin: 10, notes: '' });
  };

  const handleProfitMarginChange = async (newProfitMargin) => {
    setQuoteData(prev => ({ ...prev, profitMargin: newProfitMargin }));
    if (!newProfitMargin || isNaN(newProfitMargin)) return;

    setPricingLoading(true);
    try {
      const marginMultiplier = 1 + (parseFloat(newProfitMargin) / 100);
      const data = await quoteService.calculateQuotePrice(id, marginMultiplier);
      setPricingData(data);
    } catch (err) {
      toast.error(err.message || 'Không thể tính lại giá.');
    } finally {
      setPricingLoading(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!pricingData) return;
    setWorking(true);
    try {
      await quoteService.createQuote({
        rfqId: id,
        profitMargin: 1 + (parseFloat(quoteData.profitMargin) / 100),
        notes: quoteData.notes,
      });
      toast.success('Đã tạo báo giá thành công!');
      closeQuoteModal();
      loadRFQ();
    } catch (err) {
      toast.error(err.message || 'Tạo báo giá thất bại.');
    } finally {
      setWorking(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try { return new Date(dateString).toLocaleDateString('vi-VN'); } catch { return dateString; }
  };

  if (loading) {
    return <div className="d-flex vh-100 justify-content-center align-items-center"><Spinner animation="border" /></div>;
  }

  if (error && !rfqData) {
    return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
  }

  const currentStatus = rfqData?.status || 'FORWARDED_TO_PLANNING';
  const canReceive = currentStatus === 'FORWARDED_TO_PLANNING';
  const canCheckCapacity = currentStatus === 'RECEIVED_BY_PLANNING';
  const canCreateQuote = rfqData?.machineCapacitySufficient && rfqData?.warehouseCapacitySufficient && currentStatus === 'RECEIVED_BY_PLANNING';

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="planning" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
                    <Container>
                      <Row className="justify-content-center">
                        <Col lg={10} xl={8}>
                          <Card className="shadow-sm">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                              <h4 className="mb-0">Chi tiết Yêu cầu báo giá: {rfqData?.rfqNumber}</h4>
                              <Button variant="outline-secondary" size="sm" onClick={() => navigate('/planning/rfqs')}>
                                <FaArrowLeft className="me-2" /> Quay lại danh sách
                              </Button>
                            </Card.Header>
                            <Card.Body>
                              {/* General Info */}
                              <h5 className="mb-3">1. Thông tin chung</h5>
                              <Row className="mb-4">
                                <Col md={6}>
                                  <p className="mb-1"><strong>Khách hàng:</strong> {rfqData?.contactPerson || '—'}</p>
                                  <p className="mb-1"><strong>Số điện thoại:</strong> {rfqData?.contactPhone || '—'}</p>
                                  <p className="mb-1"><strong>Email:</strong> {rfqData?.contactEmail || '—'}</p>
                                  <p className="mb-1"><strong>Địa chỉ:</strong> {rfqData?.contactAddress || '—'}</p>
                                </Col>
                                <Col md={6}>
                                  <p className="mb-1"><strong>Ngày tạo RFQ:</strong> {formatDate(rfqData?.createdAt)}</p>
                                  <p className="mb-1"><strong>Ngày giao mong muốn:</strong> {formatDate(rfqData?.expectedDeliveryDate)}</p>
                                  <p className="mb-1"><strong>Trạng thái:</strong>
                                    <Badge bg={getStatusBadge(currentStatus)} className="ms-2">{getStatusText(currentStatus)}</Badge>
                                  </p>
                                  <p className="mb-1"><strong>Ghi chú:</strong> {rfqData?.notes || '—'}</p>
                                </Col>
                              </Row>
          
                              {/* Product List */}
                              <h5 className="mb-3">2. Danh sách sản phẩm</h5>
                              <Table striped bordered hover responsive className="mb-4">
                                <thead className="table-light">
                                                          <tr>
                                                            <th>STT</th>
                                                            <th>Sản phẩm</th>
                                                            <th>Kích thước</th>
                                                            <th className="text-center">Số lượng</th>
                                                          </tr>                                </thead>
                                <tbody>
                                  {rfqData?.details?.length ? rfqData.details.map((item, index) => (
                                    <tr key={item.id || index}>
                                      <td className="text-center">{index + 1}</td>
                                      <td>{productMap[item.productId]?.name || `ID: ${item.productId}`}</td>
                                      <td>{item.notes || productMap[item.productId]?.standardDimensions || '—'}</td>
                                      <td className="text-center">{item.quantity}</td>
                                    </tr>
                                  )) : (
                                    <tr><td colSpan="4" className="text-center text-muted">Không có sản phẩm.</td></tr>
                                  )}
                                </tbody>
                              </Table>
          
                              {/* Action Steps */}
                              <h5 className="mb-3">3. Quy trình xử lý</h5>
                              <Row className="gy-3">
                                {/* Step 1: Receive RFQ */}
                                <Col md={12}>
                                  <Card border={canReceive ? 'primary' : 'light'}>
                                    <Card.Body>
                                      <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                          <h6 className="mb-1"><FaInbox className="me-2" />Bước 1: Tiếp nhận RFQ</h6>
                                          <p className="text-muted mb-0 small">Xác nhận đã nhận RFQ để bắt đầu xử lý.</p>
                                        </div>
                                        <Button variant="primary" disabled={!canReceive || working} onClick={handleReceive}>
                                          {working && canReceive ? <Spinner as="span" animation="border" size="sm" /> : <FaCheckCircle />}
                                          <span className="ms-2">Xác nhận đã nhận</span>
                                        </Button>
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </Col>
                                                      {/* Step 2: Check Capacity */}
                                                      <Col md={12}>
                                                        <Card border={canCheckCapacity ? 'primary' : 'light'}>
                                                          <Card.Body>
                                                            <h6 className="mb-3"><FaCogs className="me-2" />Bước 2: Kiểm tra năng lực</h6>
                                                            <Row>
                                                              <Col md={6} className="d-flex flex-column mb-2 mb-md-0">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                  <span>Kiểm tra máy móc:</span>
                                                                  <span>
                                                                    {rfqData?.machineCapacitySufficient === true && <FaCheckCircle className="text-success" />}
                                                                    {rfqData?.machineCapacitySufficient === false && <FaTimesCircle className="text-danger" />}
                                                                  </span>
                                                                </div>
                                                                <Button variant="outline-info" size="sm" className="mt-2" onClick={() => handleCapacityCheck('machine')} disabled={!canCheckCapacity || working || rfqData?.machineCapacitySufficient === true}>
                                                                  {working ? 'Đang chạy...' : 'Chạy kiểm tra máy móc'}
                                                                </Button>
                                                              </Col>
                                                              <Col md={6} className="d-flex flex-column">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                  <span>Kiểm tra kho:</span>
                                                                  <span>
                                                                    {rfqData?.warehouseCapacitySufficient === true && <FaCheckCircle className="text-success" />}
                                                                    {rfqData?.warehouseCapacitySufficient === false && <FaTimesCircle className="text-danger" />}
                                                                  </span>
                                                                </div>
                                                                <Button variant="outline-secondary" size="sm" className="mt-2" onClick={() => handleCapacityCheck('warehouse')} disabled={!canCheckCapacity || working || rfqData?.warehouseCapacitySufficient === true}>
                                                                  {working ? 'Đang chạy...' : 'Chạy kiểm tra kho'}
                                                                </Button>
                                                              </Col>
                                                            </Row>
                                                          </Card.Body>
                                                        </Card>
                                                      </Col>
                                {/* Step 3: Create Quote */}
                                <Col md={12}>
                                  <Card border={canCreateQuote ? 'primary' : 'light'}>
                                    <Card.Body>
                                      <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                          <h6 className="mb-1"><FaFileInvoice className="me-2" />Bước 3: Tạo báo giá</h6>
                                          <p className="text-muted mb-0 small">Sau khi đủ năng lực, tạo báo giá chi tiết.</p>
                                        </div>
                                        <Button variant="success" disabled={!canCreateQuote || working} onClick={openQuoteModal}>
                                          <span className="ms-2">Tạo báo giá</span>
                                        </Button>
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Container>        </div>
      </div>

      {/* Modals */}
      <InsufficientCapacityModal
        show={showInsufficientModal}
        onHide={() => setShowInsufficientModal(false)}
        onSubmit={handleInsufficientCapacitySubmit}
        loading={evaluationLoading}
      />
      <Modal show={showQuoteModal} onHide={closeQuoteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Lập Báo Giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pricingLoading ? (
            <div className="text-center"><Spinner animation="border" /></div>
          ) : pricingData ? (
            <>
              <h6 className="mb-2">Sản phẩm báo giá</h6>
              <Table striped bordered size="sm" className="mb-4">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Sản phẩm</th>
                    <th>Kích thước</th>
                    <th className="text-center">Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {rfqData?.details?.map((item, index) => (
                    <tr key={item.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>{productMap[item.productId]?.name || `ID: ${item.productId}`}</td>
                      <td>{productMap[item.productId]?.standardDimensions || '—'}</td>
                      <td className="text-center">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <hr />
              <h6 className="mb-3">Tính toán chi phí</h6>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Giá nguyên liệu</Form.Label>
                  <Form.Control type="text" readOnly value={`${(pricingData.totalMaterialCost || 0).toLocaleString('vi-VN')} ₫`} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Giá gia công (45,000 ₫/kg)</Form.Label>
                  <Form.Control type="text" readOnly value={`${(pricingData.totalProcessCost || 0).toLocaleString('vi-VN')} ₫`} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Giá hoàn thiện (Tổng chi phí)</Form.Label>
                  <Form.Control type="text" readOnly value={`${(pricingData.totalBaseCost || 0).toLocaleString('vi-VN')} ₫`} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Lợi nhuận mong muốn (%)</Form.Label>
                  <Form.Control type="number" value={quoteData.profitMargin} onChange={(e) => handleProfitMarginChange(e.target.value)} />
                </Form.Group>
                <hr />
                <h5 className="text-end">Giá tổng: <span className="text-success">{(pricingData.finalTotalPrice || 0).toLocaleString('vi-VN')} ₫</span></h5>
                <Form.Group className="mt-3">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control as="textarea" rows={3} value={quoteData.notes} onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))} />
                </Form.Group>
              </Form>
            </>
          ) : (
            <Alert variant="danger">Không thể tải dữ liệu giá.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeQuoteModal}>Hủy</Button>
          <Button variant="primary" onClick={handleCreateQuote} disabled={working || pricingLoading}>
            {working ? 'Đang tạo...' : 'Tạo báo giá'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PlanningRFQDetail;
