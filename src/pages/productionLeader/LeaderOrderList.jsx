import React, { useState, useMemo, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Spinner } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { orderService } from '../../api/orderService';
import { getStatusLabel, getStatusVariant, getButtonForStage } from '../../utils/statusMapper';
import toast from 'react-hot-toast';

const LeaderOrderList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Get userId from sessionStorage (set during login in authService.internalLogin)
  // Fallback to localStorage for backward compatibility
  const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const ordersData = await productionService.getLeaderOrders(userId);
        
        // Fetch order details to get stages for each order
        const ordersWithStages = await Promise.all(
          ordersData.map(async (order) => {
            try {
              const orderDetail = await orderService.getOrderById(order.id);
              // Find the stage assigned to this leader
              const leaderStage = (orderDetail.stages || []).find(
                stage => stage.assignedLeaderId === userId || 
                         stage.assignedLeader?.id === userId
              );
              
              return {
                ...order,
                leaderStage: leaderStage ? {
                  id: leaderStage.id,
                  status: leaderStage.executionStatus || leaderStage.status,
                  statusLabel: getStatusLabel(leaderStage.executionStatus || leaderStage.status),
                  progress: leaderStage.progressPercent || 0
                } : null
              };
            } catch (err) {
              console.warn(`Could not fetch detail for order ${order.id}:`, err);
              return {
                ...order,
                leaderStage: null
              };
            }
          })
        );
        
        setOrders(ordersWithStages);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Không thể tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.poNumber.toLowerCase().includes(term) ||
        (o.contract?.contractNumber || '').toLowerCase().includes(term)
    );
  }, [searchTerm, orders]);

  const handleStart = (order) => {
    navigate(`/leader/orders/${order.id}/progress`);
  };

  const handleViewDetail = (order) => {
    navigate(`/leader/orders/${order.id}`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="leader" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <h4 className="mb-3">Danh sách đơn hàng</h4>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Tìm kiếm theo mã lô hàng hoặc hợp đồng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 60 }}>STT</th>
                      <th>Mã đơn hàng</th>
                      <th>Sản phẩm</th>
                      <th>Số lượng</th>
                      <th>Ngày bắt đầu</th>
                      <th>Ngày kết thúc</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 120 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4">Không có đơn hàng nào</td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, index) => {
                        const stage = order.leaderStage;
                        const buttonConfig = stage ? getButtonForStage(stage.status, 'leader') : 
                          { text: 'Chi tiết', action: 'detail', variant: 'dark' };
                        
                        return (
                        <tr key={order.id}>
                          <td>{index + 1}</td>
                          <td>
                            <strong>{order.poNumber}</strong>
                          </td>
                          <td>{order.contract?.contractNumber || 'N/A'}</td>
                          <td>{order.totalQuantity?.toLocaleString('vi-VN')}</td>
                          <td>{order.plannedStartDate}</td>
                          <td>{order.plannedEndDate}</td>
                          <td>
                              <Badge bg={stage ? getStatusVariant(stage.status) : getStatusVariant(order.executionStatus || order.status)}>
                                {stage ? stage.statusLabel : getStatusLabel(order.executionStatus || order.status)}
                            </Badge>
                          </td>
                          <td className="text-end">
                              {buttonConfig.action === 'start' || buttonConfig.action === 'update' ? (
                            <Button
                              size="sm"
                                  variant={buttonConfig.variant}
                              onClick={() => handleStart(order)}
                                  disabled={stage?.status === 'PENDING'} // Disable nếu chưa đến lượt
                                >
                                  {buttonConfig.text}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant={buttonConfig.variant}
                                  onClick={() => handleViewDetail(order)}
                                >
                                  {buttonConfig.text}
                            </Button>
                              )}
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

export default LeaderOrderList;


