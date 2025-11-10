import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { roleService } from '../../api/roleService';

const CreateUserModal = ({ show, onHide, onSave, user = null }) => {
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
      loadRoles();
      if (user) {
        setFormData({
          email: user.email || '',
          password: '',
          name: user.name || '',
          phoneNumber: user.phoneNumber || '',
          roleId: '',
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
  }, [show, user]);

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

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.name) {
      newErrors.name = 'Họ và tên là bắt buộc';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
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
        email: formData.email,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
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
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', padding: '1.5rem' }}>
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
            <Form.Control.Feedback type="invalid">
              {errors.name}
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
              placeholder="user@example.com"
              disabled={!!user}
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
            />
            <Form.Control.Feedback type="invalid">
              {errors.phoneNumber}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              {user ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'} 
              {!user && <span className="text-danger">*</span>}
            </Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
                placeholder={user ? 'Nhập mật khẩu mới (tùy chọn)' : 'Nhập mật khẩu'}
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
            <Form.Control.Feedback type="invalid">
              {errors.password}
            </Form.Control.Feedback>
          </Form.Group>

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
            <Form.Control.Feedback type="invalid">
              {errors.roleId}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Trạng thái</Form.Label>
            <Form.Select
              name="active"
              value={formData.active}
              onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === 'true' }))}
            >
              <option value={true}>Active</option>
              <option value={false}>De-active</option>
            </Form.Select>
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
