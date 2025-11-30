import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import api from '../../api/apiConfig';
import { toast } from 'react-hot-toast';

const MaterialRequestApprovalModal = ({ show, onHide, request, onSuccess }) => {
    const [approvedQuantities, setApprovedQuantities] = useState({});
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [warning, setWarning] = useState(null);

    // Initialize approved quantities when request changes
    React.useEffect(() => {
        if (request && request.details) {
            const initialQuantities = {};
            request.details.forEach(d => {
                initialQuantities[d.id] = d.quantityApproved || d.quantityRequested || 0;
            });
            setApprovedQuantities(initialQuantities);
        } else if (request) {
            // Fallback for legacy requests without details (should be rare)
            setApprovedQuantities({});
        }
    }, [request]);

    const calculateTotalApproved = () => {
        return Object.values(approvedQuantities).reduce((sum, qty) => sum + (parseFloat(qty) || 0), 0);
    };

    const calculateDuration = (qty) => {
        // Approximate capacities matching backend
        const capacities = {
            'WARPING': 2000, 'WEAVING': 500, 'DYEING': 1000, 'CUTTING': 2000, 'HEMMING': 1500, 'PACKAGING': 3000,
            'CUONG_MAC': 2000, 'DET': 500, 'NHUOM': 1000, 'CAT': 2000, 'MAY': 1500, 'DONG_GOI': 3000
        };

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

    const handleQuantityChange = (detailId, value) => {
        setApprovedQuantities(prev => ({
            ...prev,
            [detailId]: value
        }));
        setWarning(null);
    };

    const handleApprove = async (force = false) => {
        const totalQty = calculateTotalApproved();
        const days = calculateDuration(totalQty);

        // Confirmation for <= 7 days (only if not forcing)
        if (!force && days <= 7) {
            const confirmed = window.confirm(`Tổng số lượng duyệt: ${totalQty} kg.\nThời gian khắc phục dự kiến là ${days} ngày.\nViệc này sẽ làm chậm tiến độ các đơn hàng khác. Bạn có chắc chắn muốn phê duyệt?`);
            if (!confirmed) return;
        }

        setLoading(true);
        try {
            const directorId = parseInt(localStorage.getItem('userId') || sessionStorage.getItem('userId')) || 1;

            // Construct details list
            const detailsToUpdate = Object.entries(approvedQuantities).map(([id, qty]) => ({
                id: parseInt(id),
                quantityApproved: parseFloat(qty)
            }));

            await api.post(`/v1/production/material-requests/${request.id}/approve`, {
                directorId: directorId,
                force: force,
                notes: notes,
                details: detailsToUpdate
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

    const totalApproved = calculateTotalApproved();
    const estimatedDays = calculateDuration(totalApproved);

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Duyệt Yêu Cầu Cấp Vật Tư</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <strong>Công đoạn lỗi:</strong> {request?.stageType || request?.stageName} <br />
                    <strong>Người yêu cầu:</strong> {request?.requestedByName || request?.requestedBy} <br />
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

                <h6 className="mt-4 mb-2">Chi tiết vật tư</h6>
                {request?.details && request.details.length > 0 ? (
                    <div className="table-responsive mb-3">
                        <table className="table table-bordered table-sm">
                            <thead className="table-light">
                                <tr>
                                    <th>Vật tư</th>
                                    <th style={{ width: '120px' }} className="text-end">SL Yêu cầu</th>
                                    <th style={{ width: '150px' }}>SL Duyệt (KG)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {request.details.map(d => (
                                    <tr key={d.id}>
                                        <td>{d.materialName}</td>
                                        <td className="text-end">{d.quantityRequested}</td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={approvedQuantities[d.id] !== undefined ? approvedQuantities[d.id] : ''}
                                                onChange={(e) => handleQuantityChange(d.id, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="table-light fw-bold">
                                <tr>
                                    <td colSpan="2" className="text-end">Tổng cộng:</td>
                                    <td>{totalApproved.toFixed(2)} KG</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <Alert variant="warning">Không có chi tiết vật tư. Vui lòng kiểm tra lại dữ liệu.</Alert>
                )}

                <div className="mb-3">
                    <small className="text-muted">
                        Thời gian dự kiến khắc phục: <strong>{estimatedDays.toFixed(1)} ngày</strong>
                    </small>
                </div>

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
