import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Button, Alert, Spinner, Table, Form, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import PlanningSidebar from '../../components/common/PlanningSidebar';
import { productionPlanService } from '../../api/productionPlanService';

const STATUS_LABELS = {
  DRAFT: { text: 'Nháp', variant: 'secondary' },
  PENDING_APPROVAL: { text: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { text: 'Đã duyệt', variant: 'success' },
  REJECTED: { text: 'Bị từ chối', variant: 'danger' }
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

const ProductionPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await productionPlanService.getById(id);
      setPlan(data);
    } catch (err) {
      console.error('Failed to load plan', err);
      setError(err.message || 'Không thể tải kế hoạch sản xuất.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadPlan();
    }
  }, [id, loadPlan]);

  const handleSubmitForApproval = async () => {
    if (!plan) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await productionPlanService.submitForApproval(plan.id, submitNotes.trim() || undefined);
      setSuccess('Đã gửi kế hoạch cho giám đốc phê duyệt.');
      setSubmitNotes('');
      loadPlan();
    } catch (err) {
      console.error('Submit plan failed', err);
      setError(err.message || 'Không thể gửi kế hoạch để duyệt.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStageRows = (detail) => {
    if (!detail.stages || detail.stages.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="text-muted text-center">
            Chưa có công đoạn nào.
          </td>
        </tr>
      );
    }

    return detail.stages.map((stage) => (
      <tr key={stage.id}>
        <td>{stage.sequenceNo || stage.sequence || '-'}</td>
        <td>{stage.stageType || stage.stage}</td>
        <td>{stage.assignedMachineName || stage.assignedMachineCode || '—'}</td>
        <td>{stage.inChargeUserName || '—'}</td>
        <td>{stage.plannedStartTime ? new Date(stage.plannedStartTime).toLocaleString('vi-VN') : '—'}</td>
        <td>{stage.plannedEndTime ? new Date(stage.plannedEndTime).toLocaleString('vi-VN') : '—'}</td>
      </tr>
    ));
  };

  return (
    <div className="planning-layout">
      <Header />
      <div className="d-flex">
        <PlanningSidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/planning/production-plans')}>
              ← Quay lại danh sách
            </Button>

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

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" size="sm" className="me-2" /> Đang tải kế hoạch...
              </div>
            ) : plan ? (
              <>
                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h3 className="mb-3">{plan.planCode || `PLAN-${plan.id}`}</h3>
                        <div className="mb-2">
                          <strong>Hợp đồng:</strong> {plan.contractNumber || '—'}
                        </div>
                        <div className="mb-2">
                          <strong>Khách hàng:</strong> {plan.customerName || '—'}
                        </div>
                        <div className="mb-2">
                          <strong>Ngày tạo:</strong> {formatDate(plan.createdAt)}
                        </div>
                      </div>
                      <Badge bg={(STATUS_LABELS[plan.status] || STATUS_LABELS.DRAFT).variant} className="fs-6">
                        {(STATUS_LABELS[plan.status] || STATUS_LABELS.DRAFT).text}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>

                {plan.details && plan.details.map((detail) => (
                  <Card key={detail.id} className="shadow-sm mb-4">
                    <Card.Header>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-1">{detail.productName}</h5>
                          <small className="text-muted">Số lượng: {detail.plannedQuantity} • Dự kiến giao: {formatDate(detail.requiredDeliveryDate)}</small>
                        </div>
                        <div className="text-muted">
                          Bắt đầu: {formatDate(detail.proposedStartDate)} • Kết thúc: {formatDate(detail.proposedEndDate)}
                        </div>
                      </div>
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
                        <tbody>{renderStageRows(detail)}</tbody>
                      </Table>
                      {detail.notes && <p className="text-muted mb-0">Ghi chú: {detail.notes}</p>}
                    </Card.Body>
                  </Card>
                ))}

                {plan.status === 'DRAFT' && (
                  <Card className="shadow-sm">
                    <Card.Body>
                      <h5 className="mb-3">Gửi kế hoạch cho giám đốc phê duyệt</h5>
                      <Form.Group className="mb-3">
                        <Form.Label>Ghi chú gửi giám đốc (tuỳ chọn)</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={submitNotes}
                          onChange={(event) => setSubmitNotes(event.target.value)}
                          placeholder="Ví dụ: Kế hoạch đã đảm bảo đủ năng lực máy và nguyên vật liệu."
                        />
                      </Form.Group>
                      <Button variant="success" onClick={handleSubmitForApproval} disabled={submitting}>
                        {submitting ? 'Đang gửi...' : 'Gửi phê duyệt'}
                      </Button>
                    </Card.Body>
                  </Card>
                )}
              </>
            ) : (
              <Alert variant="warning">Không tìm thấy kế hoạch sản xuất.</Alert>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionPlanDetail;