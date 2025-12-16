import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Button, Alert, Spinner, Form, Row, Col, Table, Badge } from 'react-bootstrap';
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
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/ProductionPlanDetail.css';

registerLocale('vi', vi);



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

const formatDateTimeDisplay = (isoDate) => {
    if (!isoDate) return '—';
    try {
        return new Date(isoDate).toLocaleString('vi-VN');
    } catch (e) {
        return isoDate;
    }
};

const convertMinutesToHoursString = (minutes) => {
    if (minutes === null || minutes === undefined) return '';
    const hours = Number(minutes) / 60;
    if (!Number.isFinite(hours)) return '';
    return hours.toFixed(2);
};

const formatNumberValue = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return value;
    return numeric.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
};

const normalizeStage = (stage) => {
    if (!stage) return stage;
    const durationMinutes = stage.durationMinutes ?? stage.minRequiredDurationMinutes;
    return {
        ...stage,
        assignedMachineId: stage.assignedMachineId ?? stage.assignedMachine?.id ?? stage.assignedMachine ?? '',
        inChargeId: stage.inChargeId ?? stage.inChargeUserId ?? '',
        inspectionById: stage.inspectionById ?? stage.qcUserId ?? '',
        durationInHours: stage.durationInHours ?? (durationMinutes ? convertMinutesToHoursString(durationMinutes) : ''),
    };
};

const normalizeStages = (stages = []) => stages.map((stage) => normalizeStage(stage));

const DEFAULT_STAGE_TYPES = ['WARPING', 'WEAVING', 'DYEING', 'CUTTING', 'HEMMING', 'PACKAGING'];
const DEFAULT_STAGE_DURATION_MINUTES = 4 * 60;
const PROCESS_LEADER_KEYWORDS = ['product process leader', 'process leader'];
const PM_ROLE_KEYWORDS = ['production manager', 'pm'];
const USER_FETCH_SIZE = 200;
const isDyeingStageType = (stageType = '') => {
    const normalized = stageType ? stageType.toUpperCase() : '';
    return normalized === 'DYEING' || normalized === 'NHUOM';
};

const toDate = (value) => {
    if (!value) return null;
    try {
        return new Date(value);
    } catch (err) { }
    return null;
};

const toIsoString = (date) => (date instanceof Date ? date.toISOString() : null);

const addMinutes = (date, minutes) => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
};

const getDefaultProductionStart = () => {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setHours(8, 0, 0, 0);
    if (defaultStart <= now) {
        defaultStart.setDate(defaultStart.getDate() + 1);
    }
    return defaultStart;
};

const calculateDurationMinutes = (stage, plannedQuantity) => {
    if (stage?.minRequiredDurationMinutes) {
        return stage.minRequiredDurationMinutes;
    }
    if (stage?.capacityPerHour && plannedQuantity) {
        const capacity = Number(stage.capacityPerHour);
        if (!Number.isNaN(capacity) && capacity > 0) {
            const hours = Number(plannedQuantity) / capacity;
            if (!Number.isNaN(hours) && hours > 0) {
                return Math.round(hours * 60);
            }
        }
    }
    return DEFAULT_STAGE_DURATION_MINUTES;
};

const buildFallbackStages = () => {
    const timestamp = Date.now();
    return DEFAULT_STAGE_TYPES.map((type, index) =>
        normalizeStage({
            id: `new-stage-${timestamp}-${index + 1}`,
            stageType: type,
            sequenceNo: index + 1,
            status: 'PENDING',
        })
    );
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
    const [calculating, setCalculating] = useState(false);

    const [materialInfo, setMaterialInfo] = useState('Đang tính toán...');
    const [machines, setMachines] = useState([]);
    const [inChargeUsers, setInChargeUsers] = useState([]);
    const [qcUsers, setQcUsers] = useState([]);
    const [pmUsers, setPmUsers] = useState([]);
    // Removed suggestion states

    // State for active stage in stepper
    const [activeStageIndex, setActiveStageIndex] = useState(0);

    const replaceStageInEditablePlan = useCallback((updatedStage) => {
        if (!updatedStage) return;
        const normalizedStage = normalizeStage(updatedStage);
        setEditablePlan(prev => {
            if (!prev?.details?.length) {
                return prev;
            }
            const updatedDetails = prev.details.map(detail => ({
                ...detail,
                stages: detail.stages.map(stage =>
                    stage.id === normalizedStage.id ? { ...stage, ...normalizedStage } : stage
                )
            }));
            return {
                ...prev,
                details: updatedDetails
            };
        });
    }, []);

    const autoFillStageTimes = useCallback(async (planId, stages, plannedQuantity) => {
        if (!Array.isArray(stages) || stages.length === 0) return null;
        const sortedStages = [...stages].sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0));
        let timelineCursor = sortedStages.reduce((cursor, stage) => {
            const existingEnd = toDate(stage.plannedEndTime);
            if (existingEnd && (!cursor || existingEnd < cursor)) {
                return existingEnd;
            }
            return cursor;
        }, null);
        if (!timelineCursor) {
            timelineCursor = getDefaultProductionStart();
        }

        const updates = [];
        sortedStages.forEach(stage => {
            const hasStart = Boolean(stage.plannedStartTime);
            const hasEnd = Boolean(stage.plannedEndTime);
            if (hasStart && hasEnd) {
                timelineCursor = toDate(stage.plannedEndTime) || timelineCursor;
                return;
            }
            const durationMinutes = calculateDurationMinutes(stage, plannedQuantity);
            const startTime = hasStart ? toDate(stage.plannedStartTime) : new Date(timelineCursor);
            const endTime = hasEnd ? toDate(stage.plannedEndTime) : addMinutes(startTime, durationMinutes);
            timelineCursor = new Date(endTime);
            updates.push({
                stageId: stage.id,
                payload: {
                    plannedStartTime: toIsoString(startTime),
                    plannedEndTime: toIsoString(endTime),
                    minRequiredDurationMinutes: durationMinutes
                }
            });
        });

        if (updates.length === 0) {
            return null;
        }

        await Promise.all(
            updates.map(({ stageId, payload }) => productionPlanService.updateStage(stageId, payload))
        );
        const [updatedPlan, refreshedStages] = await Promise.all([
            productionPlanService.calculateSchedule(planId),
            productionPlanService.getPlanStages(planId)
        ]);
        return { updatedPlan, refreshedStages };
    }, []);

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
                userService.getAllUsers(0, USER_FETCH_SIZE, null, null, true),
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

            let planStages = [];
            if (Array.isArray(stagesData) && stagesData.length > 0) {
                planStages = normalizeStages(stagesData);
            } else if (planData.details && planData.details.length > 0) {
                const inlineStages = planData.details[0]?.stages || [];
                planStages = normalizeStages(inlineStages);
            }

            if (planStages.length === 0) {
                const mainProductItem = contractDetails?.orderItems?.[0];
                const mainProduct = mainProductItem ? productMap.get(mainProductItem.productId) : null;
                const totalContractQuantity = contractDetails?.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

                planData.productName = mainProduct?.name || 'Không có tên sản phẩm';
                planData.sizeSnapshot = mainProduct?.standardDimensions || 'Không có kích thước';
                planData.plannedQuantity = totalContractQuantity;

                planStages = buildFallbackStages();
            }

            const lotInfo = planData.lot || {};
            const lotCode = lotInfo.lotCode || planData.lotCode || planData.planCode?.replace('PP', 'BATCH') || '';
            const productName = lotInfo.productName || planData.productName || planData.details?.[0]?.productName || '';
            const sizeSnapshot = lotInfo.sizeSnapshot || planData.sizeSnapshot || planData.details?.[0]?.sizeSnapshot || '';
            const plannedQuantity = lotInfo.totalQuantity || planData.plannedQuantity || planData.details?.[0]?.plannedQuantity || 0;

            const hasMissingTimes = planStages.some(stage => !stage.plannedStartTime || !stage.plannedEndTime);
            if (hasMissingTimes && planData.status === 'DRAFT') {
                const autoFillResult = await autoFillStageTimes(planData.id, planStages, plannedQuantity);
                if (autoFillResult?.refreshedStages) {
                    planStages = normalizeStages(autoFillResult.refreshedStages);
                }
                if (autoFillResult?.updatedPlan) {
                    planData.proposedStartDate = autoFillResult.updatedPlan.proposedStartDate;
                    planData.proposedEndDate = autoFillResult.updatedPlan.proposedEndDate;
                }
            }

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
                    stages: planStages.map((stage) => ({ ...stage }))
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
                        stages: detail.stages ? normalizeStages(detail.stages) : planStages.map((stage) => ({ ...stage }))
                    };
                });
            }

            planData.lotCode = lotCode;
            planData.productName = productName || planData.details[0]?.productName;
            planData.sizeSnapshot = sizeSnapshot || planData.details[0]?.sizeSnapshot;

            setInitialPlan(planData);
            setEditablePlan(JSON.parse(JSON.stringify(planData)));

            const machinesArray = allMachines?.content || (Array.isArray(allMachines) ? allMachines : []);
            setMachines(machinesArray);

            const usersArray = allUsers?.content || (Array.isArray(allUsers) ? allUsers : []);
            const normalizeRole = (roleName) => (roleName ? roleName.toLowerCase() : '');
            const processLeaders = usersArray.filter(u => {
                const role = normalizeRole(u.roleName);
                return PROCESS_LEADER_KEYWORDS.some(keyword => role.includes(keyword));
            });
            const productionManagers = usersArray.filter(u => {
                const role = normalizeRole(u.roleName);
                return PM_ROLE_KEYWORDS.some(keyword => role.includes(keyword));
            });
            setInChargeUsers(processLeaders.length ? processLeaders : usersArray);
            setPmUsers(productionManagers.length ? productionManagers : processLeaders);
            setQcUsers(usersArray.filter(u => normalizeRole(u.roleName) === 'quality assurance department'));

        } catch (err) {
            console.error('Failed to load initial data', err);
            setError(err.message || 'Không thể tải dữ liệu cho kế hoạch sản xuất.');
            setMaterialInfo('Lỗi khi tải dữ liệu NVL.');
        } finally {
            setLoading(false);
        }
    }, [autoFillStageTimes, id]);

    useEffect(() => {
        if (id) {
            loadInitialData();
        }
    }, [id, loadInitialData]);

    // Removed machine suggestion handlers

    const handleStageChange = async (stageId, field, value) => {
        setEditablePlan(prev => {
            if (!prev?.details?.length) {
                return prev;
            }
            const updatedStages = prev.details[0].stages.map(stage => {
                if (stage.id === stageId) {
                    return { ...stage, [field]: value };
                }
                return stage;
            });
            return {
                ...prev,
                details: [{
                    ...prev.details[0],
                    stages: updatedStages
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
                toast.error(err.message || 'Lỗi khi gán người phụ trách.');
            }
        } else if (field === 'inspectionById') {
            try {
                await productionPlanService.updateStage(stageId, { qcUserId: value ? parseInt(value, 10) : null });
                toast.success('Đã cập nhật người kiểm tra.');
            } catch (err) {
                toast.error(err.message || 'Lỗi khi gán người kiểm tra.');
            }
        }
    };

    const handleCalculateSchedule = async () => {
        setCalculating(true);
        toast.loading('Đang tính toán lịch trình...');
        try {
            const updatedPlan = await productionPlanService.calculateSchedule(id);
            setEditablePlan(prev => {
                const merged = {
                    ...prev,
                    proposedStartDate: updatedPlan?.proposedStartDate ?? prev.proposedStartDate,
                    proposedEndDate: updatedPlan?.proposedEndDate ?? prev.proposedEndDate,
                    status: updatedPlan?.status ?? prev.status,
                };
                if (updatedPlan?.details?.length && prev.details?.length) {
                    merged.details = prev.details.map((detail, idx) => ({
                        ...detail,
                        plannedQuantity: updatedPlan.details[idx]?.plannedQuantity ?? detail.plannedQuantity,
                        lotCode: updatedPlan.details[idx]?.lotCode ?? detail.lotCode,
                        productName: updatedPlan.details[idx]?.productName ?? detail.productName,
                        stages: updatedPlan.details[idx]?.stages ? normalizeStages(updatedPlan.details[idx].stages) : detail.stages,
                    }));
                }
                return merged;
            });
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

        // Validate completeness of stages
        const stages = editablePlan.details[0].stages;
        for (const stage of stages) {
            const stageName = getStageTypeName(stage.stageType);
            if (!stage.inChargeId && !stage.inChargeUserId) {
                toast.error(`Công đoạn ${stageName} chưa có Người phụ trách.`);
                return;
            }
            if (!stage.inspectionById && !stage.qcUserId) {
                toast.error(`Công đoạn ${stageName} chưa có Người kiểm tra (QC).`);
                return;
            }
            if (!stage.plannedStartTime) {
                toast.error(`Công đoạn ${stageName} chưa có Thời gian bắt đầu.`);
                return;
            }
            if (!stage.plannedEndTime) {
                toast.error(`Công đoạn ${stageName} chưa có Thời gian kết thúc.`);
                return;
            }
            if (new Date(stage.plannedEndTime) <= new Date(stage.plannedStartTime)) {
                toast.error(`Công đoạn ${stageName}: Thời gian kết thúc phải sau thời gian bắt đầu.`);
                return;
            }
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
                if (stage.capacityPerHour) {
                    const capacityNumber = parseFloat(stage.capacityPerHour);
                    if (!Number.isNaN(capacityNumber)) {
                        stageData.capacityPerHour = capacityNumber;
                    }
                }
                if (stage.durationInHours) {
                    const durationNumber = parseFloat(stage.durationInHours);
                    if (!Number.isNaN(durationNumber)) {
                        stageData.minRequiredDurationMinutes = Math.round(durationNumber * 60);
                    }
                }
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
    const isReadOnly = editablePlan?.status !== 'DRAFT' && editablePlan?.status !== 'REJECTED';
    const isRejected = editablePlan?.status === 'REJECTED';

    // Get current active stage
    const activeStage = mainDetail.stages?.[activeStageIndex];

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
            <div className="production-plan-content-area">
                <InternalSidebar userRole="planning" />
                <div className="production-plan-main">
                    <div className="production-plan-container pt-4">
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
                                        <div className="custom-datepicker-wrapper">
                                            <DatePicker
                                                selected={editablePlan.proposedStartDate ? new Date(editablePlan.proposedStartDate) : null}
                                                dateFormat="dd/MM/yyyy"
                                                locale="vi"
                                                className="form-control"
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                    </Col>
                                    <Col md={6} className="form-group-custom">
                                        <Form.Label className="form-label-custom">Ngày kết thúc (dự kiến)</Form.Label>
                                        <div className="custom-datepicker-wrapper">
                                            <DatePicker
                                                selected={editablePlan.proposedEndDate ? new Date(editablePlan.proposedEndDate) : null}
                                                dateFormat="dd/MM/yyyy"
                                                locale="vi"
                                                className="form-control"
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Process Stepper */}
                        <div className="process-stepper">
                            {mainDetail.stages?.map((stage, index) => (
                                <div
                                    key={stage.id}
                                    className={`step-item ${index === activeStageIndex ? 'active' : ''}`}
                                    onClick={() => setActiveStageIndex(index)}
                                >
                                    <div className="step-circle">{index + 1}</div>
                                    <div className="step-label">{getStageTypeName(stage.stageType)}</div>
                                </div>
                            ))}
                        </div>

                        {/* Active Stage Content */}
                        {activeStage && (
                            <Card className="stage-card">
                                <Card.Body>
                                    <h3 className="card-title-custom">
                                        {activeStageIndex + 1}. {getStageTypeName(activeStage.stageType)}
                                    </h3>

                                    <Row>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Người phụ trách (Tự động phân bổ)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                readOnly
                                                disabled
                                                value={inChargeUsers.find(u => u.id === (activeStage.inChargeId || activeStage.inChargeUserId))?.name || 'Đang phân bổ...'}
                                            />
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Người kiểm tra (Tự động phân bổ)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                readOnly
                                                disabled
                                                value={qcUsers.find(u => u.id === (activeStage.inspectionById || activeStage.qcUserId))?.name || 'Đang phân bổ...'}
                                            />
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">TG bắt đầu</Form.Label>
                                            <div className="custom-datepicker-wrapper">
                                                <DatePicker
                                                    selected={activeStage.plannedStartTime ? new Date(activeStage.plannedStartTime) : null}
                                                    onChange={(date) => handleStageChange(activeStage.id, 'plannedStartTime', date ? date.toISOString() : null)}
                                                    showTimeSelect
                                                    dateFormat="dd/MM/yyyy HH:mm"
                                                    timeFormat="HH:mm"
                                                    locale="vi"
                                                    className="form-control"
                                                    placeholderText="dd/mm/yyyy HH:mm"
                                                    disabled
                                                />
                                            </div>
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">TG kết thúc</Form.Label>
                                            <div className="custom-datepicker-wrapper">
                                                <DatePicker
                                                    selected={activeStage.plannedEndTime ? new Date(activeStage.plannedEndTime) : null}
                                                    onChange={(date) => handleStageChange(activeStage.id, 'plannedEndTime', date ? date.toISOString() : null)}
                                                    showTimeSelect
                                                    dateFormat="dd/MM/yyyy HH:mm"
                                                    timeFormat="HH:mm"
                                                    locale="vi"
                                                    className="form-control"
                                                    placeholderText="dd/mm/yyyy HH:mm"
                                                    disabled
                                                />
                                            </div>
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Thời lượng (giờ) (8h/ngày)</Form.Label>
                                            <Form.Control type="number" readOnly value={activeStage.durationInHours || calculateDuration(activeStage.plannedStartTime, activeStage.plannedEndTime)} disabled />
                                        </Col>
                                        <Col md={12} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Ghi chú</Form.Label>
                                            <Form.Control as="textarea" rows={2} value={activeStage.notes || ''} onChange={(e) => handleStageChange(activeStage.id, 'notes', e.target.value)} disabled={isReadOnly} />
                                        </Col>
                                    </Row>

                                    {/* Suggestions Table Removed */}
                                    {/* Conflicts Alert Removed */}
                                </Card.Body>
                            </Card>
                        )}

                        {/* Action Bar (Static) */}
                        {!isReadOnly && (
                            <div className="action-bar">
                                <div className="d-flex justify-content-end gap-3">
                                    <Button variant="outline-secondary" onClick={() => navigate('/planning/lots')}>
                                        Hủy bỏ
                                    </Button>
                                    {/* Calculate Button Removed as per Auto-Assign Requirement */}
                                    <Button variant="success" onClick={handleSubmit} disabled={submitting}>
                                        {submitting ? <Spinner size="sm" animation="border" className="me-2" /> : <FaPaperPlane className="me-2" />}
                                        Gửi phê duyệt
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionPlanDetail;
