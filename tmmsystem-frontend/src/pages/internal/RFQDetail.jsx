import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaPaperPlane, FaClipboardCheck, FaShareSquare } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';
import '../../styles/RFQDetail.css';

const STATUS_LABEL = {
  DRAFT: 'Chờ xử lý',
  SENT: 'Đã gửi',
  PRELIMINARY_CHECKED: 'Đã kiểm tra sơ bộ',
  FORWARDED_TO_PLANNING: 'Đã chuyển Phòng Kế hoạch',
  RECEIVED_BY_PLANNING: 'Kế hoạch đã nhận',
  QUOTED: 'Đã tạo báo giá',
  REJECTED: 'Từ chối'
};

const STATUS_VARIANT = {
  DRAFT: 'secondary',
  SENT: 'info',
  PRELIMINARY_CHECKED: 'primary',
  FORWARDED_TO_PLANNING: 'warning',
  RECEIVED_BY_PLANNING: 'warning',
  QUOTED: 'success',
  REJECTED: 'danger'
};

const workflowSteps = [
  {
    key: 'DRAFT',
    title: 'Tạo yêu cầu báo giá',
    description: 'Khách hàng đã gửi yêu cầu trên hệ thống.'
  },
  {
    key: 'SENT',
    title: 'Gửi yêu cầu cho bộ phận Sale',
    description: 'Sale xác nhận và gửi yêu cầu cho khách hàng.'
  },
  {
    key: 'PRELIMINARY_CHECKED',
    title: 'Kiểm tra sơ bộ',
    description: 'Sale kiểm tra thông tin đơn hàng, số lượng, lịch trình.'
  },
  {
    key: 'FORWARDED_TO_PLANNING',
    title: 'Chuyển sang Phòng Kế hoạch',
    description: 'Sale chuyển yêu cầu đến Phòng Kế hoạch để đánh giá năng lực.'
  },
  {
    key: 'RECEIVED_BY_PLANNING',
    title: 'Phòng Kế hoạch đã nhận',
    description: 'Phòng Kế hoạch xác nhận đã tiếp nhận RFQ.'
  },
  {
    key: 'QUOTED',
    title: 'Đã tạo báo giá',
    description: 'Phòng Kế hoạch đã phản hồi báo giá cho bộ phận Sale.'
  }
];

const RFQDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfqData, setRFQData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const currentStatus = rfqData?.status || 'DRAFT';

  const nextAction = useMemo(() => {
    if (!rfqData) return null;

    switch (rfqData.status) {
      case 'DRAFT':
        return {
          key: 'send',
          label: 'Gửi yêu cầu báo giá',
          icon: <FaPaperPlane className="me-2" />,
          description: 'Gửi yêu cầu đến khách hàng và cập nhật trạng thái sang SENT.',
          handler: () => quoteService.sendRfq(id),
          success: 'Đã gửi RFQ cho khách hàng thành công.'
        };
      case 'SENT':
        return {
          key: 'check',
          label: 'Hoàn tất kiểm tra sơ bộ',
          icon: <FaClipboardCheck className="me-2" />,
          description: 'Xác nhận đã kiểm tra thông tin RFQ trước khi chuyển cho Phòng Kế hoạch.',
          handler: () => quoteService.preliminaryCheck(id),
          success: 'RFQ đã được đánh dấu kiểm tra sơ bộ.'
        };
      case 'PRELIMINARY_CHECKED':
        return {
          key: 'forward',
          label: 'Chuyển sang Phòng Kế hoạch',
          icon: <FaShareSquare className="me-2" />,
          description: 'Chuyển yêu cầu này sang Phòng Kế hoạch đánh giá năng lực sản xuất.',
          handler: () => quoteService.forwardToPlanning(id),
          success: 'Đã chuyển RFQ sang Phòng Kế hoạch.'
        };
      default:
        return null;
    }
  }, [rfqData, id]);

  const handleAction = async () => {
    if (!nextAction) return;
    setWorking(true);
    setError('');
    setSuccess('');

    try {
      await nextAction.handler();
      setSuccess(nextAction.success);
      await loadRFQ();
    } catch (err) {
      setError(err.message || 'Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setWorking(false);
    }
  };

  const getStepState = (stepKey) => {
    const statusOrder = workflowSteps.map(step => step.key);
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex < 0) return 'pending';
    if (currentIndex > stepIndex) return 'done';
    if (currentIndex === stepIndex) return 'current';
    return 'pending';
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
      <div className="internal-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar />
          <div className="flex-grow-1 d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <Spinner animation="border" variant="primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !rfqData) {
    return (
      <div className="internal-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar />
          <div className="flex-grow-1 d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <Alert variant="danger">{error}</Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="internal-layout">
      <Header />

      <div className="d-flex">
        <InternalSidebar />

        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="rfq-detail-page">
              <div className="page-header mb-4 d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="page-title">Chi tiết Yêu cầu Báo giá</h1>
                  <div className="text-muted">Mã RFQ: {rfqData?.rfqNumber || `RFQ-${rfqData?.id}`}</div>
                </div>
                <Button variant="outline-secondary" onClick={() => navigate('/internal/quote-requests')}>
                  <FaArrowLeft className="me-2" />Quay lại danh sách
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
                      <div className="info-item"><strong>Ngày mong muốn nhận:</strong> {formatDate(rfqData?.expectedDeliveryDate)}</div>
                      <div className="info-item">
                        <strong>Trạng thái:</strong>
                        <Badge bg={STATUS_VARIANT[currentStatus]} className="ms-2">
                          {STATUS_LABEL[currentStatus] || currentStatus}
                        </Badge>
                      </div>
                      <div className="info-item"><strong>Số dòng sản phẩm:</strong> {rfqData?.details?.length || 0}</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Tiến trình xử lý</h5>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    {workflowSteps.map(step => {
                      const state = getStepState(step.key);
                      return (
                        <Col key={step.key} md={4}>
                          <div className={`workflow-step workflow-step--${state}`}>
                            <div className="workflow-step__title">{step.title}</div>
                            <div className="workflow-step__description text-muted">{step.description}</div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Card.Body>
              </Card>

              {nextAction && (
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <h5 className="mb-3">Thao tác tiếp theo</h5>
                    <p className="text-muted">{nextAction.description}</p>
                    <Button variant="primary" disabled={working} onClick={handleAction}>
                      {working ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Đang thực hiện...
                        </>
                      ) : (
                        <>
                          {nextAction.icon}
                          {nextAction.label}
                        </>
                      )}
                    </Button>
                  </Card.Body>
                </Card>
              )}

              <Card className="products-card shadow-sm">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">Danh sách sản phẩm</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive className="products-table mb-0">
                    <thead className="table-header">
                      <tr>
                        <th style={{ width: '80px' }}>STT</th>
                        <th style={{ minWidth: '200px' }}>Sản phẩm</th>
                        <th style={{ width: '150px' }}>Kích thước/Ghi chú</th>
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
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default RFQDetail;
