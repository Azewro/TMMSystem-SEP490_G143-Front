import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Modal, Form, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaCogs, FaWarehouse, FaFileInvoice, FaInbox } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';
import InsufficientCapacityModal from '../../components/modals/InsufficientCapacityModal';
import '../../styles/PlanningRFQDetail.css';

const STATUS_LABEL = {
  FORWARDED_TO_PLANNING: 'FORWARDED_TO_PLANNING',
  RECEIVED_BY_PLANNING: 'RECEIVED_BY_PLANNING',
  QUOTED: 'QUOTED',
  QUOTATION_CREATED: 'QUOTATION_CREATED'
};

const STATUS_VARIANT = {
  FORWARDED_TO_PLANNING: 'warning',
  RECEIVED_BY_PLANNING: 'info',
  QUOTED: 'success',
  QUOTATION_CREATED: 'success'
};

const PlanningRFQDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfqData, setRFQData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State for capacity check
  const [isCheckingCapacity, setIsCheckingCapacity] = useState(false);
  const [capacityResult, setCapacityResult] = useState(null);
  const [capacityError, setCapacityError] = useState('');
  const [capacityCheckMessage, setCapacityCheckMessage] = useState('');
  const [machineCapacityChecked, setMachineCapacityChecked] = useState(false);
  const [warehouseCapacityChecked, setWarehouseCapacityChecked] = useState(false);

  // State for insufficient capacity modal
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);


  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteData, setQuoteData] = useState({ profitMargin: 10, notes: '' });
  const [pricingData, setPricingData] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRFQ();
  }, [loadRFQ]);

  const statusDisplay = useMemo(() => {
    const status = rfqData?.status;
    if (!status) return { label: '—', variant: 'secondary' };
    return { label: STATUS_LABEL[status] || status, variant: STATUS_VARIANT[status] || 'secondary' };
  }, [rfqData]);

  const currentStatus = rfqData?.status || 'FORWARDED_TO_PLANNING';

  const canReceive = rfqData?.status === 'FORWARDED_TO_PLANNING';
  const canCreateQuote = rfqData?.status === 'RECEIVED_BY_PLANNING';

  const handleReceive = async () => {
    if (!id) return;
    setWorking(true);
    setError('');
    setSuccess('');
    try {
      await quoteService.receiveByPlanning(id);
      setSuccess('Đã xác nhận tiếp nhận RFQ.');
      await loadRFQ();
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái.');
    } finally {
      setWorking(false);
    }
  };

  const handleCapacityCheck = async (checkType) => {
    setIsCheckingCapacity(true);
    setCapacityResult(null);
    setCapacityError('');
    setCapacityCheckMessage(''); // Clear previous message
    try {
      let result;
      if (checkType === 'machine') {
        result = await quoteService.checkMachineCapacity(id);
        setMachineCapacityChecked(true);
      } else {
        result = await quoteService.checkWarehouseCapacity(id);
        setWarehouseCapacityChecked(true);
      }
      setCapacityResult(result);
      setCapacityCheckMessage(`Kết quả kiểm tra ${checkType === 'machine' ? 'máy móc' : 'kho'}: Đủ`);
      // If both are checked, mark as sufficient
      if ((checkType === 'machine' && warehouseCapacityChecked) || (checkType === 'warehouse' && machineCapacityChecked)) {
        await quoteService.evaluateCapacity(id, { status: 'SUFFICIENT' });
        setSuccess('Đã ghi nhận năng lực sản xuất: Đủ.');
      }
    } catch (err) {
      // Instead of setting an error, open the modal to report insufficiency
      setShowInsufficientModal(true);
      setCapacityError(''); // Clear general error
    } finally {
      setIsCheckingCapacity(false);
    }
  };

  const handleInsufficientCapacitySubmit = async ({ reason, proposedNewDate }) => {
    setEvaluationLoading(true);
    setError('');
    try {
      await quoteService.evaluateCapacity(id, {
        status: 'INSUFFICIENT',
        reason,
        proposedNewDate: proposedNewDate || undefined
      });
      setSuccess('Đã gửi thông báo năng lực không đủ cho bộ phận Sales.');
      setShowInsufficientModal(false);
      loadRFQ(); // Refresh data
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi thông báo.');
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
      setError(err.message || 'Không thể tải dữ liệu giá.');
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
      setError(err.message || 'Không thể tính lại giá.');
    } finally {
      setPricingLoading(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!pricingData) return;
    setWorking(true);
    setError('');
    setSuccess('');
    try {
      await quoteService.createQuote({
        rfqId: id,
        profitMargin: 1 + (parseFloat(quoteData.profitMargin) / 100),
        notes: quoteData.notes,
      });
      setSuccess('Đã tạo báo giá thành công!');
      closeQuoteModal();
      loadRFQ();
    } catch (err) {
      setError(err.message || 'Tạo báo giá thất bại.');
    } finally {
      setWorking(false);
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try { return new Date(dateString).toLocaleDateString('vi-VN'); } catch { return dateString; }
  };

  if (loading) { /* ... loading UI ... */ }
  if (error && !rfqData) { /* ... error UI ... */ }

  return (
    <div className="planning-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="planning" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid className="p-4">
            <div className="page-header mb-4 d-flex justify-content-between align-items-center">
              {/* ... header ... */}
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Row className="mb-4">
                <Col lg={6}>
                  <Card className="info-card shadow-sm h-100">
                    <Card.Header className="bg-primary text-white">
                      <h5 className="mb-0">Thông tin khách hàng</h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="info-item"><strong>Tên khách hàng:</strong> {customerData?.contactPerson || '—'}</div>
                      <div className="info-item"><strong>Công ty:</strong> {customerData?.companyName || '—'}</div>
                      <div className="info-item"><strong>Email:</strong> {customerData?.email || '—'}</div>
                      <div className="info-item"><strong>Điện thoại:</strong> {customerData?.phoneNumber || '—'}</div>
                      <div className="info-item"><strong>Mã số thuế:</strong> {customerData?.taxCode || '—'}</div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={6}>
                  <Card className="info-card shadow-sm h-100">
                    <Card.Header className="bg-primary text-white">
                      <h5 className="mb-0">Thông tin RFQ</h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="info-item"><strong>Mã RFQ:</strong> {rfqData?.rfqNumber || `RFQ-${rfqData?.id}`}</div>
                      <div className="info-item"><strong>Ngày tạo:</strong> {formatDate(rfqData?.createdAt)}</div>
                      <div className="info-item"><strong>Ngày mong muốn nhận:</strong> {formatDate(rfqData?.expectedDeliveryDate)}</div>
                      <div className="info-item">
                        <strong>Trạng thái:</strong>
                        <Badge bg={STATUS_VARIANT[currentStatus]} className="ms-2">
                          {STATUS_LABEL[currentStatus] || currentStatus}
                        </Badge>
                      </div>
                      <div className="info-item"><strong>Số lượng sản phẩm:</strong> {rfqData?.details?.length || 0}</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

            <Row className="mb-4 g-3">
              <Col md={6}>
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <h5 className="mb-3"><FaInbox className="me-2" /> Xác nhận tiếp nhận</h5>
                    <p className="text-muted mb-3">Xác nhận đã nhận RFQ để bắt đầu quy trình xử lý.</p>
                    <Button variant="outline-primary" disabled={!canReceive || working} onClick={handleReceive}>
                        {working && canReceive ? <Spinner as="span" animation="border" size="sm"/> : null}
                        Xác nhận đã nhận
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <h5 className="mb-3"><FaCogs className="me-2" /> Kiểm tra năng lực</h5>
                    <p className="text-muted mb-3">Kiểm tra năng lực sản xuất và kho vận cho RFQ.</p>
                    <div className="d-flex gap-2">
                      <Button variant="info" onClick={() => handleCapacityCheck('machine')} disabled={isCheckingCapacity || !canCreateQuote}>
                          <FaCogs className="me-2"/>
                          {isCheckingCapacity ? 'Đang kiểm tra...' : 'Kiểm tra máy móc'}
                      </Button>
                      <Button variant="secondary" onClick={() => handleCapacityCheck('warehouse')} disabled={isCheckingCapacity || !canCreateQuote}>
                          <FaWarehouse className="me-2"/>
                          {isCheckingCapacity ? 'Đang kiểm tra...' : 'Kiểm tra kho'}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {(capacityError || capacityCheckMessage) && (
                <Card className="shadow-sm mb-4">
                    <Card.Header><h5 className="mb-0">Kết quả kiểm tra năng lực</h5></Card.Header>
                    <Card.Body>
                        {isCheckingCapacity && <div className="text-center"><Spinner animation="border"/></div>}
                        {capacityError && <Alert variant="danger">{capacityError}</Alert>}
                        {capacityCheckMessage && !capacityError && <Alert variant="success">{capacityCheckMessage}</Alert>}
                    </Card.Body>
                </Card>
            )}

            <Card className="products-card shadow-sm mb-4">
              <Card.Header className="bg-primary text-white"><h5 className="mb-0">Danh sách sản phẩm</h5></Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="products-table mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>STT</th>
                      <th>Sản phẩm</th>
                      <th>Ghi chú</th>
                      <th>Số lượng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqData?.details?.length ? (
                      rfqData.details.map((item, index) => {
                        const product = productMap[item.productId];
                        return (
                          <tr key={item.id || index}>
                            <td className="text-center">{index + 1}</td>
                            <td>{product?.name || `ID: ${item.productId}`}</td>
                            <td>{item.notes || product?.standardDimensions || '—'}</td>
                            <td className="text-center">{item.quantity}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={4} className="text-center py-4 text-muted">Không có dữ liệu sản phẩm</td></tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-3"><FaFileInvoice className="me-2" /> Tạo báo giá</h5>
                <p className="text-muted mb-3">Sau khi kiểm tra năng lực, tạo báo giá để gửi cho bộ phận kinh doanh.</p>
                <Button 
                  variant="success" 
                  onClick={openQuoteModal} 
                  disabled={!machineCapacityChecked || !warehouseCapacityChecked || !canCreateQuote}
                >
                  Tạo báo giá từ RFQ
                </Button>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
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
            <Form>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm="5">Giá nguyên liệu</Form.Label>
                <Col sm="7">
                  <Form.Control type="text" readOnly value={`${(pricingData.totalMaterialCost || 0).toLocaleString('vi-VN')} ₫`} />
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm="5">Giá gia công</Form.Label>
                <Col sm="7">
                  <Form.Control 
                    type="text" 
                    readOnly 
                    value={`${(pricingData.totalProcessCost || 0).toLocaleString('vi-VN')} ₫`} 
                  />
                  <Form.Text className="text-muted">
                    (Đơn giá: 45,000 ₫/kg)
                  </Form.Text>
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm="5">Giá hoàn thiện</Form.Label>
                <Col sm="7">
                  <Form.Control type="text" readOnly value={`${(pricingData.totalBaseCost || 0).toLocaleString('vi-VN')} ₫`} />
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm="5">Lợi nhuận mong muốn (%)</Form.Label>
                <Col sm="7">
                  <Form.Control 
                    type="number" 
                    value={quoteData.profitMargin}
                    onChange={(e) => handleProfitMarginChange(e.target.value)}
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} className="mb-3">
                <Form.Label column sm="5">Giá tổng</Form.Label>
                <Col sm="7">
                  <Form.Control type="text" readOnly value={`${(pricingData.finalTotalPrice || 0).toLocaleString('vi-VN')} ₫`} />
                </Col>
              </Form.Group>
              <Form.Group>
                <Form.Label>Ghi chú</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  value={quoteData.notes}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Form.Group>
            </Form>
          ) : (
            <Alert variant="danger">Không thể tải dữ liệu giá.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeQuoteModal}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleCreateQuote} disabled={working || pricingLoading}>
            {working ? 'Đang tạo...' : 'Tạo báo giá'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PlanningRFQDetail;
