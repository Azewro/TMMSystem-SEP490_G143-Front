import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../api/userService';
import { customerService } from '../../api/customerService';
import { authService } from '../../api/authService';
import toast from 'react-hot-toast';

const ProfileModal = ({ show, onHide, onSave }) => {
  const { user: currentUser } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    position: '',
    companyName: '',
    contactPerson: '',
    address: '',
    taxCode: '',
    employeeCode: ''
  });
  const [errors, setErrors] = useState({});

  const isCustomer = currentUser?.role === 'CUSTOMER';

  useEffect(() => {
    if (show) {
      loadProfile();
      setIsEditMode(false);
    }
  }, [show]);

  const loadProfile = async () => {
    setLoadingData(true);
    setError('');
    try {
      if (isCustomer) {
        // Load customer profile - use getCustomerById to get full data including position
        const customerId = currentUser?.customerId || currentUser?.id;
        if (customerId) {
          const customer = await customerService.getCustomerById(customerId);
          setFormData({
            name: customer.contactPerson || '',
            email: customer.email || '',
            phoneNumber: customer.phoneNumber || '',
            position: customer.position || '',
            companyName: customer.companyName || '',
            contactPerson: customer.contactPerson || '',
            address: customer.address || '',
            taxCode: customer.taxCode || ''
          });
        } else {
          // Fallback to profile API if no customerId
          const profile = await authService.getCustomerProfile();
          setFormData({
            name: profile.contactPerson || '',
            email: profile.email || '',
            phoneNumber: profile.phoneNumber || '',
            position: profile.position || '',
            companyName: profile.companyName || '',
            contactPerson: profile.contactPerson || '',
            address: profile.address || '',
            taxCode: profile.taxCode || ''
          });
        }
      } else {
        // Load user profile
        const userId = currentUser?.userId || currentUser?.id;
        if (userId) {
          const user = await userService.getUserById(userId);
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            position: '',
            companyName: '',
            contactPerson: '',
            address: '',
            taxCode: '',
            employeeCode: user.employeeCode || ''
          });
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Không thể tải thông tin cá nhân');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    if (isCustomer) {
      if (!formData.companyName) {
        newErrors.companyName = 'Tên công ty là bắt buộc';
      }
      if (!formData.contactPerson) {
        newErrors.contactPerson = 'Người liên hệ là bắt buộc';
      }
    } else {
      if (!formData.name) {
        newErrors.name = 'Họ và tên là bắt buộc';
      }
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
    setError('');
    try {
      if (isCustomer) {
        const customerId = currentUser?.customerId || currentUser?.id;
        await customerService.updateCustomer(customerId, {
          companyName: formData.companyName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          taxCode: formData.taxCode,
          position: formData.position
        });
        // Update session storage cache
        if (formData.contactPerson) {
          sessionStorage.setItem('userName', formData.contactPerson);
        }
        if (formData.email) {
          sessionStorage.setItem('userEmail', formData.email);
        }
        toast.success('Cập nhật thông tin thành công');
      } else {
        const userId = currentUser?.userId || currentUser?.id;
        await userService.updateUser(userId, {
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber
        });
        // Update session storage cache
        if (formData.name) {
          sessionStorage.setItem('userName', formData.name);
        }
        if (formData.email) {
          sessionStorage.setItem('userEmail', formData.email);
        }
        toast.success('Cập nhật thông tin thành công');
      }
      setIsEditMode(false);
      await loadProfile();
      if (onSave) {
        onSave();
      }
      handleClose();
    } catch (err) {
      const errorMessage = err.message || 'Có lỗi xảy ra khi cập nhật';
      // Check for duplicate email/phone errors
      if (errorMessage.includes('Email đã được sử dụng') || errorMessage.includes('email')) {
        setErrors({ email: 'Email đã được sử dụng bởi khách hàng khác' });
      } else if (errorMessage.includes('Số điện thoại đã được sử dụng') || errorMessage.includes('phone')) {
        setErrors({ phoneNumber: 'Số điện thoại đã được sử dụng bởi khách hàng khác' });
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditMode(false);
    setErrors({});
    setError('');
    onHide();
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditMode(true);
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg"
      centered
      style={{ maxHeight: '90vh' }}
    >
      <Modal.Header closeButton style={{ borderBottom: '1px solid #dee2e6' }}>
        <Modal.Title>Thông tin cá nhân</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', padding: '1.5rem' }}>
          {loadingData ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm me-2"></div>
              Đang tải thông tin...
            </div>
          ) : (
            <>
              {error && <Alert variant="danger">{error}</Alert>}

              {isCustomer ? (
                <>
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
                      readOnly={!isEditMode}
                      disabled={!isEditMode}
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
                      readOnly={!isEditMode}
                      disabled={!isEditMode}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.contactPerson}
                    </Form.Control.Feedback>
                  </Form.Group>
                </>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>
                    Họ và tên <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    isInvalid={!!errors.name}
                    readOnly={!isEditMode}
                    disabled={!isEditMode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              )}

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
                  readOnly={!isEditMode}
                  disabled={!isEditMode}
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
                  readOnly={!isEditMode}
                  disabled={!isEditMode}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.phoneNumber}
                </Form.Control.Feedback>
              </Form.Group>

              {!isCustomer && formData.employeeCode && (
                <Form.Group className="mb-3">
                  <Form.Label>Mã nhân viên</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.employeeCode}
                    readOnly
                    disabled
                  />
                </Form.Group>
              )}

              {isCustomer && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Chức vụ</Form.Label>
                    <Form.Control
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      placeholder="Ví dụ: Giám đốc, Sales, HR, ..."
                      readOnly={!isEditMode}
                      disabled={!isEditMode}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Địa chỉ</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      readOnly={!isEditMode}
                      disabled={!isEditMode}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Mã số thuế</Form.Label>
                    <Form.Control
                      type="text"
                      name="taxCode"
                      value={formData.taxCode}
                      onChange={handleChange}
                      readOnly={!isEditMode}
                      disabled={!isEditMode}
                    />
                  </Form.Group>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #dee2e6' }}>
          {loadingData ? null : isEditMode ? (
            <>
              <Button variant="secondary" onClick={handleClose} disabled={loading} type="button">
                Hủy
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Cập nhật'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleClose} type="button">
                Đóng
              </Button>
              <Button variant="primary" onClick={handleEditClick} type="button">
                Sửa
              </Button>
            </>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProfileModal;
