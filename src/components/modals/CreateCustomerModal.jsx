import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const CreateCustomerModal = ({ show, onHide, onSave, customer = null, mode = 'create', readOnly: forceReadOnly = false }) => {
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phoneNumber: '',
    position: '',
    address: '',
    taxCode: '',
    isActive: true,
    isVerified: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      if (customer) {
        setFormData({
          companyName: customer.companyName || '',
          contactPerson: customer.contactPerson || '',
          email: customer.email || '',
          phoneNumber: customer.phoneNumber || '',
          position: customer.position || '',
          address: customer.address || '',
          taxCode: customer.taxCode || '',
          isActive: customer.isActive !== undefined ? customer.isActive : true,
          isVerified: customer.isVerified !== undefined ? customer.isVerified : false
        });
        setIsEditMode(mode === 'edit' && !forceReadOnly);
      } else {
        setFormData({
          companyName: '',
          contactPerson: '',
          email: '',
          phoneNumber: '',
          position: '',
          address: '',
          taxCode: '',
          isActive: true,
          isVerified: false
        });
        setIsEditMode(true);
      }
      setErrors({});
    }
  }, [show, customer, mode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    
    if (!formData.companyName) {
      newErrors.companyName = 'Tên công ty là bắt buộc';
    }

    if (!formData.contactPerson) {
      newErrors.contactPerson = 'Người liên hệ là bắt buộc';
    }

    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
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
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        position: formData.position,
        address: formData.address,
        taxCode: formData.taxCode,
        isActive: formData.isActive,
        isVerified: formData.isVerified
      };

      if (!customer && user?.id) {
        submitData.createdById = user.id;
      }

      await onSave(submitData);
      if (customer) {
        setIsEditMode(false);
      } else {
        handleClose();
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      email: '',
      phoneNumber: '',
      position: '',
      address: '',
      taxCode: '',
      isActive: true,
      isVerified: false
    });
    setErrors({});
    setIsEditMode(false);
    onHide();
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditMode(true);
  };

  const isReadOnly = forceReadOnly || (customer && !isEditMode);

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg"
      centered
      style={{ maxHeight: '90vh' }}
    >
      <Modal.Header closeButton style={{ borderBottom: '1px solid #dee2e6' }}>
        <Modal.Title>
          {isReadOnly ? 'Chi tiết khách hàng' : customer ? 'Chỉnh sửa khách hàng' : 'Tạo khách hàng mới'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', padding: '1.5rem' }}>
          <Form.Group className="mb-3">
            <Form.Label>
              Tên công ty <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              isInvalid={!!errors.companyName}
              placeholder="Nhập tên công ty"
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.companyName}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Người liên hệ <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              isInvalid={!!errors.contactPerson}
              placeholder="Nhập tên người liên hệ"
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.contactPerson}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Email <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isInvalid={!!errors.email}
              placeholder="email@example.com"
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Số điện thoại <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              isInvalid={!!errors.phoneNumber}
              placeholder="0123456789"
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
            <Form.Control.Feedback type="invalid">
              {errors.phoneNumber}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Vị trí</Form.Label>
            <Form.Control
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="Ví dụ: Giám đốc, Sales, HR, ..."
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Địa chỉ</Form.Label>
            <Form.Control
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Nhập địa chỉ"
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mã số thuế</Form.Label>
            <Form.Control
              type="text"
              name="taxCode"
              value={formData.taxCode}
              onChange={handleChange}
              placeholder="Nhập mã số thuế"
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Trạng thái</Form.Label>
            <Form.Select
              name="isActive"
              value={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
              disabled={isReadOnly}
            >
              <option value={true}>Active</option>
              <option value={false}>De-active</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #dee2e6' }}>
          {isReadOnly ? (
            <>
              <Button variant="secondary" onClick={handleClose} type="button">
                Đóng
              </Button>
              {!forceReadOnly && (
                <Button variant="primary" onClick={handleEditClick} type="button">
                  Sửa
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleClose} disabled={loading} type="button">
                {customer ? 'Hủy' : 'Đóng'}
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Đang lưu...' : (customer ? 'Cập nhật' : 'Tạo khách hàng')}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateCustomerModal;
