import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { orderService } from '../../api/orderService';
import { getStatusLabel, getStageTypeName, getButtonForStage, getStatusVariant } from '../../utils/statusMapper';
import toast from 'react-hot-toast';

const QaOrderDetail = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await orderService.getOrderById(orderId);
        
        // Get current QA userId
        const qcUserId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
        
        // Backend enrichProductionOrderDto returns stages in data.stages
        // Filter và map chỉ các stages được assign cho QA này
        const stages = (data.stages || [])
          .filter(stage => {
            // Chỉ lấy stages được assign cho QA này
            return stage.qcAssigneeId === Number(qcUserId) || 
                   stage.qcAssignee?.id === Number(qcUserId);
          })
          .map(stage => ({
            id: stage.id,
            code: stage.stageType,
            name: getStageTypeName(stage.stageType) || stage.stageType,
            assignee: stage.assignedLeader?.fullName || 
                      stage.assigneeName || 
                      (stage.stageType === 'DYEING' || stage.stageType === 'NHUOM' ? 'Production Manager' : 'Chưa phân công'),
            status: stage.executionStatus || stage.status,
            statusLabel: getStatusLabel(stage.executionStatus || stage.status),
            progress: stage.progressPercent || 0,
            qcAssigneeId: stage.qcAssigneeId || stage.qcAssignee?.id
          }));
        
        // Map backend data to match UI structure
        const mappedOrder = {
          id: data.id || orderId,
          lotCode: data.lotCode || data.poNumber || orderId,
          productName: data.productName || data.contract?.contractNumber || 'N/A',
          size: data.size || '-',
          quantity: data.totalQuantity || 0,
          expectedStartDate: data.plannedStartDate || data.expectedStartDate,
          expectedFinishDate: data.plannedEndDate || data.expectedFinishDate,
          statusLabel: getStatusLabel(data.executionStatus || data.status),
          stages: stages
        };
        setOrder(mappedOrder);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleBack = () => {
    navigate('/qa/orders');
  };

  const handleInspectStage = (stageId, stageCode) => {
    navigate(`/qa/orders/${orderId}/stages/${stageCode}/check`);
  };

  const handleViewStageDetail = (stageId, stageCode) => {
    // Navigate to stage result page to view inspection details
    navigate(`/qa/orders/${orderId}/stages/${stageCode}/result`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="qa" />
          <Container fluid className="p-4">
            <Button variant="link" onClick={handleBack}>&larr; Quay lại</Button>
            <div className="alert alert-warning mt-3">Không tìm thấy đơn hàng</div>
          </Container>
        </div>
      </div>
    );
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
            <Button variant="link" className="p-0 mb-3" onClick={handleBack}>
              &larr; Quay lại danh sách
            </Button>

            {/* Thông tin đơn hàng */}
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="row g-4">
                  <div className="col-lg-4 d-flex gap-3 align-items-center">
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        border: '1px dashed #ced4da',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        color: '#adb5bd',
                      }}
                    >
                      QR
                    </div>
                    <div>
                      <div className="text-muted small mb-1">Mã lô sản xuất</div>
                      <h5 className="mb-1">{order.lotCode || order.id}</h5>
                      <small className="text-muted">Đơn hàng {order.productName}</small>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-2">
                      <div className="text-muted small">Tên sản phẩm</div>
                      <div className="fw-semibold">{order.productName}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Kích thước</div>
                      <div className="fw-semibold">{order.size}</div>
                    </div>
                    <div>
                      <div className="text-muted small">Số lượng</div>
                      <div className="fw-semibold">{order.quantity.toLocaleString('vi-VN')} sản phẩm</div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-2">
                      <div className="text-muted small">Ngày bắt đầu dự kiến</div>
                      <div className="fw-semibold">{order.expectedStartDate}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Ngày kết thúc dự kiến</div>
                      <div className="fw-semibold">{order.expectedFinishDate}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="text-muted small mb-0">Trạng thái</div>
                      <Badge bg="warning" className="status-badge">
                        {order.statusLabel}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Danh sách công đoạn sản xuất */}
            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <div className="p-3 border-bottom">
                  <strong>Các công đoạn sản xuất</strong>
                </div>
                <Table responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Công đoạn</th>
                      <th>Người phụ trách</th>
                      <th>Tiến độ (%)</th>
                      <th>Trạng thái</th>
                      <th style={{ width: 140 }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.stages && order.stages.length > 0 ? (
                      order.stages.map((stage) => {
                        const canInspect = stage.status === 'WAITING_QC' || stage.status === 'QC_IN_PROGRESS';
                        
                        return (
                          <tr key={stage.id || stage.code}>
                        <td>{stage.name}</td>
                        <td>{stage.assignee}</td>
                        <td>{stage.progress ?? 0}%</td>
                        <td>
                              <Badge bg={getStatusVariant(stage.status)}>
                                {stage.statusLabel}
                              </Badge>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                                {/* Luôn hiển thị button "Chi tiết" */}
                                <Button 
                                  size="sm" 
                                  variant="outline-secondary"
                                  onClick={() => handleViewStageDetail(stage.id, stage.code)}
                                >
                              Chi tiết
                            </Button>
                                
                                {/* Luôn hiển thị button "Kiểm tra", nhưng disabled nếu chưa đến lượt */}
                            <Button
                              size="sm"
                              variant="dark"
                                  onClick={() => handleInspectStage(stage.id, stage.code)}
                                  disabled={!canInspect}
                                  title={!canInspect ? 
                                    'Chưa đến lượt kiểm tra. Chỉ có thể kiểm tra khi trạng thái là "chờ kiểm tra" hoặc "đang kiểm tra"' : 
                                    'Bắt đầu kiểm tra'}
                            >
                              Kiểm tra
                            </Button>
                          </div>
                        </td>
                      </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          Chưa có công đoạn nào
                        </td>
                      </tr>
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

export default QaOrderDetail;


