import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { customerService } from '../../api/customerService';
import toast from 'react-hot-toast';
import { isVietnamesePhoneNumber } from '../../utils/validators';

const ConfirmOrderProfileModal = ({ show, onHide, onConfirm }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phoneNumber: '',
    address: '',
    taxCode: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      loadProfile();
    }
  }, [show, currentUser]);

  const loadProfile = async () => {
    if (!currentUser?.customerId) {
      setError('Không tìm thấy thông tin khách hàng.');
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    setError('');
    try {
      const customer = await customerService.getCustomerById(currentUser.customerId);
      setFormData({
        companyName: customer.companyName || '',
        contactPerson: customer.contactPerson || '',
        email: customer.email || '',
        phoneNumber: customer.phoneNumber || '',
        address: customer.address || '',
        taxCode: customer.taxCode || ''
      });
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
    if (!formData.companyName) newErrors.companyName = 'Tên công ty là bắt buộc';
    if (!formData.contactPerson) newErrors.contactPerson = 'Người liên hệ là bắt buộc';
    if (!formData.address) newErrors.address = 'Địa chỉ là bắt buộc';
    if (!formData.taxCode) newErrors.taxCode = 'Mã số thuế là bắt buộc';
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) { // Fixed regex
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    } else if (!isVietnamesePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Step 1: Update customer profile
      await customerService.updateCustomer(currentUser.customerId, {
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        taxCode: formData.taxCode,
        // Removed position
      });
      toast.success('Cập nhật thông tin thành công!');

      // Step 2: Trigger the order creation process from parent
      if (onConfirm) {
        onConfirm();
      }
      
      // Step 3: Close the modal
      onHide();

    } catch (err) {
      const errorMessage = err.message || 'Có lỗi xảy ra khi cập nhật';
      if (errorMessage.includes('Email')) {
        setErrors({ email: 'Email đã được sử dụng' });
      } else if (errorMessage.includes('phone')) {
        setErrors({ phoneNumber: 'Số điện thoại đã được sử dụng' });
      } else {
        setError(errorMessage);
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Xác nhận thông tin và tạo đơn hàng</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleConfirm}>
        <Modal.Body>
          {loadingData ? (
            <div className="text-center py-5"><Spinner /></div>
          ) : (
            <>
              {error && <Alert variant="danger">{error}</Alert>}
              <p className="mb-3">Vui lòng kiểm tra và cập nhật thông tin chính xác để tiến hành tạo hợp đồng.</p>
              
              <Form.Group className="mb-3">
                <Form.Label>Tên công ty <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  isInvalid={!!errors.companyName}
                />
                <Form.Control.Feedback type="invalid">{errors.companyName}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Người liên hệ <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  isInvalid={!!errors.contactPerson}
                />
                <Form.Control.Feedback type="invalid">{errors.contactPerson}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  isInvalid={!!errors.phoneNumber}
                />
                <Form.Control.Feedback type="invalid">{errors.phoneNumber}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Địa chỉ <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  isInvalid={!!errors.address}
                />
                <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Mã số thuế <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="taxCode"
                  value={formData.taxCode}
                  onChange={handleChange}
                  isInvalid={!!errors.taxCode}
                />
                <Form.Control.Feedback type="invalid">{errors.taxCode}</Form.Control.Feedback>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Đang xử lý...</> : 'Xác nhận & Tạo Đơn Hàng'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ConfirmOrderProfileModal;