import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { roleService } from '../../api/roleService';
import { isVietnamesePhoneNumber } from '../../utils/validators';

const CreateUserModal = ({ show, onHide, onSave, user = null, roles: propRoles = [] }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phoneNumber: '',
    roleId: '',
    active: true,
    verified: false
  });
  const [roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      // Use prop roles if available, otherwise load them
      if (propRoles && propRoles.length > 0) {
        setRoles(propRoles);
      } else {
        loadRoles();
      }
    }
  }, [show, propRoles]);

  useEffect(() => {
    if (show) {
      if (user) {
        // Find role ID based on role name if roleId is missing
        let initialRoleId = '';
        if (user.roleName && roles.length > 0) {
          const foundRole = roles.find(r => r.name === user.roleName);
          if (foundRole) initialRoleId = foundRole.id;
        }

        setFormData({
          email: user.email || '',
          password: '',
          name: user.name || '',
          phoneNumber: user.phoneNumber || '',
          roleId: initialRoleId,
          active: user.isActive !== undefined ? user.isActive : true,
          verified: user.isVerified !== undefined ? user.isVerified : false
        });
      } else {
        setFormData({
          email: '',
          password: '',
          name: '',
          phoneNumber: '',
          roleId: '',
          active: true,
          verified: false
        });
      }
      setErrors({});
    }
  }, [show, user, roles]);

  const loadRoles = async () => {
    try {
      const rolesData = await roleService.getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

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

  const validateName = (name) => {
    if (!name) return false;
    // Check for special characters like @@@ or ###
    const specialCharPattern = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    return !specialCharPattern.test(name);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = 'Email không hợp lệ.';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    }

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Họ và tên là bắt buộc';
    } else if (!validateName(formData.name.trim())) {
      newErrors.name = 'Tên người liên hệ không hợp lệ.';
    }

    if (!formData.phoneNumber || !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    } else if (!isVietnamesePhoneNumber(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ.';
    }

    if (!formData.roleId) {
      newErrors.roleId = 'Vai trò là bắt buộc';
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
        email: formData.email.trim(),
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        roleId: parseInt(formData.roleId),
        active: formData.active,
        verified: formData.verified
      };

      if (formData.password) {
        submitData.password = formData.password;
      }

      await onSave(submitData);
      handleClose();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra';
      // Check for specific error messages
      if (errorMessage.toLowerCase().includes('email đã được sử dụng') ||
        errorMessage.toLowerCase().includes('email already')) {
        setErrors(prev => ({ ...prev, email: 'Email này đã được sử dụng.' }));
      } else if (errorMessage.toLowerCase().includes('số điện thoại đã được sử dụng') ||
        errorMessage.toLowerCase().includes('phone number already')) {
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
      email: '',
      password: '',
      name: '',
      phoneNumber: '',
      roleId: '',
      active: true,
      verified: false
    });
    setErrors({});
    setShowPassword(false);
    onHide();
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === parseInt(roleId));
    return role ? role.name : '';
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
        <Modal.Title>{user ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản nhân viên'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} autoComplete="off">
        <Modal.Body style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', padding: '1.5rem' }}>
          {errors._general && (
            <Alert variant="danger" className="mb-3">
              {errors._general}
            </Alert>
          )}
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
              placeholder="Nhập họ và tên"
            />
            {errors.name && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.name}
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
              placeholder="user@example.com"
              disabled={!!user}
              autoComplete="off"
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
            />
            {errors.phoneNumber && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.phoneNumber}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          {!user && (
            <Form.Group className="mb-3">
              <Form.Label>
                Mật khẩu <span className="text-danger">*</span>
              </Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  isInvalid={!!errors.password}
                  placeholder="Nhập mật khẩu"
                  autoComplete="new-password"
                />
                <Button
                  variant="link"
                  className="position-absolute end-0 top-50 translate-middle-y"
                  style={{ right: '10px', padding: '0', zIndex: 10 }}
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
              {errors.password && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {errors.password}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>
              Vai trò <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              isInvalid={!!errors.roleId}
            >
              <option value="">Chọn vai trò</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Form.Select>
            {errors.roleId && (
              <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                {errors.roleId}
              </Form.Control.Feedback>
            )}
          </Form.Group>


        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #dee2e6' }}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : (user ? 'Cập nhật' : 'Tạo tài khoản')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateUserModal;
