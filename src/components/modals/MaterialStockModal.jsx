import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { productService } from '../../api/productService';
import toast from 'react-hot-toast';
import { handleDecimalKeyPress, sanitizeNumericInput } from '../../utils/validators';

const MaterialStockModal = ({ show, onHide, onSave, materialStock = null }) => {
  const [formData, setFormData] = useState({
    materialId: '',
    quantity: '',
    unit: 'KG',
    unitPrice: '',
    location: '',
    batchNumber: '',
    receivedDate: '',
    expiryDate: ''
  });
  const [materials, setMaterials] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  useEffect(() => {
    if (show) {
      loadMaterials();
      if (materialStock) {
        setFormData({
          materialId: materialStock.materialId || '',
          quantity: materialStock.quantity || '',
          unit: materialStock.unit || 'KG',
          unitPrice: materialStock.unitPrice || '',
          location: materialStock.location || '',
          batchNumber: materialStock.batchNumber || '',
          receivedDate: materialStock.receivedDate ? materialStock.receivedDate.split('T')[0] : '',
          expiryDate: materialStock.expiryDate ? materialStock.expiryDate.split('T')[0] : ''
        });
      } else {
        setFormData({
          materialId: '',
          quantity: '',
          unit: 'KG',
          unitPrice: '',
          location: '',
          batchNumber: '',
          receivedDate: '',
          expiryDate: ''
        });
      }
      setErrors({});
    }
  }, [show, materialStock]);

  const loadMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const response = await productService.getAllMaterials();
      // Handle both array and PageResponse
      let materialsData = [];
      if (response && response.content) {
        materialsData = response.content;
      } else if (Array.isArray(response)) {
        materialsData = response;
      }
      setMaterials(materialsData.filter(m => m.isActive !== false));
    } catch (err) {
      console.error('Failed to load materials:', err);
      toast.error('Không thể tải danh sách nguyên liệu');
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize numeric fields
    let sanitizedValue = value;
    if (name === 'quantity' || name === 'unitPrice') {
      sanitizedValue = sanitizeNumericInput(value, true);
    }

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.materialId) {
      newErrors.materialId = 'Vui lòng chọn nguyên liệu';
    }

    // Validate quantity with trim
    const quantityStr = formData.quantity ? formData.quantity.toString().trim() : '';
    if (!quantityStr) {
      newErrors.quantity = 'Vui lòng nhập số lượng hợp lệ';
    } else {
      const quantityNum = parseFloat(quantityStr);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        newErrors.quantity = 'Vui lòng nhập số lượng hợp lệ';
      }
    }

    // Validate unitPrice with trim
    const unitPriceStr = formData.unitPrice ? formData.unitPrice.toString().trim() : '';
    if (!unitPriceStr) {
      newErrors.unitPrice = 'Vui lòng nhập đơn giá hợp lệ';
    } else {
      const unitPriceNum = parseFloat(unitPriceStr);
      if (isNaN(unitPriceNum) || unitPriceNum <= 0) {
        newErrors.unitPrice = 'Vui lòng nhập đơn giá hợp lệ';
      }
    }

    if (!formData.receivedDate) {
      newErrors.receivedDate = 'Vui lòng chọn ngày nhập hàng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        materialId: parseInt(formData.materialId),
        quantity: parseFloat(formData.quantity.toString().trim()),
        unit: formData.unit,
        unitPrice: parseFloat(formData.unitPrice.toString().trim()),
        location: formData.location ? formData.location.trim() : null,
        batchNumber: formData.batchNumber ? formData.batchNumber.trim() : null,
        receivedDate: formData.receivedDate || null,
        expiryDate: formData.expiryDate || null
      };

      await onSave(submitData);
    } catch (err) {
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {materialStock ? 'Chỉnh sửa nhập kho nguyên liệu' : 'Nhập kho nguyên liệu mới'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {Object.keys(errors).length > 0 && (
            <Alert variant="danger">
              <ul className="mb-0">
                {Object.values(errors).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Nguyên liệu <span style={{ color: 'red' }}>*</span>
                </Form.Label>
                <Form.Select
                  name="materialId"
                  value={formData.materialId}
                  onChange={handleChange}
                  isInvalid={!!errors.materialId}
                  disabled={loadingMaterials}
                >
                  <option value="">-- Chọn nguyên liệu --</option>
                  {materials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.code} - {material.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.materialId}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Số lượng <span style={{ color: 'red' }}>*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  inputMode="decimal"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  onKeyPress={handleDecimalKeyPress}
                  isInvalid={!!errors.quantity}
                  placeholder="Nhập số lượng"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.quantity}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Đơn vị <span style={{ color: 'red' }}>*</span>
                </Form.Label>
                <Form.Select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="KG">KG</option>
                  <option value="G">G</option>
                  <option value="M">M</option>
                  <option value="M2">M²</option>
                  <option value="L">L</option>
                  <option value="ML">ML</option>
                  <option value="UNIT">Đơn vị</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Đơn giá (VNĐ) <span style={{ color: 'red' }}>*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  inputMode="decimal"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleChange}
                  onKeyPress={handleDecimalKeyPress}
                  isInvalid={!!errors.unitPrice}
                  placeholder="Nhập đơn giá"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.unitPrice}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Số lô</Form.Label>
                <Form.Control
                  type="text"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  placeholder="Nhập số lô (nếu có)"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Vị trí kho</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Nhập vị trí kho"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Ngày nhập hàng <span style={{ color: 'red' }}>*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  name="receivedDate"
                  value={formData.receivedDate}
                  onChange={handleChange}
                  isInvalid={!!errors.receivedDate}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.receivedDate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : (materialStock ? 'Cập nhật' : 'Tạo mới')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MaterialStockModal;

