import React, { useMemo, useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, InputGroup, Spinner } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { useNavigate } from 'react-router-dom';
import { productionService } from '../../api/productionService';
import { getStatusLabel, getStatusVariant, getProductionOrderStatusFromStages } from '../../utils/statusMapper';
import toast from 'react-hot-toast';

// Mock data cho màn danh sách đơn hàng sản xuất (Production Manager)
const MOCK_PRODUCTION_ORDERS = [
  {
    id: 'ORD-2025-001',
    lotCode: 'LOT-001',
    productName: 'Khăn tắm cao cấp',
    size: '70x140cm',
    quantity: 1000,
    expectedStartDate: '2025-11-20',
    expectedFinishDate: '2025-12-05',
    status: 'CHO_SAN_XUAT',
    statusLabel: 'Chờ sản xuất',
    stageSummary: 'Đang dệt vải'
  },
  {
    id: 'ORD-2025-002',
    lotCode: 'LOT-002',
    productName: 'Khăn mặt cotton',
    size: '30x30cm',
    quantity: 2000,
    expectedStartDate: '2025-11-18',
    expectedFinishDate: '2025-12-01',
    status: 'DANG_SAN_XUAT',
    statusLabel: 'Nguyên liệu sẵn sàng',
    stageSummary: 'May đang làm'
  },
  {
    id: 'ORD-2025-003',
    lotCode: 'LOT-003',
    productName: 'Khăn lau siêu thấm',
    size: '40x80cm',
    quantity: 1500,
    expectedStartDate: '2025-11-15',
    expectedFinishDate: '2025-11-30',
    status: 'DANG_SAN_XUAT',
    statusLabel: 'Máy đang làm',
    stageSummary: 'Nhuộm đang làm'
  },
  {
    id: 'ORD-2025-004',
    lotCode: 'LOT-004',
    productName: 'Khăn khách sạn',
    size: '60x120cm',
    quantity: 800,
    expectedStartDate: '2025-11-10',
    expectedFinishDate: '2025-11-25',
    status: 'HOAN_THANH',
    statusLabel: 'Hoàn thành',
    stageSummary: 'Đóng gói xong'
  }
];

// Removed local getStatusVariant - using the one from statusMapper.js for consistency

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'CHO_SAN_XUAT', label: 'Chờ sản xuất' },
  { value: 'DANG_SAN_XUAT', label: 'Đang sản xuất' },
  { value: 'HOAN_THANH', label: 'Hoàn thành' },
];

const ProductionOrderList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await productionService.getManagerOrders();
        // Map backend data to match mock structure
        const mappedData = data.map(order => {
          // Use new function to get dynamic status label with stage name
          const statusResult = getProductionOrderStatusFromStages(order);

          return {
            id: order.id,
            lotCode: order.lotCode || order.poNumber,
            productName: order.productName || order.contract?.contractNumber || 'N/A',
            size: order.size || '-',
            quantity: order.totalQuantity || 0,
            expectedStartDate: order.expectedStartDate || order.plannedStartDate,
            expectedFinishDate: order.expectedFinishDate || order.plannedEndDate,
            status: order.executionStatus || order.status,
            statusLabel: statusResult.label,
            statusVariant: statusResult.variant,
            pendingMaterialRequestId: order.pendingMaterialRequestId
          };
        });
        setOrders(mappedData);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Không thể tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleViewPlan = (orderId) => {
    navigate(`/production/orders/${orderId}`);
  };

  const handleViewMaterialRequest = (requestId) => {
    navigate(`/production/fiber-requests/${requestId}`);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchTerm ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.lotCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ? true : order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

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
        <InternalSidebar userRole="production" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <h3 className="mb-4" style={{ fontWeight: 600 }}>
              Quản lý sản xuất
            </h3>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3">
                  <div className="flex-grow-1">
                    <InputGroup>
                      <InputGroup.Text className="bg-white text-muted">
                        🔍
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Tìm kiếm theo mã đơn hàng hoặc mã lô..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </div>
                  <div style={{ minWidth: 220 }}>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      {STATUS_FILTERS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
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
                      <th>Hành động</th>
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
                            <strong>{order.lotCode}</strong>
                          </td>
                          <td>{order.productName}</td>
                          <td>{order.size}</td>
                          <td>{order.quantity.toLocaleString('vi-VN')}</td>
                          <td>{order.expectedStartDate}</td>
                          <td>{order.expectedFinishDate}</td>
                          <td>
                            <Badge bg={order.statusVariant || getStatusVariant(order.status)}>
                              {order.statusLabel}
                            </Badge>
                          </td>
                          <td className="text-end">
                            {order.pendingMaterialRequestId ? (
                              <Button
                                size="sm"
                                variant="warning"
                                className="me-2"
                                onClick={() => handleViewMaterialRequest(order.pendingMaterialRequestId)}
                              >
                                Xem yêu cầu
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleViewPlan(order.id)}
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

export default ProductionOrderList;


