import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Button, Alert, Spinner, Table, Form, Badge, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionPlanService } from '../../api/productionPlanService';
import { FaArrowLeft, FaEdit, FaPaperPlane } from 'react-icons/fa';

const STATUS_LABELS = {
  DRAFT: { text: 'Nháp', variant: 'secondary' },
  PENDING_APPROVAL: { text: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { text: 'Đã duyệt', variant: 'success' },
  REJECTED: { text: 'Bị từ chối', variant: 'danger' }
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
    return value;
  }
};

const formatDateTime = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString('vi-VN');
    } catch (error) {
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
          <td colSpan={9} className="text-muted text-center py-3">
            Chưa có công đoạn nào được định nghĩa.
          </td>
        </tr>
      );
    }

    return detail.stages.map((stage) => (
      <tr key={stage.id}>
        <td>{stage.stageType || '—'}</td>
        <td>{stage.assignedMachineName || '—'}</td>
        <td>{stage.inChargeUserName || '—'}</td>
        <td>{stage.inspectionUserName || '—'}</td>
        <td>{formatDateTime(stage.plannedStartTime)}</td>
        <td>{formatDateTime(stage.plannedEndTime)}</td>
        <td>{stage.durationInHours || '—'}</td>
        <td><Badge bg="secondary">{stage.status || 'N/A'}</Badge></td>
        <td>{stage.notes || '—'}</td>
      </tr>
    ));
  };

  const mainDetail = plan?.details?.[0] || {};

  return (
    <div className="planning-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="planning" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">Chi tiết Kế hoạch sản xuất</h2>
                <div>
                    <Button variant="outline-secondary" onClick={() => navigate('/planning/plans')}>
                        <FaArrowLeft className="me-2" />
                        Quay lại danh sách
                    </Button>
                    {plan?.status === 'DRAFT' && (
                        <Button variant="outline-primary" className="ms-2">
                            <FaEdit className="me-2" />
                            Chỉnh sửa
                        </Button>
                    )}
                </div>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : plan ? (
              <>
                <Card className="shadow-sm mb-4">
                    <Card.Header as="h5">Thông tin chung</Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <p><strong>Mã kế hoạch:</strong> {plan.planCode || `PLAN-${plan.id}`}</p>
                                <p><strong>Tên sản phẩm:</strong> {mainDetail.productName || 'N/A'}</p>
                                <p><strong>Mã lô:</strong> {mainDetail.lotCode || 'N/A'}</p>
                                <p><strong>Hợp đồng:</strong> {plan.contractNumber || '—'}</p>
                                <p><strong>Khách hàng:</strong> {plan.customerName || '—'}</p>
                            </Col>
                            <Col md={6}>
                                <p><strong>Trạng thái:</strong> <Badge bg={(STATUS_LABELS[plan.status] || {}).variant || 'secondary'}>{(STATUS_LABELS[plan.status] || {}).text || plan.status}</Badge></p>
                                <p><strong>Tổng số lượng:</strong> {mainDetail.plannedQuantity || 'N/A'}</p>
                                <p><strong>Ngày tạo:</strong> {formatDate(plan.createdAt)}</p>
                                <p><strong>Dự kiến bắt đầu:</strong> {formatDate(mainDetail.proposedStartDate)}</p>
                                <p><strong>Dự kiến kết thúc:</strong> {formatDate(mainDetail.proposedEndDate)}</p>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="shadow-sm mb-4">
                    <Card.Header as="h5">Chi tiết các công đoạn sản xuất</Card.Header>
                    <Card.Body className="p-0">
                      <Table responsive striped bordered hover>
                        <thead className="table-light">
                          <tr>
                            <th>Công đoạn</th>
                            <th>Máy móc</th>
                            <th>Người phụ trách</th>
                            <th>Người kiểm tra</th>
                            <th>Bắt đầu</th>
                            <th>Kết thúc</th>
                            <th>Thời lượng (giờ)</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>{renderStageRows(mainDetail)}</tbody>
                      </Table>
                    </Card.Body>
                </Card>

                {plan.status === 'DRAFT' && (
                  <Card className="shadow-sm">
                    <Card.Header as="h5">Gửi kế hoạch cho giám đốc phê duyệt</Card.Header>
                    <Card.Body>
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
                        <FaPaperPlane className="me-2" />
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