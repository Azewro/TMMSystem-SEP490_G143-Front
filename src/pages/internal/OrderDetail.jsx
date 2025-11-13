import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Badge, Modal, Form } from 'react-bootstrap';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';
import { contractService } from '../../api/contractService';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import '../../styles/RFQDetail.css';

const formatCurrency = (v) => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(v||0);

const STATUS_LABEL = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  ORDER_CREATED: 'ORDER_CREATED',
  QUOTED: 'QUOTED'
};

const STATUS_VARIANT = {
  DRAFT: 'secondary',
  SENT: 'info',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  ORDER_CREATED: 'primary',
  QUOTED: 'success'
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quoteData, setQuoteData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractName, setContractName] = useState('');
  const [contractFile, setContractFile] = useState(null);
  const [submittingContract, setSubmittingContract] = useState(false);

  const handleContractSubmit = async () => {
    if (!contractName || !contractFile || !quoteData) {
      setError('Vui lòng nhập tên hợp đồng và chọn file.');
      return;
    }

    setSubmittingContract(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Create the contract
      const contractData = {
        contractNumber: contractName,
        quotationId: quoteData.id,
        customerId: quoteData.customerId,
        totalAmount: quoteData.totalAmount,
        contractDate: new Date().toISOString().split('T')[0], // Today's date
        deliveryDate: quoteData.validUntil,
        status: 'DRAFT'
      };

      console.log('Creating contract with payload:', contractData);

      const newContract = await contractService.createContract(contractData);

      // Step 2: Upload the file
      const userId =
        parseInt(sessionStorage.getItem('userId'), 10) ||
        parseInt(localStorage.getItem('userId'), 10);
      if (!userId) {
        throw new Error('Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.');
      }
      await contractService.uploadSignedContract(newContract.id, contractFile, 'Initial upload', userId);

      setSuccess('Hợp đồng đã được tạo và upload thành công!');
      setShowContractModal(false);
      setContractName('');
      setContractFile(null);

    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tạo hợp đồng.');
    } finally {
      setSubmittingContract(false);
    }
  };

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');

    try {
      const [quote, customers, products] = await Promise.all([
        quoteService.getQuoteDetails(id),
        quoteService.getAllCustomers(), // Keep for customer info
        productService.getAllProducts()
      ]);

      setQuoteData(quote);
      const customer = customers.find(c => c.id === quote.customerId);
      setCustomerData(customer || null);

      const prodMap = {};
      products.forEach(product => {
        prodMap[product.id] = product;
      });
      setProductMap(prodMap);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const currentStatus = quoteData?.status || 'DRAFT';



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
          <div className="flex-grow-1 layout-content d-flex justify-content-center align-items-center">
            <Spinner animation="border" variant="primary" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !quoteData) {
    return (
      <div className="internal-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar />
          <div className="flex-grow-1 layout-content d-flex justify-content-center align-items-center">
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

        <div className="flex-grow-1 layout-content" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid className="p-4">
            <div className="rfq-detail-page">
              <div className="page-header mb-4 d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="page-title">Chi tiết Đơn hàng</h1>
                  <div className="text-muted">Mã đơn hàng: {quoteData?.quotationNumber || `ORDER-${quoteData?.id}`}</div>
                </div>
                <Button variant="outline-secondary" onClick={() => navigate('/internal/orders')}>
                  <FaArrowLeft className="me-2" />Quay lại danh sách
                </Button>
                <Button variant="primary" onClick={() => setShowContractModal(true)}>Hợp đồng</Button>
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

              <Modal show={showContractModal} onHide={() => setShowContractModal(false)} centered>
                <Modal.Header closeButton>
                  <Modal.Title>Tạo Hợp đồng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Tên Hợp đồng</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={contractName} 
                        onChange={(e) => setContractName(e.target.value)} 
                        placeholder="Nhập tên hợp đồng"
                      />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Upload File (ảnh)</Form.Label>
                      <Form.Control 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setContractFile(e.target.files[0])}
                      />
                    </Form.Group>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowContractModal(false)} disabled={submittingContract}>Hủy</Button>
                  <Button variant="primary" onClick={handleContractSubmit} disabled={submittingContract}>
                    {submittingContract ? 'Đang gửi...' : 'Gửi'}
                  </Button>
                </Modal.Footer>
              </Modal>

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
                      <h5 className="mb-0">Thông tin Đơn hàng</h5>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="info-item"><strong>Mã đơn hàng:</strong> {quoteData?.quotationNumber || `ORDER-${quoteData?.id}`}</div>
                      <div className="info-item"><strong>Ngày tạo:</strong> {formatDate(quoteData?.createdAt)}</div>
                      <div className="info-item"><strong>Ngày mong muốn nhận:</strong> {formatDate(quoteData?.expectedDeliveryDate)}</div>
                      <div className="info-item">
                        <strong>Trạng thái:</strong>
                        <Badge bg={STATUS_VARIANT[currentStatus]} className="ms-2">
                          {STATUS_LABEL[currentStatus] || currentStatus}
                        </Badge>
                      </div>
                      <div className="info-item"><strong>Số lượng sản phẩm:</strong> {quoteData?.details?.length || 0}</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>



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
                        <th style={{ width: '150px' }}>Đơn giá</th>
                        <th style={{ width: '150px' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteData?.details?.length ? (
                        quoteData.details.map((item, index) => {
                          const product = productMap[item.productId];
                          return (
                            <tr key={item.id || index}>
                              <td className="text-center">{index + 1}</td>
                              <td>{product?.name || `Sản phẩm ID: ${item.productId}`}</td>
                              <td className="text-center">{item.notes || product?.standardDimensions || '—'}</td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                              <td className="text-end fw-semibold">{formatCurrency(item.totalPrice)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">Không có dữ liệu sản phẩm</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="5" className="text-end fw-bold">Tổng cộng</td>
                        <td className="text-end fw-bold text-success">{formatCurrency(quoteData?.totalAmount)}</td>
                      </tr>
                    </tfoot>
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

export default OrderDetail;
