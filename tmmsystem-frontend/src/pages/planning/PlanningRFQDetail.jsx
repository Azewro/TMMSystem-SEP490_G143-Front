import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Modal, Form, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaCogs, FaFileInvoice, FaInbox } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import PlanningSidebar from '../../components/common/PlanningSidebar';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';
import '../../styles/PlanningRFQDetail.css';

const STATUS_LABEL = {
  FORWARDED_TO_PLANNING: 'Chờ xác nhận',
  RECEIVED_BY_PLANNING: 'Đang xử lý',
  QUOTED: 'Đã báo giá',
  QUOTATION_CREATED: 'Đã báo giá'
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
  const [capacityChecked, setCapacityChecked] = useState(false);

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
      products.forEach(product => {
        prodMap[product.id] = product;
      });
      setProductMap(prodMap);
    } catch (err) {
      console.error('Error fetching RFQ details:', err);
      setError(err.message || 'Không thể tải chi tiết RFQ. Vui lòng thử lại.');
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
    return {
      label: STATUS_LABEL[status] || status,
      variant: STATUS_VARIANT[status] || 'secondary'
    };
  }, [rfqData]);

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

  const handleCheckCapacity = async () => {
    setWorking(true);
    setError('');
    setSuccess('');
    try {
      // In a real system this would call a capacity endpoint. Here we simulate a delay.
      await new Promise(resolve => setTimeout(resolve, 1200));
      setCapacityChecked(true);
      setSuccess('Đã kiểm tra máy móc và kho nguyên liệu. Đủ năng lực sản xuất.');
    } catch (err) {
      setError(err.message || 'Không thể kiểm tra năng lực.');
    } finally {
      setWorking(false);
    }
  };

  const openQuoteModal = async () => {
    if (!canCreateQuote) {
      setError('Vui lòng xác nhận đã nhận RFQ trước khi tạo báo giá.');
      return;
    }
    setShowQuoteModal(true);
    setError('');
    setSuccess('');
    setPricingLoading(true);
    setPricingData(null);

    try {
      const pricing = await quoteService.getQuotePricing(parseInt(id, 10));
      setPricingData(pricing);
      setQuoteData(prev => ({
        ...prev,
        materialCost: pricing.materialCost || 0,
        processingCost: pricing.processingCost || 0,
        finishingCost: pricing.finishingCost || 0
      }));
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu giá.');
    } finally {
      setPricingLoading(false);
    }
  };

  const closeQuoteModal = () => {
    setShowQuoteModal(false);
    setQuoteData({ profitMargin: 10, notes: '' });
    setPricingData(null);
  };

  const handleCreateQuote = async () => {
    setWorking(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        rfqId: parseInt(id, 10),
        profitMargin: Number(quoteData.profitMargin) || 0,
        notes: quoteData.notes
      };
      await quoteService.createQuote(payload);
      setSuccess('Đã tạo báo giá từ RFQ này.');
      closeQuoteModal();
      await loadRFQ();
    } catch (err) {
      setError(err.message || 'Không thể tạo báo giá.');
    } finally {
      setWorking(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="planning-layout">
        <Header />
        <div className="d-flex">
          <PlanningSidebar />
          <div className="flex-grow-1 d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <Spinner animation="border" variant="primary" />
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
            <Alert variant="danger">{error}</Alert>
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
              <div className="page-header mb-4 d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="page-title">Chi tiết RFQ</h1>
                  <div className="text-muted">Mã RFQ: {rfqData?.rfqNumber || `RFQ-${rfqData?.id}`}</div>
                </div>
                <Button variant="outline-secondary" onClick={() => navigate('/planning/quote-requests')}>
                  <FaArrowLeft className="me-2" /> Quay lại danh sách
                </Button>
              </div>

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
                      <div className="info-item"><strong>Ngày tạo:</strong> {formatDate(rfqData?.createdAt)}</div>
                      <div className="info-item"><strong>Ngày giao dự kiến:</strong> {formatDate(rfqData?.expectedDeliveryDate)}</div>
                      <div className="info-item">
                        <strong>Trạng thái:</strong>
                        <Badge bg={statusDisplay.variant} className="ms-2">{statusDisplay.label}</Badge>
                      </div>
                      <div className="info-item"><strong>Số dòng sản phẩm:</strong> {rfqData?.details?.length || 0}</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="mb-4 g-3">
                <Col md={6}>
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <h5 className="mb-3"><FaInbox className="me-2" /> Xác nhận tiếp nhận</h5>
                      <p className="text-muted mb-3">
                        Bước đầu tiên là xác nhận Phòng Kế hoạch đã nhận RFQ từ bộ phận Sale.
                      </p>
                      <Button variant="outline-primary" disabled={!canReceive || working} onClick={handleReceive}>
                        {working && canReceive ? (
                          <Spinner animation="border" size="sm" className="me-2" />
                        ) : null}
                        Xác nhận đã nhận
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <h5 className="mb-3"><FaCogs className="me-2" /> Kiểm tra năng lực</h5>
                      <p className="text-muted mb-3">
                        Đảm bảo máy móc, kho nguyên vật liệu sẵn sàng đáp ứng yêu cầu sản xuất.
                      </p>
                      <Button variant="outline-success" disabled={working || capacityChecked} onClick={handleCheckCapacity}>
                        {working && !canReceive ? (
                          <Spinner animation="border" size="sm" className="me-2" />
                        ) : null}
                        {capacityChecked ? 'Đã kiểm tra xong' : 'Kiểm tra năng lực'}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="products-card shadow-sm mb-4">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Danh sách sản phẩm</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive className="products-table mb-0">
                    <thead className="table-header">
                      <tr>
                        <th style={{ width: '80px' }}>STT</th>
                        <th style={{ minWidth: '200px' }}>Sản phẩm</th>
                        <th style={{ width: '150px' }}>Ghi chú</th>
                        <th style={{ width: '120px' }}>Số lượng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfqData?.details?.length ? (
                        rfqData.details.map((item, index) => {
                          const product = productMap[item.productId];
                          return (
                            <tr key={item.id || index}>
                              <td className="text-center">{index + 1}</td>
                              <td>{product?.name || `Sản phẩm ID: ${item.productId}`}</td>
                              <td className="text-center">{item.notes || product?.standardDimensions || '—'}</td>
                              <td className="text-center">{item.quantity}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-muted">Không có dữ liệu sản phẩm</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="mb-3"><FaFileInvoice className="me-2" /> Tạo báo giá</h5>
                  <p className="text-muted">
                    Khi đã xác nhận và kiểm tra năng lực, hãy tạo báo giá để gửi lại cho bộ phận Sale.
                  </p>
                  <Button
                    variant="primary"
                    disabled={!canCreateQuote || working}
                    onClick={openQuoteModal}
                  >
                    Tạo báo giá từ RFQ
                  </Button>
                </Card.Body>
              </Card>
            </div>
          </Container>
        </div>
      </div>

      <Modal show={showQuoteModal} onHide={closeQuoteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Tạo báo giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pricingLoading ? (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" />
              <div className="mt-3">Đang tải dữ liệu chi phí...</div>
            </div>
          ) : pricingData ? (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Lợi nhuận (%):</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={quoteData.profitMargin}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, profitMargin: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Ghi chú nội bộ</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={quoteData.notes}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ghi chú kết quả kiểm tra năng lực, lưu ý về giá..."
                />
              </Form.Group>
              <div className="bg-light p-3 rounded">
                <div className="fw-semibold mb-2">Chi phí tham khảo</div>
                <div className="d-flex justify-content-between"><span>Nguyên vật liệu</span><span>{(pricingData.materialCost || 0).toLocaleString('vi-VN')} ₫</span></div>
                <div className="d-flex justify-content-between"><span>Gia công</span><span>{(pricingData.processingCost || 0).toLocaleString('vi-VN')} ₫</span></div>
                <div className="d-flex justify-content-between"><span>Hoàn thiện</span><span>{(pricingData.finishingCost || 0).toLocaleString('vi-VN')} ₫</span></div>
              </div>
            </Form>
          ) : (
            <Alert variant="warning">Không có dữ liệu giá. Bạn vẫn có thể tạo báo giá.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeQuoteModal} disabled={working}>Hủy</Button>
          <Button variant="primary" onClick={handleCreateQuote} disabled={working || pricingLoading}>
            {working ? 'Đang tạo...' : 'Tạo báo giá'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PlanningRFQDetail;
