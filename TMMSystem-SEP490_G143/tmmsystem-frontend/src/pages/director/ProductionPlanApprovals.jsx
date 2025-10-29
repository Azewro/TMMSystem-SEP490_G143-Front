import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Modal, Alert, Spinner, Form, Badge } from 'react-bootstrap';
import Header from '../../components/common/Header';
import { productionPlanService } from '../../api/productionPlanService';
import '../../styles/QuoteRequests.css';

const STATUS_LABELS = {
  PENDING_APPROVAL: { text: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { text: 'Đã duyệt', variant: 'success' },
  REJECTED: { text: 'Đã từ chối', variant: 'danger' }
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
    console.warn('Cannot parse date', value, error);
    return value;
  }
};

const DirectorProductionPlanApprovals = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [decision, setDecision] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    setError('');

    try {
      const pending = await productionPlanService.getPendingApproval();
      setPlans(Array.isArray(pending) ? pending : []);
    } catch (err) {
      console.error('Failed to fetch pending plans', err);
      setError(err.message || 'Không thể tải danh sách kế hoạch chờ duyệt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openPlan = async (plan) => {
    setSelectedPlan(plan);
    setDecision('');
    setPlanDetails(null);
    setDetailsLoading(true);

    try {
      const detail = await productionPlanService.getById(plan.id);
      setPlanDetails(detail);
    } catch (err) {
      console.error('Failed to fetch plan detail', err);
      setError(err.message || 'Không thể tải chi tiết kế hoạch.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setPlanDetails(null);
    setDecision('');
  };

  const handleApprove = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      await productionPlanService.approvePlan(selectedPlan.id, decision.trim() || undefined);
      setSuccess('Đã phê duyệt kế hoạch sản xuất. Lệnh sản xuất sẽ được tạo tự động.');
      closeModal();
      loadPlans();
    } catch (err) {
      console.error('Approve plan failed', err);
      setError(err.message || 'Không thể phê duyệt kế hoạch.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPlan) return;
    if (!decision.trim()) {
      setError('Vui lòng nhập lý do từ chối kế hoạch.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      await productionPlanService.rejectPlan(selectedPlan.id, decision.trim());
      setSuccess('Đã trả lại kế hoạch cho phòng kế hoạch chỉnh sửa.');
      closeModal();
      loadPlans();
    } catch (err) {
      console.error('Reject plan failed', err);
      setError(err.message || 'Không thể từ chối kế hoạch.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="mb-0">Phê duyệt kế hoạch sản xuất</h1>
              <div className="text-muted">Các kế hoạch đã được phòng kế hoạch gửi lên.</div>
            </div>

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                {success}
              </Alert>
            )}

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>#</th>
                      <th style={{ width: 160 }}>Mã kế hoạch</th>
                      <th style={{ width: 160 }}>Hợp đồng</th>
                      <th style={{ width: 180 }}>Khách hàng</th>
                      <th style={{ width: 160 }}>Ngày tạo</th>
                      <th style={{ width: 160 }}>Trạng thái</th>
                      <th style={{ width: 140 }} className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <Spinner animation="border" size="sm" className="me-2" /> Đang tải kế hoạch...
                        </td>
                      </tr>
                    ) : plans.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          Không có kế hoạch nào cần phê duyệt.
                        </td>
                      </tr>
                    ) : (
                      plans.map((plan, index) => {
                        const statusConfig = STATUS_LABELS[plan.status] || STATUS_LABELS.PENDING_APPROVAL;
                        return (
                          <tr key={plan.id}>
                            <td>{index + 1}</td>
                            <td className="fw-semibold text-primary">{plan.planCode || `PLAN-${plan.id}`}</td>
                            <td>{plan.contractNumber || '—'}</td>
                            <td>{plan.customerName || '—'}</td>
                            <td>{formatDate(plan.createdAt)}</td>
                            <td>
                              <Badge bg={statusConfig.variant}>{statusConfig.text}</Badge>
                            </td>
                            <td className="text-center">
                              <Button variant="primary" size="sm" onClick={() => openPlan(plan)}>
                                Xem chi tiết
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>

      <Modal show={!!selectedPlan} onHide={closeModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết kế hoạch</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" /> Đang tải chi tiết kế hoạch...
            </div>
          ) : planDetails ? (
            <>
              <div className="mb-3">
                <strong>Kế hoạch:</strong> {planDetails.planCode || `PLAN-${planDetails.id}`}
              </div>
              <div className="mb-3">
                <strong>Hợp đồng:</strong> {planDetails.contractNumber || '—'}
              </div>
              {planDetails.details && planDetails.details.map((detail) => (
                <Card key={detail.id} className="mb-3">
                  <Card.Header>
                    <strong>{detail.productName}</strong> • Số lượng: {detail.plannedQuantity}
                  </Card.Header>
                  <Card.Body>
                    <Table responsive size="sm" bordered>
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: 80 }}>Thứ tự</th>
                          <th>Công đoạn</th>
                          <th>Máy móc</th>
                          <th>Phụ trách</th>
                          <th>Bắt đầu</th>
                          <th>Kết thúc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.stages?.map((stage) => (
                          <tr key={stage.id}>
                            <td>{stage.sequenceNo || stage.sequence || '-'}</td>
                            <td>{stage.stageType || stage.stage}</td>
                            <td>{stage.assignedMachineName || '—'}</td>
                            <td>{stage.inChargeUserName || '—'}</td>
                            <td>{stage.plannedStartTime ? new Date(stage.plannedStartTime).toLocaleString('vi-VN') : '—'}</td>
                            <td>{stage.plannedEndTime ? new Date(stage.plannedEndTime).toLocaleString('vi-VN') : '—'}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={6} className="text-center text-muted">Chưa có công đoạn chi tiết.</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              ))}
            </>
          ) : (
            <Alert variant="warning">Không thể tải chi tiết kế hoạch.</Alert>
          )}

          <Form.Group className="mt-3">
            <Form.Label>Ghi chú phê duyệt / Lý do từ chối</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
              placeholder="Nhập ghi chú cho phòng kế hoạch"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal} disabled={processing}>
            Đóng
          </Button>
          <Button variant="danger" onClick={handleReject} disabled={processing}>
            {processing && decision.trim() ? 'Đang xử lý...' : 'Từ chối'}
          </Button>
          <Button variant="success" onClick={handleApprove} disabled={processing}>
            {processing && !decision.trim() ? 'Đang xử lý...' : 'Phê duyệt'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DirectorProductionPlanApprovals;