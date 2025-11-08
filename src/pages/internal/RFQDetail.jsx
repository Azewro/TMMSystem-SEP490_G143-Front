import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Badge, Form, Modal } from 'react-bootstrap';
import { FaArrowLeft, FaPaperPlane, FaClipboardCheck, FaShareSquare, FaEdit, FaTrash, FaPlus, FaSave } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { quoteService } from '../../api/quoteService';
import { productService } from '../../api/productService';
import AddProductToRfqModal from '../../components/modals/AddProductToRfqModal';
import '../../styles/RFQDetail.css';

const STATUS_LABEL = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PRELIMINARY_CHECKED: 'PRELIMINARY_CHECKED',
  FORWARDED_TO_PLANNING: 'FORWARDED_TO_PLANNING',
  RECEIVED_BY_PLANNING: 'RECEIVED_BY_PLANNING',
  QUOTED: 'QUOTED',
  REJECTED: 'REJECTED'
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

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editableRfqData, setEditableRfqData] = useState(null);
  const [deletedDetailIds, setDeletedDetailIds] = useState([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [saving, setSaving] = useState(false);


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
      setEditableRfqData(JSON.parse(JSON.stringify(rfq))); // Deep copy for editing
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
  const canEdit = ['DRAFT', 'SENT'].includes(currentStatus);

  const nextAction = useMemo(() => {
    if (!rfqData || isEditing) return null;

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
  }, [rfqData, id, isEditing]);

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

  const handleToggleEdit = () => {
    if (!isEditing) {
      setEditableRfqData(JSON.parse(JSON.stringify(rfqData))); // Reset changes on entering edit mode
      setDeletedDetailIds([]);
    }
    setIsEditing(!isEditing);
  };

  const handleDataChange = (field, value) => {
    setEditableRfqData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...editableRfqData.details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setEditableRfqData(prev => ({ ...prev, details: newDetails }));
  };

  const handleDeleteDetail = (index) => {
    const detailToDelete = editableRfqData.details[index];
    if (detailToDelete.id) {
      setDeletedDetailIds(prev => [...prev, detailToDelete.id]);
    }
    const newDetails = editableRfqData.details.filter((_, i) => i !== index);
    setEditableRfqData(prev => ({ ...prev, details: newDetails }));
  };

  const handleAddProduct = (newProduct) => {
    // newProduct comes from the modal
    const newDetail = {
      ...newProduct,
      // No ID yet, it's a new item
    };
    setEditableRfqData(prev => ({
      ...prev,
      details: [...prev.details, newDetail]
    }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Update general RFQ info (like date)
      if (editableRfqData.expectedDeliveryDate !== rfqData.expectedDeliveryDate) {
        await quoteService.updateRfq(id, {
          ...rfqData, // send original data
          expectedDeliveryDate: editableRfqData.expectedDeliveryDate
        });
      }

      // Handle deleted details
      for (const detailId of deletedDetailIds) {
        await quoteService.deleteRfqDetail(detailId);
      }

      // Handle added/updated details
      for (const detail of editableRfqData.details) {
        if (detail.id) { // Existing detail, check for updates
          const originalDetail = rfqData.details.find(d => d.id === detail.id);
          if (originalDetail && (originalDetail.quantity !== detail.quantity || originalDetail.notes !== detail.notes)) {
            await quoteService.updateRfqDetail(detail.id, detail);
          }
        } else { // New detail
          await quoteService.addRfqDetail(id, detail);
        }
      }

      setSuccess('Lưu thay đổi thành công!');
      setIsEditing(false);
      await loadRFQ(); // Reload data from server
    } catch (err) {
      setError(err.message || 'Lưu thay đổi thất bại.');
    } finally {
      setSaving(false);
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Handles both '2025-11-08T...' and '2025-11-08'
      return dateString.split('T')[0];
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

  if (error && !rfqData) {
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
                      <div className="info-item"><strong>Mã RFQ:</strong> {rfqData?.rfqNumber || `RFQ-${rfqData?.id}`}</div>
                      <div className="info-item"><strong>Ngày tạo:</strong> {formatDate(rfqData?.createdAt)}</div>
                      <div className="info-item"><strong>Ngày mong muốn nhận:</strong>
                        {isEditing ? (
                          <Form.Control
                            type="date"
                            size="sm"
                            value={formatDate(editableRfqData.expectedDeliveryDate)}
                            onChange={(e) => handleDataChange('expectedDeliveryDate', e.target.value)}
                            style={{ display: 'inline-block', width: 'auto', marginLeft: '10px' }}
                          />
                        ) : (
                          <span className="ms-2">{formatDate(rfqData?.expectedDeliveryDate)}</span>
                        )}
                      </div>
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
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Danh sách sản phẩm</h5>
                  {canEdit && (
                    isEditing ? (
                      <div>
                        <Button variant="success" size="sm" onClick={handleSaveChanges} disabled={saving}>
                          <FaSave className="me-1" /> {saving ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                        <Button variant="light" size="sm" className="ms-2" onClick={handleToggleEdit} disabled={saving}>
                          Hủy
                        </Button>
                      </div>
                    ) : (
                      <Button variant="light" size="sm" onClick={handleToggleEdit}>
                        <FaEdit className="me-1" /> Chỉnh sửa
                      </Button>
                    )
                  )}
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive className="products-table mb-0">
                    <thead className="table-header">
                      <tr>
                        <th style={{ width: '80px' }}>STT</th>
                        <th style={{ minWidth: '200px' }}>Sản phẩm</th>
                        <th style={{ width: '150px' }}>Kích thước/Ghi chú</th>
                        <th style={{ width: '120px' }}>Số lượng</th>
                        {isEditing && <th style={{ width: '100px' }}>Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {(isEditing ? editableRfqData.details : rfqData?.details)?.length ? (
                        (isEditing ? editableRfqData.details : rfqData.details).map((item, index) => {
                          const product = productMap[item.productId];
                          return (
                            <tr key={item.id || `new-${index}`}>
                              <td className="text-center">{index + 1}</td>
                              <td>{product?.name || `Sản phẩm ID: ${item.productId}`}</td>
                              <td className="text-center">
                                {isEditing ? (
                                  <Form.Control
                                    type="text"
                                    size="sm"
                                    value={item.notes}
                                    onChange={(e) => handleDetailChange(index, 'notes', e.target.value)}
                                  />
                                ) : (
                                  item.notes || product?.standardDimensions || '—'
                                )}
                              </td>
                              <td className="text-center">
                                {isEditing ? (
                                  <Form.Control
                                    type="number"
                                    size="sm"
                                    value={item.quantity}
                                    onChange={(e) => handleDetailChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                                    style={{ width: '80px', margin: 'auto' }}
                                  />
                                ) : (
                                  item.quantity
                                )}
                              </td>
                              {isEditing && (
                                <td className="text-center">
                                  <Button variant="outline-danger" size="sm" onClick={() => handleDeleteDetail(index)}>
                                    <FaTrash />
                                  </Button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={isEditing ? 5 : 4} className="text-center py-4 text-muted">Không có dữ liệu sản phẩm</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                  {isEditing && (
                    <div className="p-3">
                      <Button variant="primary" size="sm" onClick={() => setShowAddProductModal(true)}>
                        <FaPlus className="me-1" /> Thêm sản phẩm
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Container>
        </div>
      </div>
      <AddProductToRfqModal
        show={showAddProductModal}
        onHide={() => setShowAddProductModal(false)}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
};

export default RFQDetail;
