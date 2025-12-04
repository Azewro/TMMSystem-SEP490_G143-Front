import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { isVietnamesePhoneNumber } from '../../utils/validators';

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

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validateTaxCode = (taxCode) => {
    if (!taxCode) return true; // Optional field
    // Mã số thuế thường có 10 hoặc 13 chữ số
    return /^[0-9]{10,13}$/.test(taxCode);
  };

  const validateContactPerson = (name) => {
    if (!name) return false;
    // Check for special characters like @@@ or ###
    const specialCharPattern = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    return !specialCharPattern.test(name);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.companyName || !formData.companyName.trim()) {
      newErrors.companyName = 'Tên công ty là bắt buộc';
    }

    if (!formData.contactPerson || !formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Người liên hệ là bắt buộc';
    } else if (!validateContactPerson(formData.contactPerson.trim())) {
      newErrors.contactPerson = 'Tên người liên hệ không hợp lệ.';
    }

    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = 'Email không hợp lệ.';
    }

    if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    } else if (!isVietnamesePhoneNumber(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ.';
    }

    if (formData.taxCode && !validateTaxCode(formData.taxCode)) {
      newErrors.taxCode = 'Mã số thuế không hợp lệ.';
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
      const errorMessage = error.message || 'Có lỗi xảy ra';
      // Check for specific error messages
      if (errorMessage.toLowerCase().includes('email đã được sử dụng') ||
        errorMessage.toLowerCase().includes('email already') ||
        errorMessage.toLowerCase().includes('email đã được sử dụng bởi khách hàng khác')) {
        setErrors(prev => ({ ...prev, email: 'Email này đã được sử dụng.' }));
      } else if (errorMessage.toLowerCase().includes('số điện thoại đã được sử dụng') ||
        errorMessage.toLowerCase().includes('phone number already') ||
        errorMessage.toLowerCase().includes('số điện thoại đã được sử dụng bởi khách hàng khác')) {
        setErrors(prev => ({ ...prev, phoneNumber: 'Số điện thoại đã tồn tại trong hệ thống.' }));
      } else {
        setErrors(prev => ({ ...prev, _general: errorMessage }));
      }
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
          {errors._general && (
            <Alert variant="danger" className="mb-3">
              {errors._general}
            </Alert>
          )}
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
            {errors.companyName && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.companyName}
              </Form.Control.Feedback>
            )}
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
            {errors.contactPerson && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.contactPerson}
              </Form.Control.Feedback>
            )}
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
            {errors.email && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.email}
              </Form.Control.Feedback>
            )}
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
            {errors.phoneNumber && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.phoneNumber}
              </Form.Control.Feedback>
            )}
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
              isInvalid={!!errors.taxCode}
              placeholder="Nhập mã số thuế"
              readOnly={isReadOnly}
              disabled={isReadOnly}
            />
            {errors.taxCode && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.taxCode}
              </Form.Control.Feedback>
            )}
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
