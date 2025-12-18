import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Form, Spinner } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionPlanService } from '../../api/productionPlanService';
import Pagination from '../../components/Pagination';
import '../../styles/QuoteRequests.css';
import { useNavigate } from 'react-router-dom';
import { getPlanningPlanStatus } from '../../utils/statusMapper';
import { useWebSocketContext } from '../../context/WebSocketContext';

const filterOptions = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'READY_FOR_PLANNING', label: 'Chờ tạo' },
  { value: 'DRAFT', label: 'Chờ gửi' },
  { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' }
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const allPlans = await productionPlanService.getAll();
      const sortedPlans = Array.isArray(allPlans)
        ? allPlans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      setPlans(sortedPlans);
    } catch (err) {
      console.error('Failed to fetch production plans', err);
      setError(err.message || 'Không thể tải danh sách kế hoạch sản xuất.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // WebSocket subscription for real-time updates
  const { subscribe } = useWebSocketContext();
  useEffect(() => {
    const unsubscribe = subscribe('/topic/updates', (update) => {
      if (update.entity === 'PRODUCTION_PLAN') {
        console.log('Production Plans list refresh triggered by WebSocket');
        loadPlans();
      }
    });
    return () => unsubscribe();
  }, [subscribe, loadPlans]);

  const filteredPlans = useMemo(() => {
    if (statusFilter === 'ALL') return plans;
    return plans.filter((plan) => plan.status === statusFilter);
  }, [plans, statusFilter]);

  const handleViewDetail = (planId) => {
    navigate(`/planning/production-plans/${planId}`);
  };

  // Pagination logic
  const indexOfLastPlan = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstPlan = indexOfLastPlan - ITEMS_PER_PAGE;
  const currentPlans = filteredPlans.slice(indexOfFirstPlan, indexOfLastPlan);
  const totalPages = Math.ceil(filteredPlans.length / ITEMS_PER_PAGE);

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="planning" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Kế hoạch sản xuất</h2>

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}

            <Card>
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <span>Danh sách các kế hoạch sản xuất</span>
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
              </Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive>
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Mã kế hoạch</th>
                      <th>Hợp đồng</th>
                      <th>Khách hàng</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                      <th className="text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <Spinner animation="border" size="sm" className="me-2" /> Đang tải kế hoạch...
                        </td>
                      </tr>
                    ) : currentPlans.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          {statusFilter === 'ALL'
                            ? 'Chưa có kế hoạch sản xuất nào.'
                            : 'Không có kế hoạch nào ở trạng thái này.'}
                        </td>
                      </tr>
                    ) : (
                      currentPlans.map((plan, index) => {
                        const statusObj = getPlanningPlanStatus(plan.status);
                        return (
                          <tr key={plan.id}>
                            <td>{indexOfFirstPlan + index + 1}</td>
                            <td className="fw-semibold text-primary">{plan.planCode || `PLAN-${plan.id}`}</td>
                            <td>{plan.contractNumber || '—'}</td>
                            <td>{plan.customerName || '—'}</td>
                            <td>{formatDate(plan.createdAt)}</td>
                            <td>
                              <Badge bg={statusObj.variant}>{statusObj.label}</Badge>
                            </td>
                            <td className="text-center">
                              <Button
                                variant={plan.status === 'REJECTED' ? 'warning' : 'primary'}
                                size="sm"
                                onClick={() => handleViewDetail(plan.id)}
                              >
                                {plan.status === 'REJECTED' ? 'Chỉnh sửa lại' : 'Xem chi tiết'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionPlans;