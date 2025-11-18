import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Button, Alert, Spinner, Form, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionPlanService } from '../../api/productionPlanService';
import { productService } from '../../api/productService';
import { userService } from '../../api/userService';
import { contractService } from '../../api/contractService';
import { machineService } from '../../api/machineService';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import '../../styles/ProductionPlanDetail.css'; // Import the new CSS file

const formatDateForInput = (isoDate) => {
    if (!isoDate) return '';
    try {
        return new Date(isoDate).toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

const formatDateTimeForInput = (isoDate) => {
    if (!isoDate) return '';
    try {
        // Format to YYYY-MM-DDTHH:mm
        const date = new Date(isoDate);
        const ten = (i) => (i < 10 ? '0' : '') + i;
        const YYYY = date.getFullYear();
        const MM = ten(date.getMonth() + 1);
        const DD = ten(date.getDate());
        const HH = ten(date.getHours());
        const mm = ten(date.getMinutes());
        return `${YYYY}-${MM}-${DD}T${HH}:${mm}`;
    } catch (e) {
        return '';
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


const ProductionPlanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [initialPlan, setInitialPlan] = useState(null);
    const [editablePlan, setEditablePlan] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [calculating, setCalculating] = useState(false); // New state for calculation

    const [materialInfo, setMaterialInfo] = useState('Đang tính toán...');
    const [machines, setMachines] = useState([]);
    const [inChargeUsers, setInChargeUsers] = useState([]);
    const [qcUsers, setQcUsers] = useState([]);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const planData = await productionPlanService.getById(id);
            let stagesData = [];
            try {
                stagesData = await productionPlanService.getPlanStages(id);
            } catch (err) {
                console.warn('Could not fetch stages separately, using plan details:', err);
            }
            
            const [allProducts, contractDetails, consumptionData, allUsers, allMachines] = await Promise.all([
                productService.getAllProducts(),
                contractService.getOrderDetails(planData.contractId),
                productionPlanService.getMaterialConsumption(id),
                userService.getAllUsers(),
                machineService.getAllMachines()
            ]);

            const productMap = new Map(allProducts.map(p => [p.id, p]));

            if (consumptionData && consumptionData.materialSummaries?.length > 0) {
                const infoString = consumptionData.materialSummaries
                    .map(m => `${m.totalQuantityRequired.toLocaleString()} ${m.unit} ${m.materialName}`)
                    .join(', ');
                setMaterialInfo(infoString);
            } else {
                setMaterialInfo('Không có thông tin hoặc không cần NVL.');
            }

            let planStages = stagesData && stagesData.length > 0 ? stagesData : 
                (planData.details && planData.details.length > 0 && planData.details[0].stages ? planData.details[0].stages : []);
            
            if (planStages.length === 0) {
                const mainProductItem = contractDetails?.orderItems?.[0];
                const mainProduct = mainProductItem ? productMap.get(mainProductItem.productId) : null;
                const totalContractQuantity = contractDetails?.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                
                planData.productName = mainProduct?.name || 'Không có tên sản phẩm';
                planData.sizeSnapshot = mainProduct?.standardDimensions || 'Không có kích thước';
                planData.plannedQuantity = totalContractQuantity;

                planStages = [
                    { id: `new-stage-${Date.now()}-1`, stageType: 'WARPING', sequenceNo: 1, status: 'PENDING' },
                    { id: `new-stage-${Date.now()}-2`, stageType: 'WEAVING', sequenceNo: 2, status: 'PENDING' },
                    { id: `new-stage-${Date.now()}-3`, stageType: 'DYEING', sequenceNo: 3, status: 'PENDING' },
                    { id: `new-stage-${Date.now()}-4`, stageType: 'CUTTING', sequenceNo: 4, status: 'PENDING' },
                    { id: `new-stage-${Date.now()}-5`, stageType: 'HEMMING', sequenceNo: 5, status: 'PENDING' },
                    { id: `new-stage-${Date.now()}-6`, stageType: 'PACKAGING', sequenceNo: 6, status: 'PENDING' },
                ];
            }
            
            const lotInfo = planData.lot || {};
            const lotCode = lotInfo.lotCode || planData.lotCode || planData.planCode?.replace('PP', 'BATCH') || '';
            const productName = lotInfo.productName || planData.productName || planData.details?.[0]?.productName || '';
            const sizeSnapshot = lotInfo.sizeSnapshot || planData.sizeSnapshot || planData.details?.[0]?.sizeSnapshot || '';
            const plannedQuantity = lotInfo.totalQuantity || planData.plannedQuantity || planData.details?.[0]?.plannedQuantity || 0;
            
            if (!planData.details || planData.details.length === 0) {
                const mainProductItem = contractDetails?.orderItems?.[0];
                const mainProduct = mainProductItem ? productMap.get(mainProductItem.productId) : null;
                const totalContractQuantity = contractDetails?.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                
                planData.details = [{
                    id: `new-detail-${Date.now()}`,
                    lotCode: lotCode,
                    productId: mainProduct?.id || lotInfo.productId,
                    productName: productName || mainProduct?.name || 'Không có tên sản phẩm',
                    sizeSnapshot: sizeSnapshot || mainProduct?.standardDimensions || 'Không có kích thước',
                    plannedQuantity: plannedQuantity || totalContractQuantity,
                    stages: planStages
                }];
            } else {
                planData.details = planData.details.map(detail => {
                    const product = productMap.get(detail.productId);
                    return {
                        ...detail,
                        lotCode: detail.lotCode || lotCode,
                        productName: detail.productName || productName || product?.name || 'Không có tên sản phẩm',
                        sizeSnapshot: detail.sizeSnapshot || sizeSnapshot || product?.standardDimensions || 'Không có kích thước',
                        plannedQuantity: detail.plannedQuantity || plannedQuantity,
                        stages: detail.stages || planStages
                    };
                });
            }
            
            planData.lotCode = lotCode;
            planData.productName = productName || planData.details[0]?.productName;
            planData.sizeSnapshot = sizeSnapshot || planData.details[0]?.sizeSnapshot;
            planData.plannedQuantity = plannedQuantity || planData.details[0]?.plannedQuantity;

            setInitialPlan(planData);
            setEditablePlan(JSON.parse(JSON.stringify(planData)));

            const machinesArray = allMachines?.content || (Array.isArray(allMachines) ? allMachines : []);
            setMachines(machinesArray);

            const usersArray = allUsers?.content || (Array.isArray(allUsers) ? allUsers : []);
            setInChargeUsers(usersArray.filter(u => u.roleName && (u.roleName.toLowerCase().includes('worker') || u.roleName.toLowerCase().includes('planning'))));
            setQcUsers(usersArray.filter(u => u.roleName && u.roleName.toLowerCase() === 'quality assurance department'));

        } catch (err) {
            console.error('Failed to load initial data', err);
            setError(err.message || 'Không thể tải dữ liệu cho kế hoạch sản xuất.');
            setMaterialInfo('Lỗi khi tải dữ liệu NVL.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadInitialData();
        }
    }, [id, loadInitialData]);

    const handleStageChange = async (stageId, field, value) => {
        setEditablePlan(prev => {
            const newStages = prev.details[0].stages.map(stage => {
                if (stage.id === stageId) {
                    return { ...stage, [field]: value };
                }
                return stage;
            });
            return {
                ...prev,
                details: [{
                    ...prev.details[0],
                    stages: newStages
                }]
            };
        });
        
        const stage = editablePlan?.details?.[0]?.stages?.find(s => s.id === stageId);
        if (!stage) return;
        
        if (field === 'inChargeId') {
            try {
                await productionPlanService.updateStage(stageId, { inChargeUserId: value ? parseInt(value, 10) : null });
                toast.success('Đã cập nhật người phụ trách.');
            } catch (err) {
                toast.error('Lỗi khi gán người phụ trách.');
            }
        } else if (field === 'inspectionById') {
            try {
                await productionPlanService.updateStage(stageId, { qcUserId: value ? parseInt(value, 10) : null });
                toast.success('Đã cập nhật người kiểm tra.');
            } catch (err) {
                toast.error('Lỗi khi gán người kiểm tra.');
            }
        }
    };

    const handleCalculateSchedule = async () => {
        setCalculating(true);
        toast.loading('Đang tính toán lịch trình...');
        try {
            const updatedPlan = await productionPlanService.calculateSchedule(id);
            // The API returns the updated plan, which now includes the calculated dates.
            // We need to merge this with our existing detailed state.
            setEditablePlan(prev => ({
                ...prev,
                ...updatedPlan, // This will overwrite top-level fields like proposedStartDate
                details: prev.details.map(detail => ({
                    ...detail,
                    ...updatedPlan.details[0] // Also update details if they changed
                }))
            }));
            toast.dismiss();
            toast.success('Đã tính toán và cập nhật lịch trình thành công!');
        } catch (err) {
            toast.dismiss();
            toast.error(err.message || 'Lỗi khi tính toán lịch trình.');
        } finally {
            setCalculating(false);
        }
    };

    const handleSubmit = async () => {
        if (!editablePlan || !editablePlan.details || editablePlan.details.length === 0) {
            setError('Không có chi tiết kế hoạch để lưu.');
            return;
        }

        // Validation
        if (!editablePlan.proposedStartDate || !editablePlan.proposedEndDate) {
            toast.error('Vui lòng chạy "Tính toán & Lập lịch" để có ngày bắt đầu và kết thúc trước khi gửi phê duyệt.');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const stages = editablePlan.details[0].stages;
            const updatePromises = stages.map(stage => {
                const stageData = {
                    plannedStartTime: stage.plannedStartTime || null,
                    plannedEndTime: stage.plannedEndTime || null,
                    assignedMachineId: stage.assignedMachineId ? parseInt(stage.assignedMachineId) : null,
                    inChargeUserId: stage.inChargeId ? parseInt(stage.inChargeId) : null,
                    qcUserId: stage.inspectionById ? parseInt(stage.inspectionById) : null,
                    notes: stage.notes || null
                };
                Object.keys(stageData).forEach(key => {
                    if (stageData[key] === null || stageData[key] === undefined || stageData[key] === '') {
                        delete stageData[key];
                    }
                });
                return productionPlanService.updateStage(stage.id, stageData);
            });

            await Promise.all(updatePromises);
            
            await productionPlanService.submitForApproval(editablePlan.id, "Đã cập nhật chi tiết kế hoạch.");
            
            setSuccess('Đã lưu và gửi kế hoạch cho giám đốc phê duyệt thành công!');
            setTimeout(() => navigate('/planning/lots'), 2000);

        } catch (err) {
            console.error('Submit plan failed', err);
            setError(err.message || 'Không thể gửi kế hoạch để duyệt.');
        } finally {
            setSubmitting(false);
        }
    };

    const mainDetail = editablePlan?.details?.[0] || {};
    const isReadOnly = editablePlan?.status !== 'DRAFT';

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <div className="production-plan-detail-page">
            <Header />
            <div className="d-flex">
                <InternalSidebar userRole="planning" />
                <div className="flex-grow-1">
                    <Container fluid className="p-4">
                        <div className="mb-4">
                            <h2 className="page-title">Lập Kế Hoạch Sản Xuất - {mainDetail.lotCode}</h2>
                            <p className="page-subtitle">{mainDetail.productName} - {mainDetail.sizeSnapshot || 'N/A'}</p>
                        </div>

                        {success && <Alert variant="success">{success}</Alert>}

                        <Card className="info-card">
                            <Card.Body>
                                <h3 className="card-title-custom">Thông Tin Chung</h3>
                                <Row>
                                    <Col md={4} className="form-group-custom">
                                        <Form.Label className="form-label-custom">Mã lô</Form.Label>
                                        <Form.Control type="text" readOnly disabled value={mainDetail.lotCode || ''} />
                                    </Col>
                                    <Col md={4} className="form-group-custom">
                                        <Form.Label className="form-label-custom">Tên sản phẩm</Form.Label>
                                        <Form.Control type="text" readOnly disabled value={mainDetail.productName || ''} />
                                    </Col>
                                    <Col md={4} className="form-group-custom">
                                        <Form.Label className="form-label-custom">Tổng số lượng</Form.Label>
                                        <Form.Control type="number" readOnly disabled value={mainDetail.plannedQuantity || ''} />
                                    </Col>
                                    <Col md={12} className="form-group-custom">
                                        <Form.Label className="form-label-custom">NVL tiêu hao (dự kiến)</Form.Label>
                                        <Form.Control as="textarea" readOnly disabled value={materialInfo} />
                                    </Col>
                                    <Col md={6} className="form-group-custom">
                                        <Form.Label className="form-label-custom">Ngày bắt đầu (dự kiến)</Form.Label>
                                        <Form.Control type="date" name="proposedStartDate" value={formatDateForInput(editablePlan.proposedStartDate)} readOnly disabled />
                                    </Col>
                                    <Col md={6} className="form-group-custom">
                                        <Form.Label className="form-label-custom">Ngày kết thúc (dự kiến)</Form.Label>
                                        <Form.Control type="date" name="proposedEndDate" value={formatDateForInput(editablePlan.proposedEndDate)} readOnly disabled />
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <div className="mt-4">
                          <Tabs defaultActiveKey={mainDetail.stages?.[0]?.stageType || 'WARPING'} id="production-plan-stages-tabs" className="mb-3" justify>
                            {mainDetail.stages?.map((stage, index) => (
                              <Tab eventKey={stage.stageType} title={`${index + 1}. ${getStageTypeName(stage.stageType)}`} key={stage.id}>
                                <div className="p-3 bg-light rounded">
                                    <Row>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Máy móc</Form.Label>
                                            <Form.Select value={stage.assignedMachineId || ''} onChange={(e) => handleStageChange(stage.id, 'assignedMachineId', e.target.value)} disabled={isReadOnly}>
                                                <option value="">Chọn máy</option>
                                                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </Form.Select>
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Người phụ trách</Form.Label>
                                            <Form.Select value={stage.inChargeId || ''} onChange={(e) => handleStageChange(stage.id, 'inChargeId', e.target.value)} disabled={isReadOnly}>
                                                <option value="">Chọn NV</option>
                                                {inChargeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </Form.Select>
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Người kiểm tra</Form.Label>
                                            <Form.Select value={stage.inspectionById || ''} onChange={(e) => handleStageChange(stage.id, 'inspectionById', e.target.value)} disabled={isReadOnly}>
                                                <option value="">Chọn QC</option>
                                                {qcUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </Form.Select>
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">TG bắt đầu</Form.Label>
                                            <Form.Control type="datetime-local" value={formatDateTimeForInput(stage.plannedStartTime)} onChange={(e) => handleStageChange(stage.id, 'plannedStartTime', e.target.value)} disabled={isReadOnly} />
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">TG kết thúc</Form.Label>
                                            <Form.Control type="datetime-local" value={formatDateTimeForInput(stage.plannedEndTime)} onChange={(e) => handleStageChange(stage.id, 'plannedEndTime', e.target.value)} disabled={isReadOnly} />
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Thời lượng (giờ)</Form.Label>
                                            <Form.Control type="number" value={stage.durationInHours || ''} onChange={(e) => handleStageChange(stage.id, 'durationInHours', e.target.value)} disabled={isReadOnly} />
                                        </Col>
                                        <Col md={12} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Ghi chú</Form.Label>
                                            <Form.Control as="textarea" rows={2} value={stage.notes || ''} onChange={(e) => handleStageChange(stage.id, 'notes', e.target.value)} disabled={isReadOnly} />
                                        </Col>
                                    </Row>
                                </div>
                              </Tab>
                            ))}
                          </Tabs>
                        </div>

                        {!isReadOnly && (
                            <div className="action-buttons">
                                <Button variant="light" onClick={() => navigate('/planning/lots')} disabled={submitting || calculating}>
                                    <FaTimes className="me-2" /> Hủy
                                </Button>
                                <Button variant="info" onClick={handleCalculateSchedule} disabled={submitting || calculating}>
                                    {calculating ? <Spinner as="span" animation="border" size="sm" /> : <FaPaperPlane className="me-2" />}
                                    {calculating ? 'Đang tính toán...' : 'Tính toán & Lập lịch'}
                                </Button>
                                <Button variant="primary" onClick={handleSubmit} disabled={submitting || calculating}>
                                    <FaPaperPlane className="me-2" />
                                    {submitting ? 'Đang gửi...' : 'Gửi phê duyệt'}
                                </Button>
                            </div>
                        )}
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default ProductionPlanDetail;
