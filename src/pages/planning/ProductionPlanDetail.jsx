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
import '../../styles/ProductionPlanDetail.css';

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
    const [stageSuggestions, setStageSuggestions] = useState({});
    const [stageSuggestionsLoading, setStageSuggestionsLoading] = useState({});
    const [stageConflicts, setStageConflicts] = useState({});
    const [stageConflictsLoading, setStageConflictsLoading] = useState({});
    const [stageActionLoading, setStageActionLoading] = useState({});

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
                userService.getAllUsers(0, USER_FETCH_SIZE),
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
            setStageSuggestions({});
            setStageSuggestionsLoading({});
            setStageConflicts({});
            setStageConflictsLoading({});
            setStageActionLoading({});

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

    const handleFetchMachineSuggestions = async (stageId) => {
        setStageSuggestionsLoading(prev => ({ ...prev, [stageId]: true }));
        try {
            const suggestions = await productionPlanService.getMachineSuggestions(stageId);
            setStageSuggestions(prev => ({ ...prev, [stageId]: suggestions || [] }));
            if (suggestions && suggestions.length > 0) {
                toast.success('Đã tải gợi ý máy cho công đoạn.');
            } else {
                toast('Không có gợi ý phù hợp cho công đoạn này.');
            }
        } catch (err) {
            console.error('Failed to fetch machine suggestions', err);
            toast.error(err.message || 'Không thể lấy gợi ý máy.');
        } finally {
            setStageSuggestionsLoading(prev => ({ ...prev, [stageId]: false }));
        }
    };

    const handleApplySuggestion = async (stageId, suggestion) => {
        if (!suggestion) return;
        setStageActionLoading(prev => ({ ...prev, [stageId]: true }));
        try {
            const stagePayload = {};
            if (suggestion.machineId) {
                stagePayload.assignedMachineId = suggestion.machineId;
            }
            if (suggestion.suggestedStartTime) {
                stagePayload.plannedStartTime = suggestion.suggestedStartTime;
            }
            if (suggestion.suggestedEndTime) {
                stagePayload.plannedEndTime = suggestion.suggestedEndTime;
            }
            if (suggestion.capacityPerHour) {
                stagePayload.capacityPerHour = suggestion.capacityPerHour;
            }
            if (suggestion.estimatedDurationHours) {
                const estimated = Number(suggestion.estimatedDurationHours);
                if (!Number.isNaN(estimated)) {
                    stagePayload.minRequiredDurationMinutes = Math.round(estimated * 60);
                }
            }
            const updatedStage = await productionPlanService.updateStage(stageId, stagePayload);
            replaceStageInEditablePlan(updatedStage);
            toast.success('Đã áp dụng gợi ý máy.');
        } catch (err) {
            console.error('Failed to apply suggestion', err);
            toast.error(err.message || 'Không thể áp dụng gợi ý máy.');
        } finally {
            setStageActionLoading(prev => ({ ...prev, [stageId]: false }));
        }
    };

    const handleCheckConflicts = async (stageId) => {
        setStageConflictsLoading(prev => ({ ...prev, [stageId]: true }));
        try {
            const conflicts = await productionPlanService.checkConflicts(stageId);
            setStageConflicts(prev => ({ ...prev, [stageId]: conflicts || [] }));
            if (conflicts && conflicts.length > 0) {
                toast.error('Phát hiện xung đột lịch cho công đoạn.');
            } else {
                toast.success('Không có xung đột cho công đoạn này.');
            }
        } catch (err) {
            console.error('Failed to check conflicts', err);
            toast.error(err.message || 'Không thể kiểm tra xung đột.');
        } finally {
            setStageConflictsLoading(prev => ({ ...prev, [stageId]: false }));
        }
    };

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

        // Validate required fields for all stages
        const stages = editablePlan.details[0].stages;
        for (const stage of stages) {
            if (!stage.inChargeId) {
                toast.error(`Công đoạn ${getStageTypeName(stage.stageType)} chưa có Người phụ trách.`);
                return;
            }
            if (!stage.inspectionById) {
                toast.error(`Công đoạn ${getStageTypeName(stage.stageType)} chưa có Người kiểm tra.`);
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
                                        <Form.Control type="date" name="proposedStartDate" value={formatDateForInput(editablePlan.proposedStartDate)} readOnly disabled />
                                    </Col>
                                    <Col md={6} className="form-group-custom">
                                        <Form.Label className="form-label-custom">Ngày kết thúc (dự kiến)</Form.Label>
                                        <Form.Control type="date" name="proposedEndDate" value={formatDateForInput(editablePlan.proposedEndDate)} readOnly disabled />
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

                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleFetchMachineSuggestions(activeStage.id)}
                                            disabled={isReadOnly || stageSuggestionsLoading[activeStage.id]}
                                        >
                                            {stageSuggestionsLoading[activeStage.id] ? <Spinner size="sm" animation="border" /> : 'Gợi ý máy'}
                                        </Button>
                                        <Button
                                            variant="outline-warning"
                                            size="sm"
                                            onClick={() => handleCheckConflicts(activeStage.id)}
                                            disabled={isReadOnly || stageConflictsLoading[activeStage.id]}
                                        >
                                            {stageConflictsLoading[activeStage.id] ? <Spinner size="sm" animation="border" /> : 'Kiểm tra xung đột'}
                                        </Button>
                                    </div>

                                    <Row>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Người phụ trách</Form.Label>
                                            <Form.Select
                                                value={activeStage.inChargeId || ''}
                                                onChange={(e) => handleStageChange(activeStage.id, 'inChargeId', e.target.value)}
                                                disabled={isReadOnly}
                                            >
                                                <option value="">
                                                    {isDyeingStageType(activeStage.stageType) ? 'Chọn PM' : 'Chọn NV'}
                                                </option>
                                                {(isDyeingStageType(activeStage.stageType) ? (pmUsers.length ? pmUsers : inChargeUsers) : inChargeUsers)
                                                    .map(u => (
                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                    ))}
                                            </Form.Select>
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Người kiểm tra</Form.Label>
                                            <Form.Select value={activeStage.inspectionById || ''} onChange={(e) => handleStageChange(activeStage.id, 'inspectionById', e.target.value)} disabled={isReadOnly}>
                                                <option value="">Chọn QC</option>
                                                {qcUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </Form.Select>
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">TG bắt đầu</Form.Label>
                                            <Form.Control type="datetime-local" value={formatDateTimeForInput(activeStage.plannedStartTime)} onChange={(e) => handleStageChange(activeStage.id, 'plannedStartTime', e.target.value)} disabled={isReadOnly} />
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">TG kết thúc</Form.Label>
                                            <Form.Control type="datetime-local" value={formatDateTimeForInput(activeStage.plannedEndTime)} onChange={(e) => handleStageChange(activeStage.id, 'plannedEndTime', e.target.value)} disabled={isReadOnly} />
                                        </Col>
                                        <Col md={4} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Thời lượng (giờ)</Form.Label>
                                            <Form.Control type="number" value={activeStage.durationInHours || ''} onChange={(e) => handleStageChange(activeStage.id, 'durationInHours', e.target.value)} disabled={isReadOnly} />
                                        </Col>
                                        <Col md={12} className="form-group-custom">
                                            <Form.Label className="form-label-custom">Ghi chú</Form.Label>
                                            <Form.Control as="textarea" rows={2} value={activeStage.notes || ''} onChange={(e) => handleStageChange(activeStage.id, 'notes', e.target.value)} disabled={isReadOnly} />
                                        </Col>
                                    </Row>

                                    {/* Suggestions Table */}
                                    {stageSuggestions[activeStage.id] && stageSuggestions[activeStage.id].length > 0 && (
                                        <div className="mt-3">
                                            <h6 className="mb-2">Gợi ý máy móc</h6>
                                            <Table responsive bordered size="sm">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Máy / Vendor</th>
                                                        <th>Năng suất</th>
                                                        <th>Ưu tiên</th>
                                                        <th>Thời gian gợi ý</th>
                                                        <th>Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stageSuggestions[activeStage.id].map((suggestion) => (
                                                        <tr key={`${activeStage.id}-${suggestion.machineId || suggestion.machineCode}`}>
                                                            <td>
                                                                <div className="fw-semibold">{suggestion.machineName || 'N/A'}</div>
                                                                <div className="text-muted small">{suggestion.machineCode || '—'}</div>
                                                            </td>
                                                            <td>
                                                                {formatNumberValue(suggestion.capacityPerHour)} /h
                                                                <div className="small text-muted">
                                                                    Ước tính: {formatNumberValue(suggestion.estimatedDurationHours)} giờ
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <Badge bg={suggestion.available ? 'success' : 'secondary'}>
                                                                    {suggestion.priorityScore ? suggestion.priorityScore.toFixed(0) : '—'}
                                                                </Badge>
                                                                <div className="small text-muted">
                                                                    {suggestion.available ? 'Sẵn sàng' : 'Bận'}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="small">
                                                                    <div>BĐ: {formatDateTimeDisplay(suggestion.suggestedStartTime)}</div>
                                                                    <div>KT: {formatDateTimeDisplay(suggestion.suggestedEndTime)}</div>
                                                                </div>
                                                                {suggestion.conflicts && suggestion.conflicts.length > 0 && (
                                                                    <div className="text-danger small mt-1">
                                                                        {suggestion.conflicts[0]}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    onClick={() => handleApplySuggestion(activeStage.id, suggestion)}
                                                                    disabled={isReadOnly || stageActionLoading[activeStage.id]}
                                                                >
                                                                    {stageActionLoading[activeStage.id] ? <Spinner size="sm" animation="border" /> : 'Áp dụng'}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}

                                    {/* Conflicts Alert */}
                                    {stageConflicts[activeStage.id] && (
                                        <Alert variant={stageConflicts[activeStage.id].length ? 'warning' : 'success'} className="mt-3">
                                            {stageConflicts[activeStage.id].length ? (
                                                <>
                                                    <strong>Phát hiện xung đột:</strong>
                                                    <ul className="mb-0">
                                                        {stageConflicts[activeStage.id].map((conflict, idx) => (
                                                            <li key={`${activeStage.id}-conflict-${idx}`}>{conflict}</li>
                                                        ))}
                                                    </ul>
                                                </>
                                            ) : (
                                                'Không có xung đột nào được phát hiện.'
                                            )}
                                        </Alert>
                                    )}
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
                                    <Button variant="primary" onClick={handleCalculateSchedule} disabled={calculating}>
                                        {calculating ? <Spinner size="sm" animation="border" className="me-2" /> : null}
                                        Tính toán & Lập lịch
                                    </Button>
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
