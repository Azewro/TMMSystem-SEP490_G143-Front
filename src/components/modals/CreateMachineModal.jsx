import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { handleIntegerKeyPress, handleDecimalKeyPress, sanitizeNumericInput } from '../../utils/validators';

const CreateMachineModal = ({ show, onHide, onSave, machine = null }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'WEAVING',
    location: '',
    status: 'AVAILABLE',
    maintenanceIntervalDays: 90,
    brand: 'TMMS',
    power: '',
    modelYear: '',
    capacityUnit: 'KG',
    capacityPerDay: '',
    capacityPerHour: {
      bathTowels: '',
      faceTowels: '',
      sportsTowels: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      if (machine) {
        // Parse specifications from JSON string
        let specs = {};
        try {
          specs = typeof machine.specifications === 'string' 
            ? JSON.parse(machine.specifications) 
            : (machine.specifications || {});
        } catch (e) {
          console.error('Error parsing specifications:', e);
        }

        setFormData({
          code: machine.code || '',
          name: machine.name || '',
          type: machine.type || 'WEAVING',
          location: machine.location || '',
          status: machine.status || 'AVAILABLE',
          maintenanceIntervalDays: machine.maintenanceIntervalDays || 90,
          brand: specs.brand || 'TMMS',
          power: specs.power || '',
          modelYear: specs.modelYear || '',
          capacityUnit: specs.capacityUnit || 'KG',
          capacityPerDay: specs.capacityPerDay || '',
          capacityPerHour: specs.capacityPerHour || {
            bathTowels: '',
            faceTowels: '',
            sportsTowels: ''
          }
        });
      } else {
        setFormData({
          code: '',
          name: '',
          type: 'WEAVING',
          location: '',
          status: 'AVAILABLE',
          maintenanceIntervalDays: 90,
          brand: 'TMMS',
          power: '',
          modelYear: '',
          capacityUnit: 'KG',
          capacityPerDay: '',
          capacityPerHour: {
            bathTowels: '',
            faceTowels: '',
            sportsTowels: ''
          }
        });
      }
      setErrors({});
    }
  }, [show, machine]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize numeric fields
    let sanitizedValue = value;
    if (name === 'maintenanceIntervalDays') {
      sanitizedValue = sanitizeNumericInput(value, false); // Integer only
    } else if (name === 'modelYear') {
      sanitizedValue = sanitizeNumericInput(value, false); // Integer only, max 4 digits
      if (sanitizedValue.length > 4) {
        sanitizedValue = sanitizedValue.slice(0, 4);
      }
    } else if (name === 'capacityPerDay') {
      sanitizedValue = sanitizeNumericInput(value, true); // Allow decimal
    } else {
      // For string fields, trim whitespace
      sanitizedValue = typeof value === 'string' ? value : value;
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

  const handleCapacityPerHourChange = (field, value) => {
    // Sanitize to allow decimal numbers
    const sanitizedValue = sanitizeNumericInput(value, true);
    setFormData(prev => ({
      ...prev,
      capacityPerHour: {
        ...prev.capacityPerHour,
        [field]: sanitizedValue
      }
    }));
    // Clear error for this field
    const errorKeyMap = {
      'bathTowels': 'capacityPerHourBath',
      'faceTowels': 'capacityPerHourFace',
      'sportsTowels': 'capacityPerHourSports'
    };
    const errorKey = errorKeyMap[field];
    if (errorKey && errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({
      ...prev,
      type: newType,
      capacityUnit: (newType === 'SEWING' || newType === 'CUTTING') ? 'PIECES' : 'KG'
    }));
  };

  const validateCode = (code) => {
    if (!code || !code.trim()) return false;
    // Mã máy thường có format: WEAV-001, WARP-001, SEW-001, CUT-001
    // Cho phép chữ, số, dấu gạch ngang và dấu gạch dưới
    return /^[A-Z0-9_-]+$/i.test(code.trim());
  };

  const validatePower = (power) => {
    if (!power || !power.trim()) return false;
    // Công suất thường có format: 5kW, 3kW, 10kW, etc.
    // Cho phép số, dấu chấm, và đơn vị (kW, W, etc.)
    return /^\d+(\.\d+)?\s*(kw|w|kW|W)?$/i.test(power.trim());
  };

  const validateYear = (year) => {
    if (!year || !year.trim()) return false;
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    // Năm phải là 4 chữ số, từ 1900 đến năm hiện tại + 1 (cho phép máy sắp sản xuất)
    return /^\d{4}$/.test(year.trim()) && yearNum >= 1900 && yearNum <= currentYear + 1;
  };

  const validate = () => {
    const newErrors = {};
    
    // Validate mã máy
    if (!formData.code || !formData.code.trim()) {
      newErrors.code = 'Mã máy là bắt buộc';
    } else if (!validateCode(formData.code)) {
      newErrors.code = 'Mã máy không hợp lệ. VD: WEAV-001';
    }

    // Validate tên máy
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Tên máy là bắt buộc';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên máy phải có ít nhất 2 ký tự';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Tên máy không được vượt quá 100 ký tự';
    }

    // Validate vị trí
    if (!formData.location || !formData.location.trim()) {
      newErrors.location = 'Vị trí là bắt buộc';
    } else if (formData.location.trim().length < 2) {
      newErrors.location = 'Vị trí phải có ít nhất 2 ký tự';
    } else if (formData.location.trim().length > 50) {
      newErrors.location = 'Vị trí không được vượt quá 50 ký tự';
    }

    // Validate chu kỳ bảo trì
    const maintenanceDays = parseInt(formData.maintenanceIntervalDays);
    if (isNaN(maintenanceDays) || maintenanceDays < 1) {
      newErrors.maintenanceIntervalDays = 'Chu kỳ bảo trì phải lớn hơn 0';
    } else if (maintenanceDays > 3650) {
      newErrors.maintenanceIntervalDays = 'Chu kỳ bảo trì không được vượt quá 3650 ngày (10 năm)';
    }

    // Validate thương hiệu
    if (!formData.brand || !formData.brand.trim()) {
      newErrors.brand = 'Thương hiệu là bắt buộc';
    } else if (formData.brand.trim().length < 2) {
      newErrors.brand = 'Thương hiệu phải có ít nhất 2 ký tự';
    } else if (formData.brand.trim().length > 50) {
      newErrors.brand = 'Thương hiệu không được vượt quá 50 ký tự';
    }

    // Validate công suất
    if (!formData.power || !formData.power.trim()) {
      newErrors.power = 'Công suất là bắt buộc';
    } else if (!validatePower(formData.power)) {
      newErrors.power = 'Công suất không hợp lệ. VD: 5kW, 3kW';
    }

    // Validate năm sản xuất
    if (!formData.modelYear || !formData.modelYear.trim()) {
      newErrors.modelYear = 'Năm sản xuất là bắt buộc';
    } else if (!validateYear(formData.modelYear)) {
      newErrors.modelYear = 'Năm sản xuất không hợp lệ. Phải là năm từ 1900 đến ' + (new Date().getFullYear() + 1);
    }

    // Validate capacity based on type
    if (formData.type === 'WEAVING' || formData.type === 'WARPING') {
      const capacityPerDay = parseFloat(formData.capacityPerDay);
      if (!formData.capacityPerDay || formData.capacityPerDay === '') {
        newErrors.capacityPerDay = 'Công suất/ngày là bắt buộc';
      } else if (isNaN(capacityPerDay) || capacityPerDay <= 0) {
        newErrors.capacityPerDay = 'Công suất/ngày phải là số lớn hơn 0';
      } else if (capacityPerDay > 1000000) {
        newErrors.capacityPerDay = 'Công suất/ngày không được vượt quá 1,000,000';
      }
    } else if (formData.type === 'SEWING' || formData.type === 'CUTTING') {
      const bathTowels = parseFloat(formData.capacityPerHour.bathTowels);
      const faceTowels = parseFloat(formData.capacityPerHour.faceTowels);
      const sportsTowels = parseFloat(formData.capacityPerHour.sportsTowels);

      if (!formData.capacityPerHour.bathTowels || formData.capacityPerHour.bathTowels === '') {
        newErrors.capacityPerHourBath = 'Công suất khăn tắm/giờ là bắt buộc';
      } else if (isNaN(bathTowels) || bathTowels <= 0) {
        newErrors.capacityPerHourBath = 'Công suất khăn tắm/giờ phải là số lớn hơn 0';
      } else if (bathTowels > 10000) {
        newErrors.capacityPerHourBath = 'Công suất khăn tắm/giờ không được vượt quá 10,000';
      }

      if (!formData.capacityPerHour.faceTowels || formData.capacityPerHour.faceTowels === '') {
        newErrors.capacityPerHourFace = 'Công suất khăn mặt/giờ là bắt buộc';
      } else if (isNaN(faceTowels) || faceTowels <= 0) {
        newErrors.capacityPerHourFace = 'Công suất khăn mặt/giờ phải là số lớn hơn 0';
      } else if (faceTowels > 10000) {
        newErrors.capacityPerHourFace = 'Công suất khăn mặt/giờ không được vượt quá 10,000';
      }

      if (!formData.capacityPerHour.sportsTowels || formData.capacityPerHour.sportsTowels === '') {
        newErrors.capacityPerHourSports = 'Công suất khăn thể thao/giờ là bắt buộc';
      } else if (isNaN(sportsTowels) || sportsTowels <= 0) {
        newErrors.capacityPerHourSports = 'Công suất khăn thể thao/giờ phải là số lớn hơn 0';
      } else if (sportsTowels > 10000) {
        newErrors.capacityPerHourSports = 'Công suất khăn thể thao/giờ không được vượt quá 10,000';
      }
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
      // Build specifications object based on type
      const specifications = {
        brand: formData.brand,
        power: formData.power,
        modelYear: formData.modelYear,
        capacityUnit: formData.capacityUnit
      };

      if (formData.type === 'WEAVING' || formData.type === 'WARPING') {
        specifications.capacityPerDay = parseFloat(formData.capacityPerDay);
      } else if (formData.type === 'SEWING' || formData.type === 'CUTTING') {
        specifications.capacityPerHour = {
          bathTowels: parseFloat(formData.capacityPerHour.bathTowels),
          faceTowels: parseFloat(formData.capacityPerHour.faceTowels),
          sportsTowels: parseFloat(formData.capacityPerHour.sportsTowels)
        };
      }

      const submitData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        type: formData.type,
        location: formData.location.trim(),
        status: formData.status,
        maintenanceIntervalDays: parseInt(formData.maintenanceIntervalDays.toString().trim()),
        specifications: JSON.stringify(specifications)
      };

      await onSave(submitData);
      handleClose();
    } catch (error) {
      console.error('Error saving machine:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra';
      setErrors(prev => ({ ...prev, _general: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      code: '',
      name: '',
      type: 'WEAVING',
      location: '',
      status: 'AVAILABLE',
      maintenanceIntervalDays: 90,
      brand: 'TMMS',
      power: '',
      modelYear: '',
      capacityUnit: 'KG',
      capacityPerDay: '',
      capacityPerHour: {
        bathTowels: '',
        faceTowels: '',
        sportsTowels: ''
      }
    });
    setErrors({});
    onHide();
  };

  const isCapacityPerDay = formData.type === 'WEAVING' || formData.type === 'WARPING';
  const isCapacityPerHour = formData.type === 'SEWING' || formData.type === 'CUTTING';

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg"
      centered
      style={{ maxHeight: '90vh' }}
    >
      <Modal.Header closeButton style={{ borderBottom: '1px solid #dee2e6' }}>
        <Modal.Title>{machine ? 'Chỉnh sửa máy' : 'Tạo máy mới'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', padding: '1.5rem' }}>
          {errors._general && (
            <Alert variant="danger" className="mb-3">
              {errors._general}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Mã máy <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  isInvalid={!!errors.code}
                  placeholder="VD: WEAV-001"
                  style={{ textTransform: 'uppercase' }}
                  maxLength={20}
                />
                {errors.code && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {errors.code}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Tên máy <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                  placeholder="VD: Máy dệt 1"
                  maxLength={100}
                />
                {errors.name && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {errors.name}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Loại máy <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  name="type"
                  value={formData.type}
                  onChange={handleTypeChange}
                >
                  <option value="WEAVING">Máy dệt (WEAVING)</option>
                  <option value="WARPING">Máy mắc (WARPING)</option>
                  <option value="SEWING">Máy may (SEWING)</option>
                  <option value="CUTTING">Máy cắt (CUTTING)</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Vị trí <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  isInvalid={!!errors.location}
                  placeholder="VD: Khu A-1"
                  maxLength={50}
                />
                {errors.location && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {errors.location}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Trạng thái</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="AVAILABLE">Sẵn sàng</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                  <option value="BROKEN">Hỏng</option>
                  <option value="IN_USE">Đang sử dụng</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Chu kỳ bảo trì (ngày)</Form.Label>
                <Form.Control
                  type="text"
                  inputMode="numeric"
                  name="maintenanceIntervalDays"
                  value={formData.maintenanceIntervalDays}
                  onChange={handleChange}
                  onKeyPress={handleIntegerKeyPress}
                  isInvalid={!!errors.maintenanceIntervalDays}
                  placeholder="VD: 90"
                />
                {errors.maintenanceIntervalDays && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {errors.maintenanceIntervalDays}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
          </Row>

          <hr className="my-3" />
          <h6 className="mb-3">Thông số kỹ thuật</h6>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Thương hiệu <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  isInvalid={!!errors.brand}
                  placeholder="VD: TMMS"
                  maxLength={50}
                />
                {errors.brand && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {errors.brand}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Công suất <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  name="power"
                  value={formData.power}
                  onChange={handleChange}
                  isInvalid={!!errors.power}
                  placeholder="VD: 5kW"
                />
                {errors.power && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {errors.power}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Năm sản xuất <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  inputMode="numeric"
                  name="modelYear"
                  value={formData.modelYear}
                  onChange={handleChange}
                  onKeyPress={handleIntegerKeyPress}
                  isInvalid={!!errors.modelYear}
                  placeholder="VD: 2022"
                  maxLength={4}
                />
                {errors.modelYear && (
                  <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {errors.modelYear}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
          </Row>

          {isCapacityPerDay && (
            <Form.Group className="mb-3">
              <Form.Label>
                Công suất/ngày ({formData.capacityUnit}) <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                inputMode="decimal"
                name="capacityPerDay"
                value={formData.capacityPerDay}
                onChange={handleChange}
                onKeyPress={handleDecimalKeyPress}
                isInvalid={!!errors.capacityPerDay}
                placeholder="VD: 50"
              />
              {errors.capacityPerDay && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {errors.capacityPerDay}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          )}

          {isCapacityPerHour && (
            <>
              <h6 className="mb-2 mt-3">Công suất/giờ (PIECES)</h6>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Khăn tắm <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      inputMode="decimal"
                      value={formData.capacityPerHour.bathTowels}
                      onChange={(e) => handleCapacityPerHourChange('bathTowels', e.target.value)}
                      onKeyPress={handleDecimalKeyPress}
                      isInvalid={!!errors.capacityPerHourBath}
                      placeholder="VD: 70"
                    />
                    {errors.capacityPerHourBath && (
                      <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                        {errors.capacityPerHourBath}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Khăn mặt <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      inputMode="decimal"
                      value={formData.capacityPerHour.faceTowels}
                      onChange={(e) => handleCapacityPerHourChange('faceTowels', e.target.value)}
                      onKeyPress={handleDecimalKeyPress}
                      isInvalid={!!errors.capacityPerHourFace}
                      placeholder="VD: 150"
                    />
                    {errors.capacityPerHourFace && (
                      <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                        {errors.capacityPerHourFace}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Khăn thể thao <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      inputMode="decimal"
                      value={formData.capacityPerHour.sportsTowels}
                      onChange={(e) => handleCapacityPerHourChange('sportsTowels', e.target.value)}
                      onKeyPress={handleDecimalKeyPress}
                      isInvalid={!!errors.capacityPerHourSports}
                      placeholder="VD: 100"
                    />
                    {errors.capacityPerHourSports && (
                      <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                        {errors.capacityPerHourSports}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #dee2e6' }}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : (machine ? 'Cập nhật' : 'Tạo máy')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateMachineModal;

