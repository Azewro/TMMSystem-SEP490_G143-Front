import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { executionService } from '../../api/executionService';
import { orderService } from '../../api/orderService';
import toast from 'react-hot-toast';

const QaScanHandler = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleScan = async () => {
            try {
                if (!token) {
                    throw new Error('Mã QR không hợp lệ (thiếu token)');
                }

                // 1. Lấy thông tin stage từ token để tìm Order ID
                const stageByToken = await executionService.getStageByToken(token);
                if (!stageByToken || !stageByToken.productionOrderId) {
                    throw new Error('Không tìm thấy thông tin đơn hàng từ mã QR này');
                }

                const orderId = stageByToken.productionOrderId;

                // 2. Lấy chi tiết đơn hàng để biết trạng thái các công đoạn
                const order = await orderService.getOrderById(orderId);
                if (!order || !order.stages || order.stages.length === 0) {
                    throw new Error('Đơn hàng không có công đoạn nào');
                }

                // 3. Tìm công đoạn đang cần QC (WAITING_QC hoặc QC_IN_PROGRESS)
                // Sắp xếp theo sequence để tìm công đoạn sớm nhất
                const sortedStages = [...order.stages].sort((a, b) => a.stageSequence - b.stageSequence);

                const targetStage = sortedStages.find(s =>
                    s.executionStatus === 'WAITING_QC' || s.executionStatus === 'QC_IN_PROGRESS'
                );

                if (targetStage) {
                    toast.success(`Đang chuyển đến kiểm tra công đoạn: ${targetStage.stageType}`);
                    navigate(`/qa/orders/${orderId}/stages/${targetStage.stageType}/check`);
                } else {
                    // Nếu không có công đoạn nào cần QC, chuyển về chi tiết đơn hàng
                    // Hoặc có thể tìm công đoạn đang làm (IN_PROGRESS) để xem trước
                    const inProgressStage = sortedStages.find(s => s.executionStatus === 'IN_PROGRESS');
                    if (inProgressStage) {
                        toast('Đơn hàng đang sản xuất, chưa có công đoạn nào chờ QC.', { icon: 'ℹ️' });
                        navigate(`/qa/orders/${orderId}`);
                    } else {
                        toast.success('Đơn hàng đã hoàn thành hoặc chưa bắt đầu.');
                        navigate(`/qa/orders/${orderId}`);
                    }
                }

            } catch (err) {
                console.error('Scan Error:', err);
                setError(err.message || 'Có lỗi xảy ra khi xử lý mã QR');
                toast.error(err.message || 'Có lỗi xảy ra khi xử lý mã QR');
                // Chờ 3s rồi chuyển về trang danh sách
                setTimeout(() => navigate('/qa/orders'), 3000);
            } finally {
                setLoading(false);
            }
        };

        handleScan();
    }, [token, navigate]);

    if (loading) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center vh-100">
                <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <h4>Đang xử lý mã QR...</h4>
                <p className="text-muted">Vui lòng đợi trong giây lát</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center vh-100 text-danger">
                <i className="bi bi-exclamation-triangle-fill fs-1 mb-3"></i>
                <h4>Lỗi Quét Mã</h4>
                <p>{error}</p>
                <button className="btn btn-secondary mt-3" onClick={() => navigate('/qa/orders')}>
                    Về danh sách đơn hàng
                </button>
            </div>
        );
    }

    return null;
};

export default QaScanHandler;
