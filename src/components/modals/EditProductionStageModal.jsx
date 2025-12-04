import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { productionPlanService } from '../../api/productionPlanService';
import { userService } from '../../api/userService';
import { FaSave, FaTimes } from 'react-icons/fa';
import { handleDecimalKeyPress, sanitizeNumericInput } from '../../utils/validators';

const EditProductionStageModal = ({ show, onHide, stage, onSuccess }) => {
  const [formData, setFormData] = useState(stage || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]); // For inCharge and inspection
  const [availableMachines, setAvailableMachines] = useState([]); // For assigned machine

  useEffect(() => {
    if (stage) {
      setFormData({
        ...stage,
        plannedStartTime: stage.plannedStartTime ? new Date(stage.plannedStartTime).toISOString().slice(0, 16) : '',
        plannedEndTime: stage.plannedEndTime ? new Date(stage.plannedEndTime).toISOString().slice(0, 16) : '',
      });
    } else {
      setFormData({});
    }
  }, [stage]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoading(true);
        // Fetch all internal users
        const users = await userService.getAllInternalUsers();
        setAvailableUsers(users);

        // Fetch machine suggestions
        const machines = await productionPlanService.getMachineSuggestions();
        setAvailableMachines(machines);
      } catch (err) {
        console.error('Failed to fetch dropdown data', err);
        setError('Không thể tải dữ liệu cho các lựa chọn.');
      } finally {
        setLoading(false);
      }
    };
    if (show) {
      fetchDropdownData();
    }
  }, [show]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // Sanitize numeric fields
    let sanitizedValue = value;
    if (name === 'durationInHours') {
      sanitizedValue = sanitizeNumericInput(value, true); // Allow decimal
    } else if (name === 'notes') {
      // Trim whitespace for notes
      sanitizedValue = typeof value === 'string' ? value : value;
    }
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (!formData.plannedStartTime || !formData.plannedEndTime) {
      setError('Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc dự kiến.');
      setLoading(false);
      return;
    }

    if (new Date(formData.plannedEndTime) <= new Date(formData.plannedStartTime)) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu.');
      setLoading(false);
      return;
    }

    if (!formData.inChargeId) {
      setError('Vui lòng chọn người phụ trách.');
      setLoading(false);
      return;
    }

    if (!formData.inspectionById) {
      setError('Vui lòng chọn người kiểm tra (QC).');
      setLoading(false);
      return;
    }

    try {
      // API call to update the stage
      await productionPlanService.updateStage(stage.id, {
        stageType: formData.stageType,
        assignedMachineId: formData.assignedMachineId,
        inChargeId: formData.inChargeId,
        inspectionById: formData.inspectionById,
        plannedStartTime: formData.plannedStartTime ? new Date(formData.plannedStartTime).toISOString() : null,
        plannedEndTime: formData.plannedEndTime ? new Date(formData.plannedEndTime).toISOString() : null,
        durationInHours: formData.durationInHours ? parseFloat(formData.durationInHours.toString().trim()) : null,
        status: formData.status,
        notes: formData.notes ? formData.notes.trim() : null,
      });
      onSuccess();
      onHide();
    } catch (err) {
      console.error('Failed to update stage', err);
      setError(err.response?.data?.message || 'Không thể cập nhật công đoạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa Công đoạn Sản xuất</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <div className="text-center py-3"><Spinner animation="border" /> Đang tải...</div>}
        {error && <Alert variant="danger">{error}</Alert>}

        {stage && (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Loại công đoạn</Form.Label>
              <Form.Control type="text" name="stageType" value={formData.stageType || ''} onChange={handleFormChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Máy móc được gán</Form.Label>
              <Form.Select name="assignedMachineId" value={formData.assignedMachineId || ''} onChange={handleFormChange}>
                <option value="">Chọn máy móc</option>
                {availableMachines.map(machine => (
                  <option key={machine.id} value={machine.id}>{machine.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Người phụ trách</Form.Label>
              <Form.Select name="inChargeId" value={formData.inChargeId || ''} onChange={handleFormChange}>
                <option value="">Chọn người phụ trách</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Người kiểm tra (QC)</Form.Label>
              <Form.Select name="inspectionById" value={formData.inspectionById || ''} onChange={handleFormChange}>
                <option value="">Chọn người kiểm tra</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Thời gian bắt đầu dự kiến</Form.Label>
              <Form.Control type="datetime-local" name="plannedStartTime" value={formData.plannedStartTime || ''} onChange={handleFormChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Thời gian kết thúc dự kiến</Form.Label>
              <Form.Control type="datetime-local" name="plannedEndTime" value={formData.plannedEndTime || ''} onChange={handleFormChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Thời lượng (giờ)</Form.Label>
              <Form.Control type="text" inputMode="decimal" name="durationInHours" value={formData.durationInHours || ''} onChange={handleFormChange} onKeyPress={handleDecimalKeyPress} placeholder="VD: 8.5" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select name="status" value={formData.status || ''} onChange={handleFormChange} required>
                <option value="PENDING">Chưa thực hiện</option>
                <option value="IN_PROGRESS">Đang thực hiện</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="ON_HOLD">Tạm dừng</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ghi chú</Form.Label>
              <Form.Control as="textarea" rows={3} name="notes" value={formData.notes || ''} onChange={handleFormChange} />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={onHide} disabled={loading}>
                <FaTimes className="me-2" /> Hủy
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? <Spinner size="sm" animation="border" className="me-2" /> : <FaSave className="me-2" />} Lưu thay đổi
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default EditProductionStageModal;