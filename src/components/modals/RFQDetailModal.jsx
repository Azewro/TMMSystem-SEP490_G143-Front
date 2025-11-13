import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Spinner, Alert, Table, Row, Col, Form, Badge } from 'react-bootstrap';
import { rfqService } from '../../api/rfqService';
import { customerService } from '../../api/customerService';
import { productService } from '../../api/productService';
import toast from 'react-hot-toast';

const RFQDetailModal = ({ rfqId, show, handleClose }) => {
  const [rfq, setRfq] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedRfq, setEditedRfq] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [newProductId, setNewProductId] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false); // New state for cancel button

  const handleCancelRfq = async () => {
    if (!rfqId) return;
    if (!window.confirm('Bạn có chắc chắn muốn hủy RFQ này? Hành động này không thể hoàn tác.')) {
      return;
    }

    setCancelLoading(true);
    try {
      await rfqService.deleteRfq(rfqId);
      toast.success('RFQ đã được hủy thành công!');
      handleClose(true); // Close modal and refresh list
    } catch (error) {
      toast.error(error.message || 'Lỗi khi hủy RFQ.');
      console.error('Failed to cancel RFQ', error);
    } finally {
      setCancelLoading(false);
    }
  };

  const fetchRfqDetails = useCallback(async () => {
    if (!rfqId || !show) return;
    setLoading(true);
    setError('');
    try {
      const rfqData = await rfqService.getRfqById(rfqId);
      let customerData = null;
      if (rfqData.customerId) {
        customerData = await customerService.getCustomerById(rfqData.customerId);
        setCustomer(customerData);
      }

      const initialFormState = {
        ...rfqData,
        contactPerson: rfqData.contactPerson || customerData?.contactPerson || '',
        contactEmail: rfqData.contactEmail || customerData?.email || '',
        contactPhone: rfqData.contactPhone || customerData?.phoneNumber || '',
        contactAddress: rfqData.contactAddress || customerData?.address || '',
      };

      const details = rfqData.details || [];
      let enrichedDetails = [];
      if (details.length > 0) {
        const productPromises = details.map(item => productService.getProductById(item.productId));
        const products = await Promise.all(productPromises);
        enrichedDetails = details.map((item, index) => ({
          ...item,
          productName: products[index].name,
          productCode: products[index].code,
          standardDimensions: products[index].standardDimensions,
        }));
      }
      
      const finalState = { ...initialFormState, rfqDetails: enrichedDetails };
      setRfq(finalState);
      setEditedRfq(finalState);

    } catch (err) {
      setError('Lỗi khi tải chi tiết RFQ.');
      toast.error('Lỗi khi tải chi tiết RFQ.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [rfqId, show]);

  useEffect(() => {
    fetchRfqDetails();
  }, [fetchRfqDetails]);

  const handleSend = async () => {
    setSendLoading(true);
    try {
      await rfqService.sendRfq(rfqId);
      toast.success('Yêu cầu đã được gửi thành công!');
      fetchRfqDetails(); // Refresh data to get new status
    } catch (error) {
      toast.error(error.message || 'Lỗi khi gửi yêu cầu.');
      console.error('Failed to send RFQ', error);
    } finally {
      setSendLoading(false);
    }
  };

  const handleEditToggle = async (edit) => {
    setIsEditMode(edit);
    if (edit && allProducts.length === 0) {
      setEditLoading(true);
      try {
        const products = await productService.getAllProducts();
        setAllProducts(products);
      } catch (error) {
        toast.error("Failed to load products for editing.");
      } finally {
        setEditLoading(false);
      }
    }
    if (!edit) {
      setEditedRfq(rfq); // Reset changes on cancel
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedRfq(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...editedRfq.rfqDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setEditedRfq(prev => ({ ...prev, rfqDetails: updatedDetails }));
  };

  const handleDeleteDetail = (index) => {
    const updatedDetails = editedRfq.rfqDetails.filter((_, i) => i !== index);
    setEditedRfq(prev => ({ ...prev, rfqDetails: updatedDetails }));
  };

  const handleAddDetail = () => {
    if (!newProductId) {
      toast.error("Please select a product to add.");
      return;
    }
    const productToAdd = allProducts.find(p => p.id === parseInt(newProductId));
    if (editedRfq.rfqDetails.some(d => d.productId === productToAdd.id)) {
      toast.error("Product already in the list.");
      return;
    }
    const newDetail = {
      productId: productToAdd.id,
      productName: productToAdd.name,
      productCode: productToAdd.code,
      standardDimensions: productToAdd.standardDimensions, // Add standardDimensions for new product
      quantity: 1, // Default quantity
      unit: productToAdd.unit,
    };
    setEditedRfq(prev => ({ ...prev, rfqDetails: [...prev.rfqDetails, newDetail] }));
    setNewProductId('');
  };

  const handleSave = async () => {
    setEditLoading(true);
    try {
      const payload = {
        contactPerson: editedRfq.contactPerson,
        contactEmail: editedRfq.contactEmail,
        contactPhone: editedRfq.contactPhone,
        contactAddress: editedRfq.contactAddress,
        notes: editedRfq.notes,
        expectedDeliveryDate: editedRfq.expectedDeliveryDate,
        details: editedRfq.rfqDetails.map(({ id, productId, quantity, unit, noteColor, notes }) => ({
          id: typeof id === 'string' && id.startsWith('new-') ? null : id, // Send null for new items
          productId, quantity, unit, noteColor, notes
        })),
      };
      await rfqService.salesEditRfq(rfqId, payload);
      toast.success("RFQ updated successfully!");
      setIsEditMode(false);
      fetchRfqDetails(); // Refresh data
    } catch (error) {
      toast.error(error.message || "Failed to update RFQ.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      // Step 1: Preliminary check
      await rfqService.confirmRfq(rfqId, 'Yêu cầu đã được sale xác nhận.');
      
      // Step 2: Forward to planning
      await rfqService.forwardRfqToPlanning(rfqId);

      toast.success('Yêu cầu đã được xác nhận và chuyển cho bộ phận Kế hoạch!');
      handleClose(true); // Close modal and refresh list
    } catch (error) {
      toast.error(error.message || 'Lỗi khi xử lý yêu cầu.');
      console.error('Failed to confirm and forward RFQ', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const renderCustomerInfo = () => {
    if (!editedRfq) return null;
    const data = isEditMode ? editedRfq : rfq;

    return (
      <div className="mb-4">
        <h5>Thông tin khách hàng</h5>
        <Row>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Họ tên</Form.Label>
              <Form.Control type="text" name="contactPerson" value={data.contactPerson || ''} onChange={handleInputChange} readOnly={!isEditMode} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control type="text" name="contactPhone" value={data.contactPhone || ''} onChange={handleInputChange} readOnly={!isEditMode} />
            </Form.Group>
          </Col>
          <Col md={6} className="mt-2">
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" name="contactEmail" value={data.contactEmail || ''} onChange={handleInputChange} readOnly={!isEditMode} />
            </Form.Group>
          </Col>
          <Col md={6} className="mt-2">
            <Form.Group>
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control type="text" name="contactAddress" value={data.contactAddress || ''} onChange={handleInputChange} readOnly={!isEditMode} />
            </Form.Group>
          </Col>
          <Col md={6} className="mt-2">
            <Form.Group>
              <Form.Label>Ngày tạo</Form.Label>
              <Form.Control type="text" value={data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A'} readOnly />
            </Form.Group>
          </Col>
          <Col md={6} className="mt-2">
            <Form.Group>
              <Form.Label>Mã nhân viên Sale</Form.Label>
              <Form.Control type="text" value={data.employeeCode || 'N/A'} readOnly />
            </Form.Group>
          </Col>
          <Col md={12} className="mt-2">
            <Form.Group>
              <Form.Label>Ghi chú</Form.Label>
              <Form.Control as="textarea" name="notes" value={data.notes || ''} onChange={handleInputChange} readOnly={!isEditMode} />
            </Form.Group>
          </Col>
        </Row>
      </div>
    );
  };

  const renderProductInfo = () => {
    if (!editedRfq || !editedRfq.rfqDetails) return null;

    return (
      <div className="mb-4">
        <h5>Sản phẩm yêu cầu</h5>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Tên sản phẩm</th>
              <th>Mã</th>
              <th>Kích thước</th>
              <th>Số lượng</th>
              {isEditMode ? <th>Hành động</th> : null}
            </tr>
          </thead>
          <tbody>
            {editedRfq.rfqDetails.map((item, index) => (
              <tr key={item.id || `new-${index}`}>
                <td>{item.productName}</td>
                <td>{item.productCode || 'N/A'}</td>
                <td>{item.standardDimensions || 'N/A'}</td> {/* Display standardDimensions */}
                <td>
                  <Form.Control
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleDetailChange(index, 'quantity', parseInt(e.target.value))}
                    readOnly={!isEditMode}
                    min="1"
                  />
                </td>
                {isEditMode ? (
                  <td>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteDetail(index)}>Xóa</Button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </Table>
        {isEditMode && (
          <Row className="mt-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label>Thêm sản phẩm</Form.Label>
                <Form.Select value={newProductId} onChange={(e) => setNewProductId(e.target.value)}>
                  <option value="">Chọn sản phẩm...</option>
                  {allProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button onClick={handleAddDetail} disabled={editLoading}>Thêm</Button>
            </Col>
          </Row>
        )}
      </div>
    );
  };

  const renderDeliveryInfo = () => {
    if (!editedRfq) return null;
    const data = isEditMode ? editedRfq : rfq;
    // Format date for input type="date" which requires YYYY-MM-DD
    const dateValue = data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString().split('T')[0] : '';

    return (
      <div className="mb-4">
        <h5>Thông tin giao hàng</h5>
        <Row>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Thời gian giao mong muốn</Form.Label>
              <Form.Control
                type="date"
                name="expectedDeliveryDate"
                value={dateValue}
                onChange={handleInputChange}
                readOnly={!isEditMode}
              />
            </Form.Group>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={() => handleClose(false)} size="lg" backdrop="static">
      <Modal.Header closeButton={!isEditMode}>
        <Modal.Title>
          Chi tiết RFQ #{rfqId}
          {rfq?.status && <Badge bg="info" className="ms-3">{rfq.status}</Badge>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {(loading || editLoading) && <div className="text-center"><Spinner animation="border" /></div>}
        {!loading && error && <Alert variant="danger">{error}</Alert>}
        {!loading && !error && rfq && (
          <>
            {renderCustomerInfo()}
            {renderProductInfo()}
            {renderDeliveryInfo()}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {isEditMode ? (
          <>
            <Button variant="secondary" onClick={() => handleEditToggle(false)} disabled={editLoading}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={editLoading}>
              {editLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Lưu thay đổi'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline-primary" onClick={() => handleEditToggle(true)}>
              Sửa RFQ
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelRfq}
              disabled={cancelLoading || (rfq?.status !== 'DRAFT' && rfq?.status !== 'SENT')}
            >
              {cancelLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Hủy RFQ'}
            </Button>
            <div className="flex-grow-1"></div>
            <Button variant="secondary" onClick={() => handleClose(false)}>
              Đóng
            </Button>
            
            {rfq?.status === 'DRAFT' && (
              <Button variant="success" onClick={handleSend} disabled={sendLoading}>
                {sendLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Gửi Yêu Cầu'}
              </Button>
            )}

            <Button variant="primary" onClick={handleConfirm} disabled={loading || rfq?.status !== 'SENT' || confirmLoading}>
              {confirmLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Xác nhận và Gửi đi'}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default RFQDetailModal;
