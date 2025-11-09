import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Spinner, Alert, Table, Row, Col, Form, Badge } from 'react-bootstrap';
import { rfqService } from '../../api/rfqService';
import { quoteService } from '../../api/quoteService'; // Using quoteService for general updates
import { productService } from '../../api/productService';
import { customerService } from '../../api/customerService';
import toast from 'react-hot-toast';

const CustomerRfqDetailModal = ({ rfqId, show, handleClose }) => {
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedRfq, setEditedRfq] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [newProductId, setNewProductId] = useState('');

  const fetchRfqDetails = useCallback(async () => {
    if (!rfqId || !show) return;
    setLoading(true);
    setError('');
    try {
      const rfqData = await rfqService.getRfqById(rfqId);
      let customerData = null;
      if (rfqData.customerId) {
        customerData = await customerService.getCustomerById(rfqData.customerId);
      }

      const details = rfqData.details || [];
      let enrichedDetails = [];
      if (details.length > 0) {
        const productPromises = details.map(item => productService.getProductById(item.productId).catch(() => null));
        const products = await Promise.all(productPromises);
        enrichedDetails = details.map((item, index) => ({
          ...item,
          productName: products[index]?.name || 'Sản phẩm không xác định',
          productCode: products[index]?.code,
          standardDimensions: products[index]?.standardDimensions,
        }));
      }
      
      const finalState = { 
        ...rfqData, 
        rfqDetails: enrichedDetails,
        // Populate contact info with fallback to customer data
        contactPerson: rfqData.contactPerson || customerData?.contactPerson || '',
        contactEmail: rfqData.contactEmail || customerData?.email || '',
        contactPhone: rfqData.contactPhone || customerData?.phoneNumber || '',
        contactAddress: rfqData.contactAddress || customerData?.address || '',
      };

      setRfq(finalState);
      setEditedRfq(JSON.parse(JSON.stringify(finalState))); // Deep copy for editing

    } catch (err) {
      setError('Lỗi khi tải chi tiết RFQ.');
      toast.error('Lỗi khi tải chi tiết RFQ.');
    } finally {
      setLoading(false);
    }
  }, [rfqId, show]);

  useEffect(() => {
    fetchRfqDetails();
  }, [fetchRfqDetails]);

  const handleEditToggle = async (edit) => {
    setIsEditMode(edit);
    if (edit && allProducts.length === 0) {
      setEditLoading(true);
      try {
        const products = await productService.getAllProducts();
        setAllProducts(products);
      } catch (error) {
        toast.error("Lỗi khi tải danh sách sản phẩm.");
      } finally {
        setEditLoading(false);
      }
    }
    if (!edit) {
      setEditedRfq(JSON.parse(JSON.stringify(rfq))); // Reset changes on cancel
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedRfq(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...editedRfq.rfqDetails];
    const newQuantity = field === 'quantity' ? Math.max(1, parseInt(value, 10) || 1) : value;
    updatedDetails[index] = { ...updatedDetails[index], [field]: newQuantity };
    setEditedRfq(prev => ({ ...prev, rfqDetails: updatedDetails }));
  };

  const handleDeleteDetail = (index) => {
    const updatedDetails = editedRfq.rfqDetails.filter((_, i) => i !== index);
    setEditedRfq(prev => ({ ...prev, rfqDetails: updatedDetails }));
  };

  const handleAddDetail = () => {
    if (!newProductId) {
      toast.error("Vui lòng chọn một sản phẩm.");
      return;
    }
    const productToAdd = allProducts.find(p => p.id === parseInt(newProductId));
    if (editedRfq.rfqDetails.some(d => d.productId === productToAdd.id)) {
      toast.error("Sản phẩm đã có trong danh sách.");
      return;
    }
    const newDetail = {
      id: `new-${Date.now()}`, // Temporary unique ID for new items
      productId: productToAdd.id,
      productName: productToAdd.name,
      productCode: productToAdd.code,
      standardDimensions: productToAdd.standardDimensions,
      quantity: 1,
      unit: productToAdd.unit || 'cái',
    };
    setEditedRfq(prev => ({ ...prev, rfqDetails: [...prev.rfqDetails, newDetail] }));
    setNewProductId('');
  };

  const handleSave = async () => {
    setEditLoading(true);
    try {
      // Based on user-provided schema, the API expects the full DTO, including details.
      // The API documentation was misleading.
      const payload = {
        ...editedRfq, // Start with the full object from state
        details: editedRfq.rfqDetails.map(({ id, productId, quantity, unit, notes, noteColor }) => ({
          id: typeof id === 'string' && id.startsWith('new-') ? 0 : id, // Send 0 for new items as per schema
          productId,
          quantity: parseInt(quantity, 10) || 0,
          unit: unit || 'cái',
          noteColor: noteColor || null,
          notes: notes || ''
        }))
      };
      
      // Remove the frontend-only enriched property before sending
      delete payload.rfqDetails;

      await quoteService.updateRfq(rfqId, payload);
      
      toast.success("Cập nhật yêu cầu thành công!");
      setIsEditMode(false);
      fetchRfqDetails(); // Re-fetch to get the canonical state from the server.

    } catch (error) {
      console.error("Failed to update RFQ. Payload:", error.request?.data, "Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Cập nhật yêu cầu thất bại.");
    } finally {
      setEditLoading(false);
    }
  };

  const renderBody = () => {
    if (loading) {
        return <div className="text-center"><Spinner animation="border" /></div>;
    }
    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }
    if (!rfq) {
        return <Alert variant="warning">Không tìm thấy dữ liệu RFQ.</Alert>;
    }

    const data = isEditMode ? editedRfq : rfq;
    const dateValue = data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString().split('T')[0] : '';

    return (
        <>
            {/* Unified Info Section */}
            <div className="mb-4">
                <h5>Thông tin Yêu cầu</h5>
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
                            <Form.Control type="text" value={data.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : 'N/A'} readOnly />
                        </Form.Group>
                    </Col>
                    <Col md={6} className="mt-2">
                        <Form.Group>
                            <Form.Label>Mã nhân viên Sale</Form.Label>
                            <Form.Control type="text" value={data.employeeCode || 'N/A'} readOnly />
                        </Form.Group>
                    </Col>
                     <Col md={6} className="mt-2">
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
                    <Col md={12} className="mt-2">
                        <Form.Group>
                            <Form.Label>Ghi chú chung</Form.Label>
                            <Form.Control as="textarea" name="notes" value={data.notes || ''} onChange={handleInputChange} readOnly={!isEditMode} />
                        </Form.Group>
                    </Col>
                </Row>
            </div>

            {/* Product Info */}
            <div className="mb-4">
                <h5>Sản phẩm yêu cầu</h5>
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Tên sản phẩm</th>
                            <th>Kích thước</th>
                            <th>Số lượng</th>
                            {isEditMode && <th>Hành động</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.rfqDetails.map((item, index) => (
                            <tr key={item.id || `item-${index}`}>
                                <td>{item.productName}</td>
                                <td>
                                  {item.notes || item.standardDimensions || 'N/A'}
                                </td>
                                <td>
                                    <Form.Control
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleDetailChange(index, 'quantity', e.target.value)}
                                        readOnly={!isEditMode}
                                        min="1"
                                        style={{ width: '80px' }}
                                    />
                                </td>
                                {isEditMode && (
                                    <td className="text-center">
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteDetail(index)}>Xóa</Button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </Table>
                {isEditMode && (
                    <Row className="mt-3">
                        <Col md={8}>
                            <Form.Select value={newProductId} onChange={(e) => setNewProductId(e.target.value)}>
                                <option value="">Thêm sản phẩm...</option>
                                {allProducts.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4} className="d-flex align-items-end">
                            <Button onClick={handleAddDetail} disabled={editLoading}>Thêm</Button>
                        </Col>
                    </Row>
                )}
            </div>
        </>
    );
  }

  return (
    <Modal show={show} onHide={() => handleClose(false)} size="lg" backdrop="static">
      <Modal.Header closeButton={!isEditMode}>
        <Modal.Title>
          Chi tiết Yêu cầu Báo giá #{rfqId}
          {rfq?.status && <Badge bg="info" className="ms-3">{rfq.status}</Badge>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {renderBody()}
      </Modal.Body>
      <Modal.Footer>
        {isEditMode ? (
          <>
            <Button variant="secondary" onClick={() => handleEditToggle(false)} disabled={editLoading}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={editLoading}>
              {editLoading ? <><Spinner as="span" animation="border" size="sm" /> Đang lưu...</> : 'Lưu thay đổi'}
            </Button>
          </>
        ) : (
          <>
            {rfq?.status === 'DRAFT' && (
              <Button variant="outline-primary" onClick={() => handleEditToggle(true)}>
                Sửa Yêu Cầu
              </Button>
            )}
            <div className="flex-grow-1"></div>
            <Button variant="secondary" onClick={() => handleClose(false)}>
              Đóng
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CustomerRfqDetailModal;
