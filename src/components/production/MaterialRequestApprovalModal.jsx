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

    const handleApprove = async (force = false) => {
        // Client-side check (optional, but backend is authoritative)
        // const days = calculateDuration(approvedQuantity);

        setLoading(true);
        try {
            const directorId = localStorage.getItem('userId') || 1; // Fallback
            // Use ExecutionController endpoint
            await api.post(`/v1/execution/material-requisitions/${request.id}/approve`, null, {
                params: {
                    pmUserId: directorId, // Using directorId as pmUserId for now
                    force: force
                }
            });
            toast.success("Đã duyệt yêu cầu và tạo lệnh sản xuất bổ sung");
            onSuccess();
            onHide();
        } catch (error) {
            console.error("Error approving request:", error);
            const errorMessage = error.response?.data?.message || error.message || "";

            if (errorMessage.includes("TIME_EXCEEDED_WARNING")) {
                setWarning(errorMessage.replace("java.lang.RuntimeException: TIME_EXCEEDED_WARNING: ", ""));
            } else {
                toast.error("Có lỗi xảy ra: " + errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const onConfirmWarning = () => {
        handleApprove(true);
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
                <Button variant="primary" onClick={warning ? onConfirmWarning : () => handleApprove(false)} disabled={loading}>
                    {loading ? 'Đang xử lý...' : (warning ? 'Xác nhận duyệt' : 'Duyệt & Tạo lệnh')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default MaterialRequestApprovalModal;
