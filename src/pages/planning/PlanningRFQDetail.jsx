import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Modal, Form, Badge, Pagination } from 'react-bootstrap';
import { FaArrowLeft, FaCogs, FaFileInvoice, FaInbox, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { rfqService } from '../../api/rfqService';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';
import { getPlanningRfqStatus } from '../../utils/statusMapper';
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
  const [quoteData, setQuoteData] = useState({ notes: '' });
  const [displayProfitMargin, setDisplayProfitMargin] = useState(10); // State for input display
  const [pricingData, setPricingData] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [showCapacityReportModal, setShowCapacityReportModal] = useState(false);
  const [capacityReportData, setCapacityReportData] = useState(null);
  const [backlogPage, setBacklogPage] = useState(1);
  const backlogPageSize = 5;

  // Automation States
  const [autoCheckRun, setAutoCheckRun] = useState(false);
  const [autoReceiveRun, setAutoReceiveRun] = useState(false);

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

  const handleCapacityCheck = async () => {
    setWorking(true);
    try {
      const result = await quoteService.checkMachineCapacity(id);
      const isSufficient = result?.machineCapacity?.sufficient;

      // Lưu dữ liệu báo cáo để hiển thị sau
      setCapacityReportData(result?.machineCapacity);

      if (isSufficient) {
        // Show toast success
        toast.success('Kiểm tra máy móc: Đủ năng lực.');

        // Call the evaluation endpoint but don't use its response, as it's missing the required flags.
        await quoteService.evaluateCapacity(id, { status: 'SUFFICIENT', checkType: 'machine' });

        // Manually update the state to reflect the successful check.
        setRFQData(prevRfqData => ({
          ...prevRfqData,
          machineCapacitySufficient: true,
        }));

        // Do NOT open report modal automatically if sufficient
        // setShowCapacityReportModal(true);
      } else {
        // Không đủ năng lực - chỉ mở modal báo cáo, không tự động mở modal insufficient
        toast.error('Kiểm tra máy móc: Không đủ năng lực.');
        setShowCapacityReportModal(true);

        // Cập nhật state để hiển thị nút gửi thông báo
        setRFQData(prevRfqData => ({
          ...prevRfqData,
          machineCapacitySufficient: false,
        }));
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi khi kiểm tra năng lực máy móc.');
      // Không tự động mở modal insufficient khi có lỗi
    } finally {
      setWorking(false);
    }
  };

  // Automation Effect
  useEffect(() => {
    if (!rfqData || loading || working || error) return;

    const status = rfqData.status || 'FORWARDED_TO_PLANNING';

    // Step 1: Auto Receive
    if (status === 'FORWARDED_TO_PLANNING' && !autoReceiveRun) {
      setAutoReceiveRun(true);
      handleReceive();
      return;
    }

    // Step 2: Auto Check Capacity
    if (status === 'RECEIVED_BY_PLANNING' && !autoCheckRun) {
      setAutoCheckRun(true);
      handleCapacityCheck();
    }
  }, [rfqData, loading, working, error, autoCheckRun, autoReceiveRun]);

  const handleInsufficientCapacitySubmit = async ({ reason, proposedNewDate }) => {
    setEvaluationLoading(true);
    try {
      await quoteService.evaluateCapacity(id, {
        status: 'INSUFFICIENT',
        reason,
        proposedNewDate: proposedNewDate || undefined
      });
      toast.success('Đã gửi thông báo năng lực không đủ cho bộ phận Sales. RFQ đã được trả về cho Sales để xử lý.');
      setShowInsufficientModal(false);
      // Reload RFQ data để cập nhật trạng thái
      await loadRFQ();
      // Chuyển về danh sách sau 2 giây vì RFQ đã không còn trong danh sách Planning
      setTimeout(() => {
        navigate('/planning/rfqs');
      }, 2000);
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
    setQuoteData({ notes: '' });
    setDisplayProfitMargin(10);
  };

  const calculatePrice = async (margin) => {
    if (margin === '' || isNaN(margin)) return;
    setPricingLoading(true);
    try {
      const marginMultiplier = 1 + (parseFloat(margin) / 100);
      const data = await quoteService.calculateQuotePrice(id, marginMultiplier);
      setPricingData(data);
    } catch (err) {
      toast.error(err.message || 'Không thể tính lại giá.');
    } finally {
      setPricingLoading(false);
    }
  };

  const handleProfitMarginBlur = () => {
    calculatePrice(displayProfitMargin);
  };

  const handleCreateQuote = async () => {
    if (!pricingData) return;

    // Final calculation before creating quote
    const finalMargin = parseFloat(displayProfitMargin) || 0;
    const finalMarginMultiplier = 1 + (finalMargin / 100);

    setWorking(true);
    try {
      // Re-check capacity before creating quote to avoid race conditions
      const checkResult = await quoteService.checkMachineCapacity(id);
      const isSufficient = checkResult?.machineCapacity?.sufficient;

      if (!isSufficient) {
        toast.error('Cảnh báo: Năng lực máy móc không còn đủ (có thể do đơn hàng khác vừa được tạo). Vui lòng kiểm tra lại báo cáo.');

        // Update data to show failure
        setCapacityReportData(checkResult?.machineCapacity);
        setRFQData(prevRfqData => ({
          ...prevRfqData,
          machineCapacitySufficient: false,
        }));

        // Close quote modal and show capacity report
        closeQuoteModal();
        setShowCapacityReportModal(true);
        return;
      }

      // If sufficient, proceed to create quote
      await quoteService.createQuote({
        rfqId: id,
        profitMargin: finalMarginMultiplier,
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

  // Quy đổi ngày sang giờ làm việc (1 ngày = 8 giờ)
  const daysToHours = (days) => {
    if (!days || days === 0) return '0 giờ';
    const hours = days * 8;
    return `${hours.toFixed(2)} giờ`;
  };

  // Format năng lực với đơn vị phù hợp
  const formatCapacity = (stageType, capacity) => {
    if (capacity === null || capacity === undefined) return 'N/A';

    // Mắc cuồng và Dệt vải: Kg
    if (stageType === 'WARPING' || stageType === 'WEAVING') {
      return `${capacity.toFixed(2)} Kg/ngày`;
    }

    // Cắt vải và May thành phẩm: khăn
    if (stageType === 'CUTTING' || stageType === 'SEWING') {
      return `${capacity.toFixed(2)} khăn/ngày`;
    }

    if (stageType === 'PACKAGING' || stageType === 'DYEING') {
      return `${capacity.toFixed(0)} sản phẩm/ngày`;
    }

    return `${capacity.toFixed(2)}`;
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
  const canCreateQuote = rfqData?.machineCapacitySufficient && currentStatus === 'RECEIVED_BY_PLANNING';
  const canShowReport = capacityReportData !== null; // Hiển thị báo cáo cả khi đủ và không đủ
  const hasCheckedCapacity = capacityReportData !== null; // Đã kiểm tra năng lực
  const isInsufficient = hasCheckedCapacity && rfqData?.machineCapacitySufficient === false; // Không đủ năng lực

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
                        <p className="mb-1"><strong>Địa chỉ nhận hàng:</strong> {rfqData?.contactAddress || '—'}</p>
                      </Col>
                      <Col md={6}>
                        <p className="mb-1"><strong>Ngày tạo RFQ:</strong> {formatDate(rfqData?.createdAt)}</p>
                        <p className="mb-1"><strong>Ngày giao mong muốn:</strong> {formatDate(rfqData?.expectedDeliveryDate)}</p>
                        <p className="mb-1"><strong>Trạng thái:</strong>
                          {(() => {
                            const statusObj = getPlanningRfqStatus(rfqData);
                            return <Badge bg={statusObj.variant} className="ms-2">{statusObj.label}</Badge>;
                          })()}
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
                                <p className="text-muted mb-0 small">
                                  {canReceive
                                    ? (autoReceiveRun ? 'Tiếp nhận thất bại. Vui lòng thử lại.' : 'Đang tự động tiếp nhận...')
                                    : 'Đã tiếp nhận RFQ.'}
                                </p>
                              </div>
                              {/* Show Spinner if auto-receiving, or Retry button if failed */}
                              {canReceive && !autoReceiveRun && <Spinner animation="border" size="sm" variant="primary" />}
                              {canReceive && autoReceiveRun && (
                                <Button variant="primary" size="sm" onClick={handleReceive} disabled={working}>
                                  Thử lại
                                </Button>
                              )}
                              {!canReceive && <FaCheckCircle className="text-success" size={24} />}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      {/* Step 2: Check Capacity */}
                      <Col md={12}>
                        <Card border={canCheckCapacity || hasCheckedCapacity ? 'primary' : 'light'}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-1"><FaCogs className="me-2" />Bước 2: Kiểm tra năng lực máy móc</h6>
                                <p className="text-muted mb-0 small">
                                  {hasCheckedCapacity
                                    ? `Trạng thái: ${rfqData?.machineCapacitySufficient ? 'Đủ năng lực' : 'Không đủ năng lực'}`
                                    : (autoCheckRun ? 'Kiểm tra thất bại hoặc chưa chạy. Vui lòng thử lại.' : 'Đang tự động kiểm tra năng lực...')
                                  }
                                </p>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                {canShowReport && (
                                  <Button variant="outline-secondary" size="sm" onClick={() => setShowCapacityReportModal(true)}>
                                    Báo cáo chi tiết
                                  </Button>
                                )}
                                {/* Check button logic: Automated or Retry */}
                                {(!hasCheckedCapacity && canCheckCapacity) && (
                                  !autoCheckRun ? (
                                    <Spinner animation="border" size="sm" variant="primary" />
                                  ) : (
                                    <Button variant="primary" size="sm" onClick={handleCapacityCheck} disabled={working}>
                                      Chạy kiểm tra lại
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
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
                                <p className="text-muted mb-0 small">
                                  {canCreateQuote
                                    ? 'Sau khi đủ năng lực, tạo báo giá chi tiết.'
                                    : isInsufficient
                                      ? 'Năng lực không đủ. Vui lòng gửi thông báo cho Sales hoặc kiểm tra lại.'
                                      : 'Vui lòng kiểm tra năng lực máy móc trước.'}
                                </p>
                              </div>
                              <div className="d-flex gap-2">
                                {isInsufficient && (
                                  <Button variant="warning" disabled={working} onClick={() => setShowInsufficientModal(true)}>
                                    Gửi thông báo cho Sales
                                  </Button>
                                )}
                                <Button variant="success" disabled={!canCreateQuote || working} onClick={openQuoteModal}>
                                  <span className="ms-2">Tạo báo giá</span>
                                </Button>
                              </div>
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
      {/* Capacity Report Modal */}
      <Modal show={showCapacityReportModal} onHide={() => { setShowCapacityReportModal(false); setBacklogPage(1); }} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Báo cáo chi tiết năng lực máy móc</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {capacityReportData ? (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Trạng thái:</strong>
                    <Badge bg={capacityReportData.sufficient ? 'success' : 'danger'} className="ms-2">
                      {capacityReportData.status === 'SUFFICIENT' ? 'Đủ năng lực' : 'Không đủ năng lực'}
                    </Badge>
                  </p>
                  {capacityReportData.bottleneck && (
                    <p><strong>Công đoạn giới hạn:</strong> <span className="text-warning">{capacityReportData.bottleneck}</span></p>
                  )}
                  <p><strong>Số ngày cần thiết (backlog + đơn hiện tại):</strong> {capacityReportData.requiredDays?.toFixed(2) || 'N/A'} ngày ({daysToHours(capacityReportData.requiredDays)})</p>
                  <p><strong>Số ngày có sẵn:</strong> {capacityReportData.availableDays?.toFixed(2) || 'N/A'} ngày ({daysToHours(capacityReportData.availableDays)})</p>
                </Col>
                <Col md={6}>
                  <p><strong>Ngày bắt đầu dự kiến:</strong> {capacityReportData.productionStartDate ? new Date(capacityReportData.productionStartDate).toLocaleDateString('vi-VN') : 'N/A'}</p>
                  <p><strong>Ngày kết thúc dự kiến:</strong> {capacityReportData.productionEndDate ? new Date(capacityReportData.productionEndDate).toLocaleDateString('vi-VN') : (capacityReportData.packagingStage?.endDate ? new Date(capacityReportData.packagingStage.endDate).toLocaleDateString('vi-VN') : 'N/A')}</p>
                  <p><strong>Tổng thời gian chờ:</strong> {capacityReportData.totalWaitTime?.toFixed(2) || 'N/A'} ngày ({daysToHours(capacityReportData.totalWaitTime)})</p>
                </Col>
              </Row>

              {capacityReportData.mergeSuggestion && (
                <Alert variant={capacityReportData.sufficient ? 'success' : 'warning'} className="mb-3">
                  <strong>Kết quả:</strong> {capacityReportData.mergeSuggestion}
                </Alert>
              )}

              {/* Công suất các công đoạn - giải thích bottleneck */}
              {capacityReportData.stageCapacities && capacityReportData.stageCapacities.length > 0 && (
                <div className="mb-3">
                  <h6>🏭 Công suất các công đoạn:</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Công đoạn</th>
                        <th>Số máy/người</th>
                        <th>Năng suất/đơn vị</th>
                        <th>Tổng năng suất/ngày</th>
                        <th>Đơn vị</th>
                        <th>Bottleneck?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capacityReportData.stageCapacities.map((stage, idx) => (
                        <tr key={idx} className={stage.isBottleneck ? 'table-danger' : ''}>
                          <td><strong>{stage.stageName}</strong></td>
                          <td>{stage.machineCount || '-'}</td>
                          <td>{stage.capacityPerMachine?.toFixed(2) || '-'}</td>
                          <td><strong>{stage.totalCapacityPerDay?.toFixed(2) || '0'}</strong></td>
                          <td>{stage.unit}</td>
                          <td>{stage.isBottleneck ? <Badge bg="danger">⚠️ Bottleneck</Badge> : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <small className="text-muted">
                    💡 Bottleneck là công đoạn có năng suất thấp nhất (tính theo kg), giới hạn năng lực toàn bộ hệ thống.
                  </small>
                </div>
              )}

              {/* Chi tiết tính toán năng lực */}
              <div className="mb-3">
                <h6>📊 Chi tiết tính toán:</h6>
                <Table striped bordered size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Công đoạn giới hạn (Bottleneck)</strong></td>
                      <td>{capacityReportData.bottleneck || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Năng suất Bottleneck</strong></td>
                      <td><strong>{capacityReportData.bottleneckCapacityPerDay?.toFixed(2) || 'N/A'} kg/ngày</strong></td>
                    </tr>
                    <tr className="table-info">
                      <td><strong>A. Đơn mới (đang kiểm tra)</strong></td>
                      <td><strong>{capacityReportData.newOrderWeightKg?.toFixed(2) || '0'} kg</strong></td>
                    </tr>
                    <tr>
                      <td><strong>B. Backlog (đơn đang chờ)</strong></td>
                      <td>{capacityReportData.backlogWeightKg?.toFixed(2) || '0'} kg</td>
                    </tr>
                    <tr className="table-warning">
                      <td><strong>C. Tổng tải (A + B)</strong></td>
                      <td><strong>{capacityReportData.totalLoadKg?.toFixed(2) || '0'} kg</strong></td>
                    </tr>
                    <tr className="table-success">
                      <td><strong>D. Năng lực tối đa ({capacityReportData.availableDays || 0} ngày × {capacityReportData.bottleneckCapacityPerDay?.toFixed(0) || 0} kg)</strong></td>
                      <td><strong>{capacityReportData.maxCapacityKg?.toFixed(2) || '0'} kg</strong></td>
                    </tr>
                    <tr className={capacityReportData.sufficient ? 'table-success' : 'table-danger'}>
                      <td><strong>Kết luận (C ≤ D ?)</strong></td>
                      <td><strong>{capacityReportData.sufficient ? '✅ ĐỦ NĂNG LỰC' : '❌ KHÔNG ĐỦ NĂNG LỰC'}</strong></td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              {/* Danh sách đơn đang chiếm năng lực */}
              {capacityReportData.backlogOrders && capacityReportData.backlogOrders.length > 0 && (
                <div className="mb-3">
                  <h6>📋 Đơn hàng đang chiếm năng lực ({capacityReportData.backlogOrders.length} đơn):</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Mã báo giá</th>
                        <th>Khách hàng</th>
                        <th>Ngày giao</th>
                        <th>Khối lượng (kg)</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capacityReportData.backlogOrders
                        .slice((backlogPage - 1) * backlogPageSize, backlogPage * backlogPageSize)
                        .map((order, idx) => (
                          <tr key={idx}>
                            <td>{(backlogPage - 1) * backlogPageSize + idx + 1}</td>
                            <td>{order.quotationCode || 'N/A'}</td>
                            <td>{order.customerName || 'N/A'}</td>
                            <td>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                            <td>{order.weightKg?.toFixed(2) || '0'}</td>
                            <td><Badge bg={order.status === 'SENT' ? 'info' : order.status === 'ACCEPTED' ? 'success' : 'primary'}>{order.status}</Badge></td>
                          </tr>
                        ))}
                      <tr className="table-warning">
                        <td colSpan={4}><strong>Tổng Backlog</strong></td>
                        <td><strong>{capacityReportData.backlogWeightKg?.toFixed(2) || '0'} kg</strong></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </Table>
                  {capacityReportData.backlogOrders.length > backlogPageSize && (
                    <div className="d-flex justify-content-center">
                      <Pagination size="sm">
                        <Pagination.Prev onClick={() => setBacklogPage(p => Math.max(1, p - 1))} disabled={backlogPage === 1} />
                        {Array.from({ length: Math.ceil(capacityReportData.backlogOrders.length / backlogPageSize) }, (_, i) => (
                          <Pagination.Item key={i + 1} active={backlogPage === i + 1} onClick={() => setBacklogPage(i + 1)}>{i + 1}</Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => setBacklogPage(p => Math.min(Math.ceil(capacityReportData.backlogOrders.length / backlogPageSize), p + 1))} disabled={backlogPage >= Math.ceil(capacityReportData.backlogOrders.length / backlogPageSize)} />
                      </Pagination>
                    </div>
                  )}
                </div>
              )}

              {capacityReportData.conflicts && capacityReportData.conflicts.length > 0 && (
                <div className="mb-3">
                  <h6 className="text-danger">Xung đột phát hiện:</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Loại máy</th>
                        <th>Yêu cầu</th>
                        <th>Có sẵn</th>
                        <th>Đã sử dụng</th>
                        <th>Thông báo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capacityReportData.conflicts.map((conflict, idx) => (
                        <tr key={idx}>
                          <td>{conflict.date ? new Date(conflict.date).toLocaleDateString('vi-VN') : 'N/A'}</td>
                          <td>{conflict.machineType || 'N/A'}</td>
                          <td>{conflict.required?.toFixed(2) || 'N/A'}</td>
                          <td>{conflict.available?.toFixed(2) || 'N/A'}</td>
                          <td>{conflict.used?.toFixed(2) || 'N/A'}</td>
                          <td>{conflict.conflictMessage || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              <div className="mb-3">
                <h6>Chi tiết các công đoạn:</h6>
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Công đoạn</th>
                      <th>Thời gian xử lý</th>
                      <th>Thời gian chờ</th>
                      <th>Ngày bắt đầu</th>
                      <th>Ngày kết thúc</th>
                      <th>Năng lực</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capacityReportData.warpingStage && (
                      <tr>
                        <td>{capacityReportData.warpingStage.stageName}</td>
                        <td>{daysToHours(capacityReportData.warpingStage.processingDays)}</td>
                        <td>{daysToHours(capacityReportData.warpingStage.waitTime)}</td>
                        <td>{capacityReportData.warpingStage.startDate ? new Date(capacityReportData.warpingStage.startDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{capacityReportData.warpingStage.endDate ? new Date(capacityReportData.warpingStage.endDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{formatCapacity(capacityReportData.warpingStage.stageType, capacityReportData.warpingStage.capacity)}</td>
                      </tr>
                    )}
                    {capacityReportData.weavingStage && (
                      <tr>
                        <td>{capacityReportData.weavingStage.stageName}</td>
                        <td>{daysToHours(capacityReportData.weavingStage.processingDays)}</td>
                        <td>{daysToHours(capacityReportData.weavingStage.waitTime)}</td>
                        <td>{capacityReportData.weavingStage.startDate ? new Date(capacityReportData.weavingStage.startDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{capacityReportData.weavingStage.endDate ? new Date(capacityReportData.weavingStage.endDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{formatCapacity(capacityReportData.weavingStage.stageType, capacityReportData.weavingStage.capacity)}</td>
                      </tr>
                    )}
                    {capacityReportData.dyeingStage && (
                      <tr>
                        <td>{capacityReportData.dyeingStage.stageName}</td>
                        <td>{daysToHours(capacityReportData.dyeingStage.processingDays)}</td>
                        <td>{daysToHours(capacityReportData.dyeingStage.waitTime)}</td>
                        <td>{capacityReportData.dyeingStage.startDate ? new Date(capacityReportData.dyeingStage.startDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{capacityReportData.dyeingStage.endDate ? new Date(capacityReportData.dyeingStage.endDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{formatCapacity(capacityReportData.dyeingStage.stageType, capacityReportData.dyeingStage.capacity)}</td>
                      </tr>
                    )}
                    {capacityReportData.cuttingStage && (
                      <tr>
                        <td>{capacityReportData.cuttingStage.stageName}</td>
                        <td>{daysToHours(capacityReportData.cuttingStage.processingDays)}</td>
                        <td>{daysToHours(capacityReportData.cuttingStage.waitTime)}</td>
                        <td>{capacityReportData.cuttingStage.startDate ? new Date(capacityReportData.cuttingStage.startDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{capacityReportData.cuttingStage.endDate ? new Date(capacityReportData.cuttingStage.endDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{formatCapacity(capacityReportData.cuttingStage.stageType, capacityReportData.cuttingStage.capacity)}</td>
                      </tr>
                    )}
                    {capacityReportData.sewingStage && (
                      <tr>
                        <td>{capacityReportData.sewingStage.stageName}</td>
                        <td>{daysToHours(capacityReportData.sewingStage.processingDays)}</td>
                        <td>{daysToHours(capacityReportData.sewingStage.waitTime)}</td>
                        <td>{capacityReportData.sewingStage.startDate ? new Date(capacityReportData.sewingStage.startDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{capacityReportData.sewingStage.endDate ? new Date(capacityReportData.sewingStage.endDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{formatCapacity(capacityReportData.sewingStage.stageType, capacityReportData.sewingStage.capacity)}</td>
                      </tr>
                    )}
                    {capacityReportData.packagingStage && (
                      <tr>
                        <td>{capacityReportData.packagingStage.stageName}</td>
                        <td>{daysToHours(capacityReportData.packagingStage.processingDays)}</td>
                        <td>{daysToHours(capacityReportData.packagingStage.waitTime)}</td>
                        <td>{capacityReportData.packagingStage.startDate ? new Date(capacityReportData.packagingStage.startDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{capacityReportData.packagingStage.endDate ? new Date(capacityReportData.packagingStage.endDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{formatCapacity(capacityReportData.packagingStage.stageType, capacityReportData.packagingStage.capacity)}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {capacityReportData.dailyCapacities && capacityReportData.dailyCapacities.length > 0 && (
                <div>
                  <h6>Năng lực theo ngày:</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Mắc cuồng (Yêu cầu/Có sẵn)</th>
                        <th>Dệt vải (Yêu cầu/Có sẵn)</th>
                        <th>May thành phẩm (Yêu cầu/Có sẵn)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capacityReportData.dailyCapacities.map((daily, idx) => (
                        <tr key={idx}>
                          <td>{daily.date ? new Date(daily.date).toLocaleDateString('vi-VN') : 'N/A'}</td>
                          <td>{daily.warpingRequired?.toFixed(2) || '0'} / {daily.warpingAvailable?.toFixed(2) || '0'}</td>
                          <td>{daily.weavingRequired?.toFixed(2) || '0'} / {daily.weavingAvailable?.toFixed(2) || '0'}</td>
                          <td>{daily.sewingRequired?.toFixed(2) || '0'} / {daily.sewingAvailable?.toFixed(2) || '0'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <Alert variant="warning">Không có dữ liệu báo cáo.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCapacityReportModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
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
                  <Form.Control
                    type="number"
                    value={displayProfitMargin}
                    onChange={(e) => setDisplayProfitMargin(e.target.value)}
                    onBlur={handleProfitMarginBlur}
                  />
                </Form.Group>
                <hr />
                <h5 className="text-end">Giá tổng: <span className="text-success">{Math.round(pricingData.finalTotalPrice || 0).toLocaleString('vi-VN')} ₫</span></h5>
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
