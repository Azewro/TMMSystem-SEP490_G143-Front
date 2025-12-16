import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

/**
 * Modal to notify Sales about insufficient capacity
 * Props:
 * - show: boolean
 * - onHide: function
 * - onSubmit: function({ reason, proposedNewDate })
 * - loading: boolean
 * - proposedDeliveryDate: string (optional) - auto-filled from capacity check
 */
const InsufficientCapacityModal = ({ show, onHide, onSubmit, loading, proposedDeliveryDate }) => {
    const [reason, setReason] = useState('');
    const [proposedNewDate, setProposedNewDate] = useState('');

    // Auto-fill proposed date when modal opens
    useEffect(() => {
        if (show && proposedDeliveryDate) {
            // Format date for input type="date" (YYYY-MM-DD)
            try {
                const dateObj = new Date(proposedDeliveryDate);
                if (!isNaN(dateObj.getTime())) {
                    setProposedNewDate(dateObj.toISOString().split('T')[0]);
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    }, [show, proposedDeliveryDate]);

    // Reset form when modal closes
    useEffect(() => {
        if (!show) {
            setReason('');
            setProposedNewDate('');
        }
    }, [show]);

    const handleSubmit = () => {
        if (!reason.trim()) {
            return; // Reason is required
        }
        onSubmit({ reason: reason.trim(), proposedNewDate: proposedNewDate || undefined });
    };

    // Calculate minimum date (proposed date from system)
    const minDate = proposedDeliveryDate
        ? new Date(proposedDeliveryDate).toISOString().split('T')[0]
        : '';

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Năng lực sản xuất không đủ</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-muted mb-3">
                    Nhập lý do và đề xuất ngày giao hàng mới để gửi thông báo cho bộ phận Sales.
                </p>

                <Form.Group className="mb-3">
                    <Form.Label>Lý do không đủ năng lực <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Ví dụ: Lịch máy dệt đã đầy cho đến hết tháng."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        disabled={loading}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Ngày giao hàng đề xuất (tùy chọn)</Form.Label>
                    <Form.Control
                        type="date"
                        value={proposedNewDate}
                        onChange={(e) => {
                            // Validate new date must be >= proposed date from system
                            if (minDate && e.target.value && e.target.value < minDate) {
                                // Don't allow dates before system's proposed date
                                return;
                            }
                            setProposedNewDate(e.target.value);
                        }}
                        min={minDate}
                        disabled={loading}
                    />
                    {proposedDeliveryDate && (
                        <Form.Text className="text-muted">
                            Hệ thống đề xuất: {new Date(proposedDeliveryDate).toLocaleDateString('vi-VN')}
                            {'. '}Ngày mới phải ≥ ngày đề xuất này.
                        </Form.Text>
                    )}
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Hủy
                </Button>
                <Button
                    variant="warning"
                    onClick={handleSubmit}
                    disabled={loading || !reason.trim()}
                >
                    {loading ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" className="me-2" />
                            Đang gửi...
                        </>
                    ) : (
                        'Gửi thông báo'
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default InsufficientCapacityModal;
