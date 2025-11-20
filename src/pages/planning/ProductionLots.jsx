import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import { productionPlanService } from '../../api/productionPlanService';
import { FaSync } from 'react-icons/fa';
import '../../styles/QuoteRequests.css';

const LOT_STATUS_LABELS = {
  FORMING: { text: 'Đang gom đơn', variant: 'secondary' },
  READY_FOR_PLANNING: { text: 'Chờ lập kế hoạch', variant: 'info' },
  PLANNING: { text: 'Đang lập kế hoạch', variant: 'primary' },
  PLAN_APPROVED: { text: 'Đã có kế hoạch', variant: 'success' },
  IN_PRODUCTION: { text: 'Đang sản xuất', variant: 'warning' },
  COMPLETED: { text: 'Hoàn thành', variant: 'success' },
  CANCELED: { text: 'Đã huỷ', variant: 'danger' },
};

const PLAN_STATUS_LABELS = {
  DRAFT: { text: 'Nháp', variant: 'secondary' },
  PENDING_APPROVAL: { text: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { text: 'Đã duyệt', variant: 'success' },
  REJECTED: { text: 'Bị từ chối', variant: 'danger' },
  SUPERSEDED: { text: 'Đã thay thế', variant: 'dark' },
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'FORMING', label: 'Đang gom đơn' },
  { value: 'READY_FOR_PLANNING', label: 'Chờ lập kế hoạch' },
  { value: 'PLANNING', label: 'Đang lập kế hoạch' },
  { value: 'PLAN_APPROVED', label: 'Đã có kế hoạch' },
  { value: 'IN_PRODUCTION', label: 'Đang sản xuất' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELED', label: 'Đã huỷ' },
];

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
    return value;
  }
};

const ProductionLots = () => {
  const navigate = useNavigate();
  const [productionLots, setProductionLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('READY_FOR_PLANNING'); // Default filter

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadProductionLots = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Pass statusFilter to the service. If filter is empty, fetch all.
      const data = await productionPlanService.getProductionLots(statusFilter || undefined);
      const sortedData = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      setProductionLots(sortedData);
    } catch (err) {
      console.error('Failed to fetch production lots', err);
      setError(err.message || 'Không thể tải danh sách lô sản xuất.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]); // Add statusFilter as a dependency

  useEffect(() => {
    loadProductionLots();
  }, [loadProductionLots]);

  const indexOfLastLot = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstLot = indexOfLastLot - ITEMS_PER_PAGE;
  const currentLots = productionLots.slice(indexOfFirstLot, indexOfLastLot);
  const totalPages = Math.ceil(productionLots.length / ITEMS_PER_PAGE);

  const handleEditPlan = async (lot) => {
    try {
      let planId = lot.currentPlanId;
      
      // If no plan exists, create one from the lot
      if (!planId) {
        const newPlan = await productionPlanService.createPlanFromLot(lot.id);
        planId = newPlan.id;
      }
      
      navigate(`/planning/production-plans/${planId}`);
    } catch (err) {
      console.error('Failed to create or navigate to plan', err);
      setError(err.message || 'Lỗi khi tạo kế hoạch sản xuất từ lô.');
    }
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="planning" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-2">Đơn Hàng Đã Merge (Auto)</h2>
                <p className="text-muted mb-0">Hệ thống tự động merge các đơn hàng: cùng sản phẩm, cùng ngày giao (±1), cùng ngày ký (±1)</p>
              </div>
              <Button variant="outline-primary" onClick={loadProductionLots} disabled={loading}>
                <FaSync className={loading ? 'fa-spin' : ''} />
                <span className="ms-2">Làm mới</span>
              </Button>
            </div>

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}

            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <strong>Danh Sách Lô Sản Xuất</strong>
                <Form.Group controlId="statusFilter" style={{ width: '260px' }}>
                  <Form.Select
                    size="sm"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={option.value || 'ALL'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center"><Spinner animation="border" /></div>
                ) : productionLots.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    <p className="mb-1">Không có lô sản xuất nào cần lập kế hoạch.</p>
                    <small className="text-muted">Lưu ý: Có thể mất vài phút để hệ thống tự động gộp đơn hàng sau khi hợp đồng được duyệt.</small>
                  </Alert>
                ) : (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Mã lô</th>
                          <th>Tên sản phẩm</th>
                          <th>Kích thước</th>
                          <th>Tổng SL</th>
                          <th>Đơn hàng</th>
                          <th>Ngày giao</th>
                          <th>Trạng thái lô</th>
                          <th>Trạng thái kế hoạch</th>
                          <th className="text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentLots.map((lot) => {
                          const lotStatus = LOT_STATUS_LABELS[lot.status] || { text: lot.status || '—', variant: 'secondary' };
                          const planStatus = lot.currentPlanStatus
                            ? (PLAN_STATUS_LABELS[lot.currentPlanStatus] || { text: lot.currentPlanStatus, variant: 'secondary' })
                            : null;
                          return (
                            <tr key={lot.id}>
                              <td>{lot.lotCode}</td>
                              <td>{lot.productName}</td>
                              <td>{lot.sizeSnapshot || '—'}</td>
                              <td>{lot.totalQuantity}</td>
                              <td>
                                {lot.orderNumbers && lot.orderNumbers.length > 0 ? (
                                  lot.orderNumbers.map((orderNum, idx) => (
                                    <Badge key={idx} bg="light" text="dark" className="me-1">
                                      {orderNum.startsWith('ORD-') ? orderNum : `ORD-${orderNum}`}
                                    </Badge>
                                  ))
                                ) : lot.contractNumbers && lot.contractNumbers.length > 0 ? (
                                  lot.contractNumbers.map((contractNum, idx) => (
                                    <Badge key={idx} bg="light" text="dark" className="me-1">
                                      {contractNum}
                                    </Badge>
                                  ))
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td>{formatDate(lot.deliveryDateTarget || lot.contractDateMin)}</td>
                              <td>
                                <Badge bg={lotStatus.variant}>{lotStatus.text}</Badge>
                              </td>
                              <td>
                                {planStatus ? (
                                  <Badge bg={planStatus.variant}>{planStatus.text}</Badge>
                                ) : (
                                  <span className="text-muted">Chưa có</span>
                                )}
                              </td>
                              <td className="text-center">
                                <Button 
                                  variant={lot.currentPlanId ? "secondary" : "success"} 
                                  size="sm" 
                                  onClick={() => handleEditPlan(lot)}
                                >
                                  {lot.currentPlanId ? 'Xem' : 'Lập kế hoạch'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default ProductionLots;