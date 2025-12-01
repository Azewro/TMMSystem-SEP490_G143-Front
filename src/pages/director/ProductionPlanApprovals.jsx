import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Table, Button, Modal, Alert, Spinner, Form, Badge, Row, Col, InputGroup } from 'react-bootstrap';
import Header from '../../components/common/Header';
import { productionPlanService } from '../../api/productionPlanService';
import { contractService } from '../../api/contractService';
import '../../styles/QuoteRequests.css';
import InternalSidebar from '../../components/common/InternalSidebar';
import { getDirectorPlanStatus } from '../../utils/statusMapper';
import { FaSearch } from 'react-icons/fa';

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
    console.warn('Cannot parse date', value, error);
    return value;
  }
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
    return value;
  }
};

// Map stage type to Vietnamese name
const getStageTypeName = (stageType) => {
  const stageTypeMap = {
    'WARPING': 'Cuồng mắc',
    'WEAVING': 'Dệt',
    'DYEING': 'Nhuộm',
    'CUTTING': 'Cắt',
    'HEMMING': 'May',
    'PACKAGING': 'Đóng gói'
  };
  return stageTypeMap[stageType] || stageType;
};

// Calculate duration in hours from start and end time
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '—';
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    return diffHours;
  } catch (error) {
    return '—';
  }
};

const ProductionPlanApprovals = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [decision, setDecision] = useState('');
  const [processing, setProcessing] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [dateFilter, setDateFilter] = useState('');

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let fetchedPlans = [];
      if (statusFilter === 'ALL') {
        fetchedPlans = await productionPlanService.getAll();
      } else if (statusFilter) {
        fetchedPlans = await productionPlanService.getPlansByStatus(statusFilter);
      } else {
        // Default fallback if needed, though we set default to PENDING_APPROVAL
        fetchedPlans = await productionPlanService.getPendingApproval();
      }

      if (Array.isArray(fetchedPlans) && fetchedPlans.length > 0) {
        // Client-side filtering for Search and Date
        let filtered = fetchedPlans;

        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          filtered = filtered.filter(p =>
            (p.planCode && p.planCode.toLowerCase().includes(lowerSearch)) ||
            (p.contractNumber && p.contractNumber.toLowerCase().includes(lowerSearch))
          );
        }

        if (dateFilter) {
          filtered = filtered.filter(p => {
            if (!p.createdAt) return false;
            const pDate = new Date(p.createdAt).toISOString().split('T')[0];
            return pDate === dateFilter;
          });
        }

        const enrichedPlans = await Promise.all(
          filtered.map(async (plan) => {
            try {
              const contractDetails = await contractService.getOrderDetails(plan.contractId);
              return { ...plan, contractDetails }; // Combine plan with its contract details
            } catch (contractError) {
              console.error(`Failed to fetch contract details for plan ${plan.id}`, contractError);
              return { ...plan, contractDetails: null }; // Still return the plan even if contract details fail
            }
          })
        );
        setPlans(enrichedPlans);
      } else {
        setPlans([]);
      }
    } catch (err) {
      console.error('Failed to fetch plans', err);
      setError(err.message || 'Không thể tải danh sách kế hoạch.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, dateFilter]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const openPlan = async (plan) => {
    setSelectedPlan(plan);
    setDecision('');
    setPlanDetails(null);
    setDetailsLoading(true);

    try {
      // Fetch plan details and material consumption in parallel
      const [detail, consumptionData] = await Promise.all([
        productionPlanService.getById(plan.id),
        productionPlanService.getMaterialConsumption(plan.id).catch(() => null)
      ]);

      // Format material consumption info
      if (consumptionData && consumptionData.materialSummaries?.length > 0) {
        const materialInfo = consumptionData.materialSummaries
          .map(m => `${m.totalQuantityRequired.toLocaleString()} ${m.unit} ${m.materialName}`)
          .join(', ');
        detail.materialConsumption = materialInfo;
      } else {
        detail.materialConsumption = 'Đang tính toán...';
      }

      // Fetch stages if not included in plan details
      if (!detail.details || !detail.details[0]?.stages) {
        try {
          const stages = await productionPlanService.getPlanStages(plan.id);
          if (detail.details && detail.details.length > 0) {
            detail.details[0].stages = stages;
          }
        } catch (err) {
          console.warn('Could not fetch stages separately:', err);
        }
      }

      setPlanDetails(detail);
    } catch (err) {
      console.error('Failed to fetch plan detail', err);
      setError(err.message || 'Không thể tải chi tiết kế hoạch.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setPlanDetails(null);
    setDecision('');
  };

  const handleApprove = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      await productionPlanService.approve(selectedPlan.id, decision.trim() || undefined);
      setSuccess('Đã phê duyệt kế hoạch sản xuất. Lệnh sản xuất sẽ được tạo tự động.');
      closeModal();
      loadPlans();
    } catch (err) {
      console.error('Approve plan failed', err);
      setError(err.message || 'Không thể phê duyệt kế hoạch.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPlan) return;
    if (!decision.trim()) {
      setError('Vui lòng nhập lý do từ chối kế hoạch.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      await productionPlanService.rejectPlan(selectedPlan.id, decision.trim());
      setSuccess('Đã trả lại kế hoạch cho phòng kế hoạch chỉnh sửa.');
      closeModal();
      loadPlans();
    } catch (err) {
      console.error('Reject plan failed', err);
      setError(err.message || 'Không thể từ chối kế hoạch.');
    } finally {
      setProcessing(false);
    }
  };

  const statusOptions = [
    { value: 'ALL', label: 'Tất cả trạng thái' },
    { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'REJECTED', label: 'Đã từ chối' },
    { value: 'DRAFT', label: 'Nháp' },
    { value: 'SUPERSEDED', label: 'Đã thay thế' }
  ];

  return (
    <div>
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="director" />
        <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <Container fluid>
            <div className="mb-4">
              <h2 className="mb-2">Phê Duyệt Kế Hoạch Sản Xuất</h2>
              <p className="text-muted mb-0">Xem xét và phê duyệt kế hoạch sản xuất từ bộ phận Kế hoạch</p>
            </div>

            {/* Filter Bar */}
            <Card className="mb-3">
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Tìm kiếm</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><FaSearch /></InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Tìm theo mã kế hoạch..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo ngày tạo</Form.Label>
                      <Form.Control
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="mb-1 small">Lọc theo trạng thái</Form.Label>
                      <Form.Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                {success}
              </Alert>
            )}

            <Card className="shadow-sm">
              <Card.Header>
                <strong>Danh sách kế hoạch</strong>
              </Card.Header>
              <Card.Body>
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Mã Kế Hoạch</th>
                      <th>Sản phẩm</th>
                      <th>Số lượng</th>
                      <th>Ngày Bắt Đầu (dự kiến)</th>
                      <th>Ngày Kết Thúc (dự kiến)</th>
                      <th>Trạng thái</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <Spinner animation="border" size="sm" className="me-2" /> Đang tải kế hoạch...
                        </td>
                      </tr>
                    ) : plans.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          Không có kế hoạch nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      plans.map((plan) => {
                        const statusObj = getDirectorPlanStatus(plan.status);

                        // Extract data from combined plan and contractDetails object
                        const productName = plan.contractDetails?.orderItems?.[0]?.productName || 'N/A';
                        const plannedQuantity = plan.contractDetails?.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 'N/A';
                        const startDate = plan.proposedStartDate;
                        const endDate = plan.proposedEndDate;

                        return (
                          <tr key={plan.id}>
                            <td className="fw-semibold">{plan.planCode || `PP-${plan.id}`}</td>
                            <td>{productName}</td>
                            <td>{plannedQuantity}</td>
                            <td>{formatDate(startDate)}</td>
                            <td>{formatDate(endDate)}</td>
                            <td>
                              <Badge bg={statusObj.variant}>{statusObj.label}</Badge>
                            </td>
                            <td className="text-center">
                              <Button variant="outline-primary" size="sm" onClick={() => openPlan(plan)}>
                                👁 Chi tiết
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

      <Modal show={!!selectedPlan} onHide={closeModal} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi Tiết Kế Hoạch Sản Xuất - {selectedPlan?.planCode || `PP-${selectedPlan?.id}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" /> Đang tải chi tiết kế hoạch...
            </div>
          ) : planDetails ? (
            <>
              {/* Thông Tin Chung Section */}
              <Card className="mb-3">
                <Card.Header>
                  <h5 className="mb-0">Thông Tin Chung</h5>
                </Card.Header>
                <Card.Body>
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-2"><strong>Mã lô:</strong> {planDetails.lot?.lotCode || planDetails.lotCode || planDetails.details?.[0]?.lotCode || '—'}</p>
                      <p className="mb-2"><strong>Số lượng:</strong> {planDetails.lot?.totalQuantity || planDetails.plannedQuantity || planDetails.details?.[0]?.plannedQuantity || '—'}</p>
                      <p className="mb-2"><strong>NVL tiêu hao:</strong> {planDetails.materialConsumption || 'Đang tính toán...'}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-2"><strong>Sản phẩm:</strong> {planDetails.lot?.productName || planDetails.productName || planDetails.details?.[0]?.productName || '—'}</p>
                      <p className="mb-2"><strong>Kích thước:</strong> {planDetails.lot?.sizeSnapshot || planDetails.sizeSnapshot || planDetails.details?.[0]?.sizeSnapshot || '—'}</p>
                      <p className="mb-2"><strong>Ngày bắt đầu:</strong> {formatDate(planDetails.proposedStartDate || planDetails.details?.[0]?.proposedStartDate)}</p>
                      <p className="mb-2"><strong>Ngày kết thúc:</strong> {formatDate(planDetails.proposedEndDate || planDetails.details?.[0]?.proposedEndDate)}</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Chi Tiết Công Đoạn Section */}
              <Card className="mb-3">
                <Card.Header>
                  <h5 className="mb-0">Chi Tiết Công Đoạn</h5>
                </Card.Header>
                <Card.Body>
                  {planDetails.details && planDetails.details.map((detail) => (
                    <Table key={detail.id} responsive size="sm" bordered className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: 80 }}>Công đoạn</th>

                          <th>Người phụ trách</th>
                          <th>Người kiểm tra</th>
                          <th>Bắt đầu</th>
                          <th>Kết thúc</th>
                          <th>Thời lượng (h)</th>
                          <th>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.stages?.map((stage) => (
                          <tr key={stage.id}>
                            <td>{getStageTypeName(stage.stageType || stage.stage || stage.stageTypeName)}</td>

                            <td>{stage.inChargeUserName || stage.inChargeUser?.name || stage.inChargeUser?.fullName || '—'}</td>
                            <td>{stage.qcUserName || stage.qcUser?.name || stage.qcUser?.fullName || '—'}</td>
                            <td>{formatDateTime(stage.plannedStartTime || stage.startTime)}</td>
                            <td>{formatDateTime(stage.plannedEndTime || stage.endTime)}</td>
                            <td>{stage.durationMinutes ? Math.round(stage.durationMinutes / 60) : (stage.durationHours || calculateDuration(stage.plannedStartTime || stage.startTime, stage.plannedEndTime || stage.endTime))}</td>
                            <td>{stage.notes || stage.note || '—'}</td>
                          </tr>
                        )) || (
                            <tr>
                              <td colSpan={8} className="text-center text-muted">Chưa có công đoạn chi tiết.</td>
                            </tr>
                          )}
                      </tbody>
                    </Table>
                  ))}
                </Card.Body>
              </Card>
            </>
          ) : (
            <Alert variant="warning">Không thể tải chi tiết kế hoạch.</Alert>
          )}

          <Form.Group className="mt-3">
            <Form.Label>Ghi chú phê duyệt / Lý do từ chối</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
              placeholder="Nhập ghi chú cho phòng kế hoạch"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal} disabled={processing}>
            Đóng
          </Button>
          {selectedPlan && selectedPlan.status === 'PENDING_APPROVAL' && (
            <>
              <Button variant="danger" onClick={handleReject} disabled={processing}>
                ✖ {processing && decision.trim() ? 'Đang xử lý...' : 'Từ chối'}
              </Button>
              <Button variant="success" onClick={handleApprove} disabled={processing}>
                ✔ {processing && !decision.trim() ? 'Đang xử lý...' : 'Phê duyệt'}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProductionPlanApprovals;