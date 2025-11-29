import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import api from '../../api/apiConfig';
import { toast } from 'react-hot-toast';

const MaterialRequestApprovalModal = ({ show, onHide, request, onSuccess }) => {
    const [approvedQuantity, setApprovedQuantity] = useState(request?.quantityApproved || request?.quantityRequested || 0);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [warning, setWarning] = useState(null);

    const calculateDuration = (qty) => {
        // Mock calculation matching backend logic: 100kg = 1 day
        const days = qty / 100;
        return days;
    };

    const handleApprove = async () => {
        const days = calculateDuration(approvedQuantity);
        if (days > 7 && !warning) {
            setWarning(`Cảnh báo: Thời gian sản xuất dự kiến (${days.toFixed(1)} ngày) vượt quá 7 ngày. Bạn có chắc chắn muốn duyệt?`);
            return;
        }

        setLoading(true);
        try {
            const directorId = localStorage.getItem('userId') || 1; // Fallback
            await api.post(`/production/orders/approve-material-request`, null, {
                params: {
                    requestId: request.id,
                    approvedQuantity: approvedQuantity,
                    directorId: directorId
                }
            });
            toast.success("Đã duyệt yêu cầu và tạo lệnh sản xuất bổ sung");
            onSuccess();
            onHide();
        } catch (error) {
            console.error("Error approving request:", error);
            toast.error("Có lỗi xảy ra khi duyệt yêu cầu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Duyệt Yêu Cầu Cấp Vật Tư</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <strong>Công đoạn lỗi:</strong> {request?.stageName} <br />
                    <strong>Người yêu cầu:</strong> {request?.requestedBy} <br />
                    <strong>Ghi chú:</strong> {request?.notes}
                </div>

                {warning && <Alert variant="warning">{warning}</Alert>}

                <Form.Group className="mb-3">
                    <Form.Label>Số lượng duyệt (kg)</Form.Label>
                    <Form.Control
                        type="number"
                        value={approvedQuantity}
                        onChange={(e) => {
                            setApprovedQuantity(e.target.value);
                            setWarning(null); // Reset warning on change
                        }}
                    />
                    <Form.Text className="text-muted">
                        Thời gian dự kiến: {calculateDuration(approvedQuantity).toFixed(1)} ngày
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Ghi chú duyệt</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Đóng</Button>
                <Button variant="primary" onClick={handleApprove} disabled={loading}>
                    {loading ? 'Đang xử lý...' : (warning ? 'Xác nhận duyệt' : 'Duyệt & Tạo lệnh')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default MaterialRequestApprovalModal;
