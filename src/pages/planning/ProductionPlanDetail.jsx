import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Button, Alert, Spinner, Form, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionPlanService } from '../../api/productionPlanService';
import { productService } from '../../api/productService';
import { userService } from '../../api/userService';
import { contractService } from '../../api/contractService';
import { machineService } from '../../api/machineService';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
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


const ProductionPlanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [initialPlan, setInitialPlan] = useState(null);
    const [editablePlan, setEditablePlan] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [materialInfo, setMaterialInfo] = useState('Đang tính toán...');
    const [machines, setMachines] = useState([]);
    const [inChargeUsers, setInChargeUsers] = useState([]);
    const [qcUsers, setQcUsers] = useState([]);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch plan data first to get the contractId
            const planData = await productionPlanService.getById(id);
            
            // Then fetch products, contract details, users, and material consumption in parallel
            const [allProducts, contractDetails, consumptionData, allUsers, allMachines] = await Promise.all([
                productService.getAllProducts(),
                contractService.getOrderDetails(planData.contractId),
                productionPlanService.getMaterialConsumption(id),
                userService.getAllUsers(),
                machineService.getAllMachines()
            ]);

            const productMap = new Map(allProducts.map(p => [p.id, p]));

            console.log("Fetched Plan Data:", planData);
            console.log("Fetched Contract Details:", contractDetails);
            console.log("Fetched Consumption Data:", consumptionData);

            // Format material consumption info
            if (consumptionData && consumptionData.materialSummaries?.length > 0) {
                const infoString = consumptionData.materialSummaries
                    .map(m => `${m.totalQuantityRequired.toLocaleString()} ${m.unit} ${m.materialName}`)
                    .join(', ');
                setMaterialInfo(infoString);
            } else {
                setMaterialInfo('Không có thông tin hoặc không cần NVL.');
            }

            // If details are null (for a new plan), create default stages based on Figma
            if (!planData.details || planData.details.length === 0) {
                const mainProductItem = contractDetails?.orderItems?.[0];
                const mainProduct = mainProductItem ? productMap.get(mainProductItem.productId) : null;
                const totalContractQuantity = contractDetails?.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                
                planData.productName = mainProduct?.name || 'Không có tên sản phẩm';
                planData.sizeSnapshot = mainProduct?.standardDimensions || 'Không có kích thước';
                planData.plannedQuantity = totalContractQuantity;

                planData.details = [{
                    id: `new-detail-${Date.now()}`,
                    lotCode: planData.planCode?.replace('PP', 'BATCH') || '',
                    productId: mainProduct?.id,
                    productName: planData.productName,
                    sizeSnapshot: planData.sizeSnapshot,
                    plannedQuantity: planData.plannedQuantity,
                    stages: [
                        { id: `new-stage-${Date.now()}-1`, stageType: 'Cường mác', status: 'PENDING' },
                        { id: `new-stage-${Date.now()}-2`, stageType: 'Dệt', status: 'PENDING' },
                        { id: `new-stage-${Date.now()}-3`, stageType: 'Nhuộm', status: 'PENDING' },
                        { id: `new-stage-${Date.now()}-4`, stageType: 'Cắt', status: 'PENDING' },
                        { id: `new-stage-${Date.now()}-5`, stageType: 'May', status: 'PENDING' },
                        { id: `new-stage-${Date.now()}-6`, stageType: 'Đóng gói', status: 'PENDING' },
                    ]
                }];
                console.log("Created mock stages with real product info:", planData);
            } else {
                // For existing plans, enrich details with sizeSnapshot
                planData.details = planData.details.map(detail => {
                    const product = productMap.get(detail.productId);
                    return {
                        ...detail,
                        sizeSnapshot: product?.standardDimensions || 'Không có kích thước'
                    };
                });
            }

            setInitialPlan(planData);
            setEditablePlan(JSON.parse(JSON.stringify(planData))); // Deep copy for editing

            setMachines(allMachines);

            // Filter users by role
            setInChargeUsers(allUsers.filter(u => u.roleName && (u.roleName.toLowerCase().includes('worker') || u.roleName.toLowerCase().includes('planning'))));
            setQcUsers(allUsers.filter(u => u.roleName && u.roleName.toLowerCase() === 'quality assurance department'));

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

    const handlePlanInfoChange = (e) => {
        const { name, value } = e.target;
        setEditablePlan(prev => ({
            ...prev,
            details: [{
                ...prev.details[0],
                [name]: value
            }]
        }));
    };

    const handleStageChange = (stageId, field, value) => {
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
    };

    const handleSubmit = async () => {
        if (!editablePlan || !editablePlan.details || editablePlan.details.length === 0) {
            setError('Không có chi tiết kế hoạch để lưu.');
            return;
        }
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            // Step 1: Save all stage details
            const stages = editablePlan.details[0].stages;
            const updatePromises = stages.map(stage => {
                // The API expects a specific request body, not the whole stage object
                const stageData = {
                    stageType: stage.stageType,
                    sequenceNo: stage.sequenceNo,
                    assignedMachineId: stage.assignedMachineId,
                    inChargeUserId: stage.inChargeId, // The API might expect inChargeUserId
                    qcUserId: stage.inspectionById, // The API might expect qcUserId
                    plannedStartTime: stage.plannedStartTime,
                    plannedEndTime: stage.plannedEndTime,
                    notes: stage.notes,
                    durationMinutes: stage.durationInHours ? stage.durationInHours * 60 : null
                };
                return productionPlanService.updateStage(stage.id, stageData);
            });

            await Promise.all(updatePromises);
            console.log("All stages saved successfully.");

            // Step 2: Submit the plan for approval
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
                                        <Form.Label className="form-label-custom">Ngày bắt đầu *</Form.Label>
                                        <Form.Control type="date" name="proposedStartDate" value={formatDateForInput(mainDetail.proposedStartDate)} onChange={handlePlanInfoChange} readOnly={isReadOnly} />
                                    </Col>
                                    <Col md={6} className="form-group-custom">
                                        <Form.Label className="form-label-custom">Ngày kết thúc *</Form.Label>
                                        <Form.Control type="date" name="proposedEndDate" value={formatDateForInput(mainDetail.proposedEndDate)} onChange={handlePlanInfoChange} readOnly={isReadOnly} />
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <h3 className="card-title-custom mt-4">Chi Tiết Công Đoạn</h3>
                        {mainDetail.stages?.map((stage, index) => (
                            <Card key={stage.id} className="stage-card">
                                <Card.Body>
                                    <h4 className="card-title-custom">{index + 1}. {stage.stageType}</h4>
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
                                </Card.Body>
                            </Card>
                        ))}

                        {!isReadOnly && (
                            <div className="action-buttons">
                                <Button variant="light" onClick={() => navigate('/planning/lots')} disabled={submitting}>
                                    <FaTimes className="me-2" /> Hủy
                                </Button>
                                <Button variant="dark" onClick={handleSubmit} disabled={submitting}>
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
