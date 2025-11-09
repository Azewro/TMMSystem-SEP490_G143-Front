import React, { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';

const InsufficientCapacityModal = ({ show, onHide, onSubmit, loading }) => {
  const [reason, setReason] = useState('');
  const [proposedNewDate, setProposedNewDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason) {
      setError('Vui lòng nhập lý do.');
      return;
    }
    setError('');
    onSubmit({ reason, proposedNewDate });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Năng lực sản xuất không đủ</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">
          Nhập lý do và đề xuất ngày giao hàng mới để gửi thông báo cho bộ phận Sales.
        </p>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Lý do không đủ năng lực *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Lịch máy dệt đã đầy cho đến hết tháng."
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Ngày giao hàng đề xuất (tùy chọn)</Form.Label>
            <Form.Control
              type="date"
              value={proposedNewDate}
              onChange={(e) => setProposedNewDate(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Gửi thông báo'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InsufficientCapacityModal;
