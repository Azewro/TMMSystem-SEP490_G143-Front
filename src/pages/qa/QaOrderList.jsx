import React, { useState, useMemo, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Spinner } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { getStatusLabel, getStatusVariant } from '../../utils/statusMapper';
import toast from 'react-hot-toast';

const QaOrderList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Get userId from sessionStorage (set during login in authService.internalLogin)
  // Fallback to localStorage for backward compatibility
  const qcUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await productionService.getQaOrders(qcUserId);
        console.log('QA Orders data from API:', data); // Debug log
        
        if (!data || data.length === 0) {
          console.log('No QA orders found');
          setOrders([]);
          return;
        }
        
        // Map backend data to match UI structure
        const mappedData = data.map(order => {
          // Find the stage assigned to this QA (qcAssigneeId matches)
          // Backend enrichProductionOrderDto returns all stages, find the one assigned to this QA
          const qaStage = (order.stages || []).find(s => 
            s.qcAssigneeId === Number(qcUserId) || 
            s.qcAssignee?.id === Number(qcUserId)
          );
          
          // Determine status label - use QA's stage status if available, otherwise use order status
          const status = qaStage?.executionStatus || order.executionStatus || order.status;
          const statusLabel = qaStage ? getStatusLabel(qaStage.executionStatus) : 
                            (order.statusLabel || getStatusLabel(order.executionStatus || order.status));
          
          return {
            id: order.id,
            lotCode: order.lotCode || order.poNumber || order.id,
            productName: order.productName || order.contract?.contractNumber || 'N/A',
            size: order.size || '-',
            quantity: order.totalQuantity || 0,
            expectedStartDate: order.plannedStartDate || order.expectedStartDate,
            expectedFinishDate: order.plannedEndDate || order.expectedFinishDate,
            status: status,
            statusLabel: statusLabel,
            qaStage: qaStage // Store QA stage for button logic
          };
        });
        console.log('Mapped QA Orders:', mappedData); // Debug log
        setOrders(mappedData);
      } catch (error) {
        console.error('Error fetching QA orders:', error);
        toast.error('Không thể tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    if (qcUserId) {
      fetchOrders();
    } else {
      console.warn('QC User ID not found');
      setLoading(false);
    }
  }, [qcUserId]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(term) ||
        o.productName.toLowerCase().includes(term),
    );
  }, [searchTerm, orders]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  const handleInspect = (order) => {
    navigate(`/qa/orders/${order.id}`);
  };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="qa" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <h4 className="mb-3">Danh sách đơn hàng</h4>
            <p className="text-muted mb-3">
              Quản lý và theo dõi đơn hàng cần kiểm tra chất lượng.
            </p>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Tìm kiếm theo mã lô hàng hoặc mô tả..."
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
                      <th>Mã lô</th>
                      <th>Tên sản phẩm</th>
                      <th>Kích thước</th>
                      <th>Số lượng</th>
                      <th>Ngày bắt đầu dự kiến</th>
                      <th>Ngày kết thúc dự kiến</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 120 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-4">Không có đơn hàng nào</td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, index) => (
                        <tr key={order.id}>
                          <td>{index + 1}</td>
                          <td>
                            <strong>{order.lotCode || order.id}</strong>
                          </td>
                          <td>{order.productName}</td>
                          <td>{order.size}</td>
                          <td>{order.quantity.toLocaleString('vi-VN')}</td>
                          <td>{order.expectedStartDate}</td>
                          <td>{order.expectedFinishDate}</td>
                          <td>
                            <Badge bg={getStatusVariant(order.status)}>
                              {order.statusLabel}
                            </Badge>
                          </td>
                        <td className="text-end">
                          <Button
                            size="sm"
                            variant="dark"
                            onClick={() => handleInspect(order)}
                          >
                            Xem kế hoạch
                          </Button>
                        </td>
                        </tr>
                      ))
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

export default QaOrderList;


