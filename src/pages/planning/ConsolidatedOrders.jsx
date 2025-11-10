import React, { useEffect, useState, useMemo } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import Pagination from '../../components/Pagination';
import { productionPlanService } from '../../api/productionPlanService'; // Assuming a new service function here
import '../../styles/QuoteRequests.css'; // Reusing existing styles

const STATUS_LABELS = {
  PENDING_PLANNING: { text: 'Chờ lập kế hoạch', variant: 'info' },
  PLANNED: { text: 'Đã lên kế hoạch', variant: 'success' },
  // Add other relevant statuses if any
};

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
    return value;
  }
};

const ConsolidatedOrders = () => {
  const navigate = useNavigate();
  const [consolidatedOrders, setConsolidatedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadConsolidatedOrders = async () => {
    setLoading(true);
    setError('');
    try {
      // Placeholder for the new API call
      // This API should return a list of consolidated orders ready for planning
      const data = await productionPlanService.getConsolidatedOrdersForPlanning();
      const sortedData = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate))
        : [];
      setConsolidatedOrders(sortedData);
    } catch (err) {
      console.error('Failed to fetch consolidated orders', err);
      setError(err.message || 'Không thể tải danh sách đơn hàng đã gộp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsolidatedOrders();
  }, []);

  // Pagination logic
  const indexOfLastOrder = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstOrder = indexOfLastOrder - ITEMS_PER_PAGE;
  const currentOrders = consolidatedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(consolidatedOrders.length / ITEMS_PER_PAGE);

  const handleCreatePlan = (batchId) => {
    // Navigate to a new page/modal for creating a production plan
    // Pass batchId or relevant consolidated order data
    navigate(`/planning/create-production-plan/${batchId}`);
  };

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="planning" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <h2 className="mb-4">Danh sách đơn hàng đã gộp</h2>

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}

            <Card>
              <Card.Header>
                Các đơn hàng đã được gộp và sẵn sàng để lập kế hoạch sản xuất
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center"><Spinner animation="border" /></div>
                ) : consolidatedOrders.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    Không có đơn hàng đã gộp nào cần lập kế hoạch.
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
                          <th>Trạng thái</th>
                          <th className="text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentOrders.map((order) => {
                          const statusConfig = STATUS_LABELS[order.status] || STATUS_LABELS.PENDING_PLANNING;
                          return (
                            <tr key={order.batchId}>
                              <td>{order.batchId}</td>
                              <td>{order.productName}</td>
                              <td>{order.size}</td>
                              <td>{order.totalQuantity}</td>
                              <td>{order.orderCount}</td> {/* Assuming orderCount or similar */}
                              <td>{formatDate(order.deliveryDate)}</td>
                              <td><Badge bg={statusConfig.variant}>{statusConfig.text}</Badge></td>
                              <td className="text-center">
                                <Button variant="success" size="sm" onClick={() => handleCreatePlan(order.batchId)}>
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

export default ConsolidatedOrders;