import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { userService } from '../../api/userService';
import { rfqService } from '../../api/rfqService';
import toast from 'react-hot-toast';

const AssignRfqModal = ({ show, onHide, rfqId, onAssignmentSuccess }) => {
  const [salesUsers, setSalesUsers] = useState([]);
  const [planningUsers, setPlanningUsers] = useState([]);
  const [selectedSalesId, setSelectedSalesId] = useState('');
  const [selectedPlanningId, setSelectedPlanningId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
          const allUsers = await userService.getAllUsers();
          const sales = allUsers.filter(user => user.roleName?.toUpperCase() === 'SALE STAFF'); // Corrected filter
          const planning = allUsers.filter(user => user.roleName?.toUpperCase().includes('PLANNING'));
          
          setSalesUsers(sales || []);
          setPlanningUsers(planning || []);
        } catch (err) {
          setError('Lỗi khi tải danh sách nhân viên.');
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [show]);

  const handleAssign = async () => {
    if (!selectedSalesId || !selectedPlanningId) {
      setError('Vui lòng chọn cả nhân viên Sales và Kế hoạch.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await rfqService.assignRfq(rfqId, selectedSalesId, selectedPlanningId);
      toast.success('Phân công RFQ thành công!');
      onAssignmentSuccess(); // Callback to refresh the list
    } catch (err) {
      setError(err.message || 'Phân công thất bại.');
      toast.error('Phân công RFQ thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setSelectedSalesId('');
    setSelectedPlanningId('');
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Phân công cho RFQ #{rfqId}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Chọn nhân viên Sales</Form.Label>
              <Form.Select 
                value={selectedSalesId} 
                onChange={(e) => setSelectedSalesId(e.target.value)}
                required
              >
                <option value="">-- Chọn Sales --</option>
                {salesUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Chọn nhân viên Kế hoạch</Form.Label>
              <Form.Select 
                value={selectedPlanningId} 
                onChange={(e) => setSelectedPlanningId(e.target.value)}
                required
              >
                <option value="">-- Chọn Kế hoạch --</option>
                {planningUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleAssign} disabled={loading || submitting}>
          {submitting ? <><Spinner size="sm" /> Đang phân công...</> : 'Xác nhận'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AssignRfqModal;
