import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Badge, Form, InputGroup, Row, Col, Modal } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionPlanService } from '../../api/productionPlanService';
import { contractService } from '../../api/contractService';
import { getDirectorPlanStatus } from '../../utils/statusMapper';
import Pagination from '../../components/Pagination';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { parseDateString, formatDateForBackend } from '../../utils/validators';

registerLocale('vi', vi);

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch (error) {
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

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '—';
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) return 0;

    let totalMinutes = 0;
    const current = new Date(start);

    // Helper to check if time is within working hours (08:00-12:00, 13:00-17:00)
    // We will iterate minute by minute or simplified approach?
    // Minute iteration is safe but slow if long duration.
    // Better: iterate by days.

    // Let's implement a robust calculation function:
    // Working hours: 08:00-12:00, 13:00-17:00.

    while (current < end) {
      // Check if current day is working day? user didn't specify weekends. Assuming 7 days as per previous tasks?
      // "Adjust Production Schedule Logic... 7-day work week". So work everyday.

      // Define working intervals for current day
      const dayStart = new Date(current); dayStart.setHours(8, 0, 0, 0);
      const lunchStart = new Date(current); lunchStart.setHours(12, 0, 0, 0);
      const lunchEnd = new Date(current); lunchEnd.setHours(13, 0, 0, 0);
      const dayEnd = new Date(current); dayEnd.setHours(17, 0, 0, 0);

      // Interval 1: 08:00 - 12:00
      // Interval 2: 13:00 - 17:00

      [[dayStart, lunchStart], [lunchEnd, dayEnd]].forEach(([s, e]) => {
        // Intersect [current, end] with [s, e]
        const overlapStart = new Date(Math.max(start, s));
        const overlapEnd = new Date(Math.min(end, e));
        if (overlapStart < overlapEnd) {
          totalMinutes += (overlapEnd - overlapStart) / (1000 * 60);
        }
      });

      // Move to next day
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    const hours = totalMinutes / 60;
    return hours.toFixed(1);
  } catch (error) {
    return '—';
  }
};

const ProductionPlanApprovals = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [decision, setDecision] = useState('');
  const [processing, setProcessing] = useState(false);
  const [modalError, setModalError] = useState(''); // NEW: Error state specifically for modal

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [createdDateFilter, setCreatedDateFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all plans first (since backend might not support full pagination/filtering combination yet)
      // We will filter client-side for now to match the previous logic but with new UI
      let fetchedPlans = [];
      if (statusFilter === 'ALL' || !statusFilter) {
        fetchedPlans = await productionPlanService.getAll();
      } else {
        fetchedPlans = await productionPlanService.getPlansByStatus(statusFilter);
      }

      if (Array.isArray(fetchedPlans)) {
        let filtered = fetchedPlans;

        // Filter by Search Term
        if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          filtered = filtered.filter(p =>
            (p.planCode && p.planCode.toLowerCase().includes(lowerSearch)) ||
            (p.contractNumber && p.contractNumber.toLowerCase().includes(lowerSearch))
          );
        }

        // Filter by Date
        if (createdDateFilter) {
          filtered = filtered.filter(p => {
            if (!p.createdAt) return false;
            const pDate = new Date(p.createdAt).toISOString().split('T')[0];
            return pDate === createdDateFilter;
          });
        }

        // Calculate pagination
        const totalFiltered = filtered.length;
        const newTotalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
        setTotalPages(newTotalPages);
        setTotalElements(totalFiltered);

        // Apply pagination
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedPlans = filtered.slice(startIndex, endIndex);

        // Enrich data
        const enrichedPlans = await Promise.all(
          paginatedPlans.map(async (plan) => {
            try {
              const contractDetails = await contractService.getOrderDetails(plan.contractId);
              return { ...plan, contractDetails };
            } catch (contractError) {
              console.error(`Failed to fetch contract details for plan ${plan.id}`, contractError);
              return { ...plan, contractDetails: null };
            }
          })
        );
        setPlans(enrichedPlans);
      } else {
        setPlans([]);
        setTotalPages(1);
        setTotalElements(0);
      }
    } catch (err) {
      console.error('Failed to fetch plans', err);
      setError(err.message || 'Không thể tải danh sách kế hoạch.');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, createdDateFilter]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, createdDateFilter]);

  const openPlan = async (plan) => {
    setSelectedPlan(plan);
    setDecision('');
    setModalError(''); // Reset modal error
    setPlanDetails(null);
    setDetailsLoading(true);

    try {
      const [detail, consumptionData] = await Promise.all([
        productionPlanService.getById(plan.id),
        productionPlanService.getMaterialConsumption(plan.id).catch(() => null)
      ]);

      if (consumptionData && consumptionData.materialSummaries?.length > 0) {
        const materialInfo = consumptionData.materialSummaries
          .map(m => `${m.totalQuantityRequired.toLocaleString()} ${m.unit} ${m.materialName}`)
          .join(', ');
        detail.materialConsumption = materialInfo;
      } else {
        detail.materialConsumption = 'Đang tính toán...';
      }

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
      toast.error(err.message || 'Không thể tải chi tiết kế hoạch.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setPlanDetails(null);
    setDecision('');
    setModalError('');
  };

  const handleApprove = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    setError('');
    setModalError(''); // Reset modal error


    try {
      await productionPlanService.approve(selectedPlan.id, decision.trim() || undefined);
      toast.success('Đã phê duyệt kế hoạch sản xuất. Lệnh sản xuất sẽ được tạo tự động.');
      closeModal();
      fetchPlans();
    } catch (err) {
      console.error('Approve plan failed', err);
      // Show error in modal instead of main page
      setModalError(err.message || 'Không thể phê duyệt kế hoạch.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPlan) return;
    if (!decision.trim()) {
      toast.error('Vui lòng nhập lý do từ chối kế hoạch.');
      return;
    }
    setProcessing(true);
    try {
      await productionPlanService.rejectPlan(selectedPlan.id, decision.trim());
      toast.success('Đã trả lại kế hoạch cho phòng kế hoạch chỉnh sửa.');
      closeModal();
      fetchPlans();
    } catch (err) {
      toast.error(err.message || 'Không thể từ chối kế hoạch.');
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
            <h2 className="mb-4">Phê Duyệt Kế Hoạch Sản Xuất</h2>

            {/* Search and Filter Section */}
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
                      <div className="custom-datepicker-wrapper">
                        <DatePicker
                          selected={parseDateString(createdDateFilter)}
                          onChange={(date) => {
                            if (date) {
                              // Format to yyyy-MM-dd for backend/state compatibility
                              setCreatedDateFilter(formatDateForBackend(date));
                            } else {
                              setCreatedDateFilter('');
                            }
                          }}
                          dateFormat="dd/MM/yyyy"
                          locale="vi"
                          className="form-control"
                          placeholderText="dd/mm/yyyy"
                          isClearable
                          todayButton="Hôm nay"
                        />
                      </div>
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

            <Card>
              <Card.Header>
                Danh sách kế hoạch sản xuất
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center"><Spinner animation="border" /></div>
                ) : error ? (
                  <Alert variant="danger">{error}</Alert>
                ) : (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Mã Kế Hoạch</th>
                          <th>Sản phẩm</th>
                          <th>Số lượng</th>
                          <th>Ngày Bắt Đầu (dự kiến)</th>
                          <th>Ngày Kết Thúc (dự kiến)</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plans.length > 0 ? plans.map(plan => {
                          const statusObj = getDirectorPlanStatus(plan.status);
                          const productName = plan.contractDetails?.orderItems?.[0]?.productName || 'N/A';
                          const plannedQuantity = plan.lot?.totalQuantity || plan.details?.[0]?.plannedQuantity || plan.contractDetails?.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 'N/A';

                          return (
                            <tr key={plan.id}>
                              <td>{plan.planCode || `PP-${plan.id}`}</td>
                              <td>{productName}</td>
                              <td>{plannedQuantity}</td>
                              <td>{formatDate(plan.proposedStartDate)}</td>
                              <td>{formatDate(plan.proposedEndDate)}</td>
                              <td>
                                <Badge bg={statusObj.variant}>{statusObj.label}</Badge>
                              </td>
                              <td>
                                <Button variant="primary" size="sm" onClick={() => openPlan(plan)}>
                                  Xem chi tiết
                                </Button>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan="7" className="text-center">
                              {totalElements === 0
                                ? 'Không có kế hoạch nào cần xử lý.'
                                : 'Không tìm thấy kế hoạch phù hợp với bộ lọc.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>

      {/* Detail Modal */}
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
              {modalError && (
                <Alert variant="danger" onClose={() => setModalError('')} dismissible>
                  {modalError}
                </Alert>
              )}
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