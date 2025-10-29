import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Form, Spinner } from 'react-bootstrap';
import Header from '../../components/common/Header';
import PlanningSidebar from '../../components/common/PlanningSidebar';
import { productionPlanService } from '../../api/productionPlanService';
import '../../styles/QuoteRequests.css';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS = {
  DRAFT: { text: 'Nháp', variant: 'secondary' },
  PENDING_APPROVAL: { text: 'Chờ giám đốc duyệt', variant: 'warning' },
  APPROVED: { text: 'Đã duyệt', variant: 'success' },
  REJECTED: { text: 'Bị từ chối', variant: 'danger' }
};

const filterOptions = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Bị từ chối' }
];

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
    console.warn('Cannot parse date', value, error);
    return value;
  }
};

const ProductionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadPlans = async () => {
    setLoading(true);
    setError('');

    try {
      const allPlans = await productionPlanService.getAll();
      setPlans(Array.isArray(allPlans) ? allPlans : []);
    } catch (err) {
      console.error('Failed to fetch production plans', err);
      setError(err.message || 'Không thể tải danh sách kế hoạch sản xuất.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const filteredPlans = useMemo(() => {
    if (statusFilter === 'ALL') return plans;
    return plans.filter((plan) => plan.status === statusFilter);
  }, [plans, statusFilter]);

  const handleViewDetail = (planId) => {
    navigate(`/planning/production-plans/${planId}`);
  };

  return (
    <div className="planning-layout">
      <Header />
      <div className="d-flex">
        <PlanningSidebar />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="mb-0">Kế hoạch sản xuất</h1>
              <Form.Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={{ width: 220 }}
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </div>

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
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
                    ) : filteredPlans.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          {statusFilter === 'ALL'
                            ? 'Chưa có kế hoạch sản xuất nào.'
                            : 'Không có kế hoạch nào ở trạng thái này.'}
                        </td>
                      </tr>
                    ) : (
                      filteredPlans.map((plan, index) => {
                        const statusConfig = STATUS_LABELS[plan.status] || STATUS_LABELS.DRAFT;
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
                              <Button variant="primary" size="sm" onClick={() => handleViewDetail(plan.id)}>
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
    </div>
  );
};

export default ProductionPlans;