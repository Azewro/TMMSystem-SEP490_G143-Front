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
        // Approximate capacities matching backend
        const capacities = {
            'WARPING': 2000, 'WEAVING': 500, 'DYEING': 1000, 'CUTTING': 2000, 'HEMMING': 1500, 'PACKAGING': 3000,
            'CUONG_MAC': 2000, 'DET': 500, 'NHUOM': 1000, 'CAT': 2000, 'MAY': 1500, 'DONG_GOI': 3000
        };
        // Default to 1000 if unknown or generic
        const stageType = request?.stageName ? request.stageName.split(' ')[0].toUpperCase() : 'UNKNOWN';
        // Note: stageName might be "Cắt", "Dệt"... need mapping or just use default.
        // Simple mapping for Vietnamese names if needed, but let's stick to a safe default of 1000 for estimation
        // or try to map if possible.
        let capacity = 1000;
        if (request?.stageName) {
            const name = request.stageName.toUpperCase();
            if (name.includes("CẮT") || name.includes("CAT")) capacity = 2000;
            else if (name.includes("DỆT") || name.includes("DET")) capacity = 500;
            else if (name.includes("NHUỘM") || name.includes("NHUOM")) capacity = 1000;
            else if (name.includes("MAY")) capacity = 1500;
            else if (name.includes("ĐÓNG") || name.includes("DONG")) capacity = 3000;
        }

        const days = qty / capacity;
        return Math.ceil(days * 2) / 2.0; // Round to 0.5
    };

    const handleApprove = async (force = false) => {
        const days = calculateDuration(approvedQuantity);

        // Confirmation for <= 7 days (only if not forcing)
        if (!force && days <= 7) {
            const confirmed = window.confirm(`Thời gian khắc phục dự kiến là ${days} ngày. Việc này sẽ làm chậm tiến độ các đơn hàng khác. Bạn có chắc chắn muốn phê duyệt?`);
            if (!confirmed) return;
        }

        setLoading(true);
        try {
            const directorId = localStorage.getItem('userId') || 1;
            // Correct endpoint based on ProductionController
            // The previous code used /v1/execution/... but ProductionController has /v1/production/material-requests/{id}/approve
            // Let's check where approveMaterialRequest is mapped. 
            // It is in ProductionController: @PostMapping("/material-requests/{id}/approve") -> /v1/production/material-requests/{id}/approve
            // The previous code had /v1/execution... which might be wrong or proxied. 
            // I will use /v1/production/... to be safe.
            await api.post(`/v1/production/material-requests/${request.id}/approve`, null, {
                params: {
                    approvedQuantity: approvedQuantity,
                    directorId: directorId,
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

                {warning && <Alert variant="danger">
                    <Alert.Heading>Cảnh báo thời gian!</Alert.Heading>
                    <p>{warning}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button onClick={onConfirmWarning} variant="danger">
                            Vẫn phê duyệt
                        </Button>
                    </div>
                </Alert>}

                <Form.Group className="mb-3">
                    <Form.Label>Số lượng duyệt (kg)</Form.Label>
                    <Form.Control
                        type="number"
                        value={approvedQuantity}
                        onChange={(e) => {
                            setApprovedQuantity(e.target.value);
                            setWarning(null);
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
                {!warning && (
                    <Button variant="primary" onClick={() => handleApprove(false)} disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Duyệt & Tạo lệnh'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default MaterialRequestApprovalModal;
