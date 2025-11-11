import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import { productionPlanService } from '../../api/productionPlanService';
import '../../styles/QuoteRequests.css';

const STATUS_LABELS = {
  READY_FOR_PLANNING: { text: 'Chờ lập kế hoạch', variant: 'info' },
  PLANNING_IN_PROGRESS: { text: 'Đang lập kế hoạch', variant: 'primary' },
  PLAN_SUBMITTED: { text: 'Đã gửi duyệt', variant: 'warning' },
  COMPLETED: { text: 'Hoàn thành', variant: 'success' },
};

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

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadProductionLots = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await productionPlanService.getProductionLots('READY_FOR_PLANNING');
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
  };

  useEffect(() => {
    loadProductionLots();
  }, []);

  const indexOfLastLot = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstLot = indexOfLastLot - ITEMS_PER_PAGE;
  const currentLots = productionLots.slice(indexOfFirstLot, indexOfLastLot);
  const totalPages = Math.ceil(productionLots.length / ITEMS_PER_PAGE);

  const handleEditPlan = (planId) => {
    if (!planId) {
      setError('Lô này chưa có kế hoạch sản xuất đi kèm.');
      return;
    }
    navigate(`/planning/production-plans/${planId}`);
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="planning" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Danh sách Lô sản xuất</h2>

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}

            <Card>
              <Card.Header>
                Các lô sản xuất sẵn sàng để lập kế hoạch chi tiết
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center"><Spinner animation="border" /></div>
                ) : productionLots.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    Không có lô sản xuất nào cần lập kế hoạch.
                  </Alert>
                ) : (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Mã lô</th>
                          <th>Tên sản phẩm</th>
                          <th>Tổng SL</th>
                          <th>Số đơn hàng</th>
                          <th>Ngày tạo lô</th>
                          <th>Trạng thái</th>
                          <th className="text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentLots.map((lot) => {
                          const statusConfig = STATUS_LABELS[lot.status] || { text: lot.status, variant: 'secondary' };
                          return (
                            <tr key={lot.id}>
                              <td>{lot.lotCode}</td>
                              <td>{lot.productName}</td>
                              <td>{lot.totalQuantity}</td>
                              <td>{lot.orderNumbers ? lot.orderNumbers.length : 0}</td>
                              <td>{formatDate(lot.contractDateMin)}</td>
                              <td><Badge bg={statusConfig.variant}>{statusConfig.text}</Badge></td>
                              <td className="text-center">
                                <Button variant="success" size="sm" onClick={() => handleEditPlan(lot.currentPlanId)}>
                                  Lập kế hoạch
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