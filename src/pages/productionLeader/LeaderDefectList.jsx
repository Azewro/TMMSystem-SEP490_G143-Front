import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { getStageTypeName } from '../../utils/statusMapper';
import api from '../../api/apiConfig';

const severityConfig = {
  MINOR: { label: 'Lỗi nhẹ', variant: 'warning' },
  MAJOR: { label: 'Lỗi nặng', variant: 'danger' },
};

const statusLabel = {
  PENDING: 'Chưa xử lý',
  IN_PROGRESS: 'Đang sửa',
  RESOLVED: 'Đã xử lý',
};

const LeaderDefectList = () => {
  const navigate = useNavigate();
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingDefectId, setProcessingDefectId] = useState(null);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDefect, setPendingDefect] = useState(null);
  const [activeStagesInfo, setActiveStagesInfo] = useState(null);

  useEffect(() => {
    fetchDefects();
  }, []);

  const fetchDefects = async () => {
    try {
      setLoading(true);
      // Get userId from sessionStorage (set during login in authService.internalLogin)
      // Fallback to localStorage for backward compatibility
      const leaderUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      const data = await productionService.getLeaderDefects(leaderUserId);
      setDefects(data);
    } catch (err) {
      console.error('Error fetching defects:', err);
      setError('Không thể tải danh sách lỗi');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRework = async (defect) => {
    try {
      setProcessingDefectId(defect.id);

      // 1. Check if any stage is currently active
      const checkResult = await api.get(`/v1/production/stages/${defect.stageId}/check-rework`);

      if (checkResult.data.hasActiveStages) {
        // Store pending info and show confirmation modal
        setPendingDefect(defect);
        setActiveStagesInfo(checkResult.data);
        setShowConfirmModal(true);
      } else {
        // No active stages - start rework directly
        await startReworkAndNavigate(defect, false);
      }
    } catch (err) {
      console.error('Error checking before rework:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi kiểm tra trạng thái');
    } finally {
      setProcessingDefectId(null);
    }
  };

  const startReworkAndNavigate = async (defect, forceStop) => {
    try {
      const leaderUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      await api.post(`/v1/production/stages/${defect.stageId}/start-rework?leaderUserId=${leaderUserId}&forceStop=${forceStop}`);

      toast.success('Đã bắt đầu sửa lỗi');

      // Navigate to progress page
      navigate(`/leader/orders/${defect.orderId}/progress`, {
        state: {
          defectId: defect.id,
          severity: defect.severity
        }
      });
    } catch (err) {
      console.error('Error starting rework:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi bắt đầu sửa lỗi');
    }
  };

  const handleConfirmForceStop = async () => {
    setShowConfirmModal(false);
    if (pendingDefect) {
      await startReworkAndNavigate(pendingDefect, true);
    }
    setPendingDefect(null);
    setActiveStagesInfo(null);
  };

  const handleCancelForceStop = () => {
    setShowConfirmModal(false);
    setPendingDefect(null);
    setActiveStagesInfo(null);
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="leader" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-1">Danh Sách Lỗi (Leader)</h5>
                <small className="text-muted">Xem và xử lý các lỗi nhẹ được giao</small>

                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p className="mt-2">Đang tải...</p>
                  </div>
                ) : defects.length === 0 ? (
                  <Alert variant="info" className="mt-3">Không có lỗi nào cần xử lý</Alert>
                ) : (
                  <Table hover responsive className="mt-3 mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Mã lô</th>
                        <th>Công đoạn</th>
                        {/* <th>Hình ảnh</th> REMOVED */}
                        <th>Mức độ</th>
                        <th>Mô tả</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {defects.map((defect) => (
                        <tr key={defect.id}>
                          <td>{defect.batchNumber || defect.poNumber || 'N/A'}</td>
                          <td>{getStageTypeName(defect.stageType)}</td>
                          {/* Removed Image Column */}

                          <td>
                            <Badge bg={severityConfig[defect.severity]?.variant || 'secondary'}>
                              {severityConfig[defect.severity]?.label || defect.severity}
                            </Badge>
                          </td>
                          <td>{defect.description || 'Không có mô tả'}</td>
                          <td>{statusLabel[defect.status] || defect.status}</td>
                          <td className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-danger"
                              disabled={processingDefectId === defect.id}
                              onClick={() => handleStartRework(defect)}
                            >
                              {processingDefectId === defect.id ? (
                                <>
                                  <Spinner size="sm" animation="border" className="me-1" />
                                  Đang xử lý...
                                </>
                              ) : (
                                'Tạm dừng và sửa lỗi'
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={handleCancelForceStop} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận dừng đơn hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activeStagesInfo && (
            <>
              <p>
                <strong>Đơn hàng đang chạy công đoạn {activeStagesInfo.stageTypeName || getStageTypeName(activeStagesInfo.stageType)}:</strong>
              </p>
              <ul>
                {activeStagesInfo.activeStages?.map((stage, idx) => (
                  <li key={idx}><strong>{stage.lotCode}</strong></li>
                ))}
              </ul>
              <p className="mt-3 text-danger">
                Bạn có muốn <strong>dừng</strong> các đơn hàng trên để tiến hành sửa lỗi không?
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelForceStop}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirmForceStop}>
            Xác nhận dừng và sửa lỗi
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LeaderDefectList;

