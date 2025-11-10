import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../api/authService';
import toast from 'react-hot-toast';

const ChangePasswordModal = ({ show, onHide }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCustomer = user?.role === 'CUSTOMER';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Clear general error
    if (error) {
      setError('');
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Mật khẩu hiện tại không được để trống.';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới không được để trống.';
    } else {
      const hasUppercase = /[A-Z]/.test(formData.newPassword);
      const hasDigit = /\d/.test(formData.newPassword);
      const hasWhitespace = /\s/.test(formData.newPassword);

      if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
      } else if (hasWhitespace) {
        newErrors.newPassword = 'Mật khẩu không được chứa khoảng trắng';
      } else if (!(hasUppercase && hasDigit)) {
        newErrors.newPassword = 'Mật khẩu phải chứa ít nhất 1 chữ số và 1 chữ in hoa';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu hiện tại.';
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
      const email = user?.email || user?.userEmail;
      if (!email) {
        throw new Error('Không tìm thấy email');
      }

      if (isCustomer) {
        await authService.changeCustomerPassword(email, formData.currentPassword, formData.newPassword);
      } else {
        await authService.changePassword(email, formData.currentPassword, formData.newPassword);
      }
      
      toast.success('Đổi mật khẩu thành công');
      handleClose();
    } catch (err) {
      const errorMessage = err.message || 'Đổi mật khẩu thất bại';
      // Kiểm tra nếu lỗi liên quan đến mật khẩu hiện tại không đúng
      if (errorMessage.toLowerCase().includes('mật khẩu hiện tại') || 
          errorMessage.toLowerCase().includes('current password') ||
          errorMessage.toLowerCase().includes('sai') ||
          errorMessage.toLowerCase().includes('incorrect') ||
          errorMessage.toLowerCase().includes('wrong')) {
        setErrors(prev => ({ ...prev, currentPassword: 'Mật khẩu hiện tại không chính xác.' }));
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    setError('');
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    onHide();
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <>
      <style>{`
        .change-password-modal .form-control.is-invalid {
          background-image: none !important;
          padding-right: 45px !important;
        }
        .change-password-modal .form-control.is-invalid:focus {
          background-image: none !important;
        }
      `}</style>
      <Modal 
        show={show} 
        onHide={handleClose} 
        size="md"
        centered
        className="change-password-modal"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #dee2e6' }}>
          <Modal.Title>Đổi mật khẩu</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ padding: '1.5rem' }}>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>
              Mật khẩu hiện tại <span className="text-danger">*</span>
            </Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                isInvalid={!!errors.currentPassword}
                placeholder="Nhập mật khẩu hiện tại"
                style={{ paddingRight: '45px' }}
              />
              <Button
                variant="link"
                className="position-absolute end-0 top-50 translate-middle-y"
                style={{ right: '10px', padding: '0', zIndex: 10 }}
                onClick={() => togglePasswordVisibility('current')}
                type="button"
              >
                {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </div>
            {errors.currentPassword && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.currentPassword}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Mật khẩu mới <span className="text-danger">*</span>
            </Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                isInvalid={!!errors.newPassword}
                placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                style={{ paddingRight: '45px' }}
              />
              <Button
                variant="link"
                className="position-absolute end-0 top-50 translate-middle-y"
                style={{ right: '10px', padding: '0', zIndex: 10 }}
                onClick={() => togglePasswordVisibility('new')}
                type="button"
              >
                {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </div>
            {errors.newPassword && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.newPassword}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Xác nhận mật khẩu mới <span className="text-danger">*</span>
            </Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                isInvalid={!!errors.confirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                style={{ paddingRight: '45px' }}
              />
              <Button
                variant="link"
                className="position-absolute end-0 top-50 translate-middle-y"
                style={{ right: '10px', padding: '0', zIndex: 10 }}
                onClick={() => togglePasswordVisibility('confirm')}
                type="button"
              >
                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
              </Button>
            </div>
            {errors.confirmPassword && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.confirmPassword}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #dee2e6' }}>
          <Button variant="secondary" onClick={handleClose} disabled={loading} type="button">
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
    </>
  );
};

export default ChangePasswordModal;