import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Button, ProgressBar, Table, Badge, Form, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { executionService } from '../../api/executionService';
import { orderService } from '../../api/orderService';
import { getStatusLabel, getStageTypeName, getStatusVariant } from '../../utils/statusMapper';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/constants';
import { useWebSocketContext } from '../../context/WebSocketContext';

// Mapping checkpoint names from English to Vietnamese
const CHECKPOINT_NAME_MAP = {
  // WARPING/CUONG_MAC
  'Yarn quality': 'Chất lượng sợi',
  'Consistent tension': 'Độ căng sợi',
  'Even warping': 'Sợi mắc đều',
  'Warp width & length': 'Khổ & chiều dài cây sợi',
  'Warp width and length': 'Khổ & chiều dài cây sợi',

  // WEAVING/DET
  'Warp strength': 'Độ bền sợi nền',
  'Towel shape': 'Hình dáng khăn',
  'Fabric surface': 'Bề mặt vải',
  'Surface quality': 'Bề mặt vải',
  'Fabric density': 'Mật độ vải',
  'Fabric width': 'Khổ vải',
  'Weave quality': 'Chất lượng dệt',
  'Thread count': 'Số sợi',

  // DYEING/NHUOM
  'Color accuracy': 'Màu sắc chuẩn',
  'Color fastness': 'Độ bền màu',
  'Color bleeding': 'Vết loang/đốm',
  'Stains/Spots': 'Vết loang/đốm',
  'Color uniformity': 'Đồng đều màu sắc',
  'Dye penetration': 'Độ thấm màu',
  'Color matching': 'Khớp màu',

  // CUTTING/CAT
  'Standard size': 'Kích thước chuẩn',
  'Clean cut': 'Đường cắt sạch',
  'Cutting accuracy': 'Độ chính xác cắt',
  'Size accuracy': 'Độ chính xác kích thước',
  'Edge quality': 'Chất lượng mép cắt',
  'Cutting line': 'Đường cắt',

  // HEMMING/MAY
  'Straight seam': 'Đường may thẳng',
  'Stitch density': 'Mật độ mũi chỉ',
  'Sewing quality': 'Chất lượng may',
  'Seam strength': 'Độ bền đường may',
  'Thread tension': 'Độ căng chỉ',
  'Hem quality': 'Chất lượng viền',
  'Stitch consistency': 'Đồng đều mũi chỉ',

  // PACKAGING/DONG_GOI
  'Complete accessories': 'Đủ phụ kiện kèm',
  'Label accuracy': 'Tem/nhãn đúng chuẩn',
  'Packaging quality': 'Chất lượng đóng gói',
  'Package integrity': 'Độ nguyên vẹn bao bì',
  'Label placement': 'Vị trí tem/nhãn',
  'Quantity check': 'Kiểm tra số lượng',
  'Packaging material': 'Chất liệu đóng gói',
};

// Function to translate checkpoint name to Vietnamese
const translateCheckpointName = (name) => {
  if (!name) return name;

  // If already in Vietnamese (contains Vietnamese characters), return as is
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(name)) {
    return name;
  }

  // Check exact match first
  if (CHECKPOINT_NAME_MAP[name]) {
    return CHECKPOINT_NAME_MAP[name];
  }

  // Check case-insensitive match
  const lowerName = name.toLowerCase().trim();
  for (const [en, vi] of Object.entries(CHECKPOINT_NAME_MAP)) {
    if (en.toLowerCase() === lowerName) {
      return vi;
    }
  }

  // Try partial matching for common patterns
  const partialMatches = {
    'yarn': 'Chất lượng sợi',
    'tension': 'Độ căng sợi',
    'warping': 'Sợi mắc đều',
    'warp': 'Sợi nền',
    'fabric density': 'Mật độ vải',
    'fabric width': 'Khổ vải',
    'fabric surface': 'Bề mặt vải',
    'fabric': 'Vải',
    'towel': 'Khăn',
    'shape': 'Hình dáng',
    'color': 'Màu sắc',
    'dyeing': 'Nhuộm',
    'cut': 'Cắt',
    'cutting': 'Cắt',
    'size': 'Kích thước',
    'seam': 'Đường may',
    'stitch': 'Mũi chỉ',
    'hemming': 'May',
    'sewing': 'May',
    'packaging': 'Đóng gói',
    'label': 'Tem/nhãn',
    'accessories': 'Phụ kiện',
  };

  // Try to find partial match
  for (const [keyword, translation] of Object.entries(partialMatches)) {
    if (lowerName.includes(keyword)) {
      if (lowerName === keyword) {
        return translation;
      }
      if (lowerName.includes('fabric density')) return 'Mật độ vải';
      if (lowerName.includes('fabric width')) return 'Khổ vải';
      if (lowerName.includes('fabric surface')) return 'Bề mặt vải';
      if (lowerName.includes('towel shape')) return 'Hình dáng khăn';
      if (lowerName.includes('color accuracy')) return 'Màu sắc chuẩn';
      if (lowerName.includes('color fastness')) return 'Độ bền màu';
      if (lowerName.includes('straight seam')) return 'Đường may thẳng';
      if (lowerName.includes('stitch density')) return 'Mật độ mũi chỉ';
    }
  }

  return name;
};

const formatPhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // If it looks like a domain but missing protocol
  if (url.includes('railway.app') || url.includes('localhost')) {
    return `https://${url}`;
  }
  // Otherwise assume relative path
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const StageProgressDetail = () => {
  const navigate = useNavigate();
  const { stageId } = useParams();
  // Get userId from sessionStorage (PM User)
  const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
  const [stageData, setStageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressInput, setProgressInput] = useState('');
  const [qcCheckpoints, setQcCheckpoints] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [elapsedDisplay, setElapsedDisplay] = useState('0.0 giờ');

  const formatTimestamp = (value) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString('vi-VN');
    } catch {
      return value;
    }
  };

  const mapTrackingAction = (action) => {
    switch (action) {
      case 'START':
        return 'Bắt đầu';
      case 'UPDATE_PROGRESS':
        return 'Cập nhật tiến độ';
      case 'COMPLETE':
        return 'Hoàn thành';
      case 'RESUME':
        return 'Tiếp tục';
      case 'PAUSE':
        return 'Tạm dừng';
      default:
        return action || 'Không xác định';
    }
  };

  const formatTrackingProgress = (tracking) => {
    if (tracking?.quantityCompleted === null || tracking?.quantityCompleted === undefined) {
      return '-';
    }
    return `${tracking.quantityCompleted}%`;
  };

  const loadStageTrackings = async (targetStageId) => {
    if (!targetStageId) {
      setHistory([]);
      return;
    }
    try {
      setHistoryLoading(true);
      const trackings = await executionService.getStageTrackings(targetStageId);
      const mappedHistory = (trackings || []).map((tracking) => ({
        id: tracking.id,
        action: mapTrackingAction(tracking.action),
        progress: formatTrackingProgress(tracking),
        timestamp: formatTimestamp(tracking.timestamp),
        operator: tracking.operatorName || 'Không xác định',
        notes: tracking.notes || '',
        isRework: tracking.isRework, // Map isRework
      }));
      setHistory(mappedHistory);
    } catch (err) {
      console.error('Error loading stage trackings:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const fetchStage = async () => {
      if (!stageId) {
        console.error('Stage ID is missing');
        toast.error('Không tìm thấy ID công đoạn');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching stage:', stageId);

        const stage = await productionService.getStage(stageId);

        // Fetch order info separately if needed (for orderCode, productName, quantity)
        let orderInfo = { orderCode: 'N/A', productName: 'N/A', quantity: 0 };
        if (stage.productionOrderId) {
          try {
            const orderData = await orderService.getOrderById(stage.productionOrderId);
            orderInfo = {
              orderCode: orderData.lotCode || orderData.poNumber || 'N/A',
              productName: orderData.productName || orderData.contract?.contractNumber || 'N/A',
              quantity: orderData.totalQuantity || 0
            };
          } catch (err) {
            console.warn('Could not fetch order info:', err);
          }
        }

        // Fetch QC checkpoints for all stages (to show inspection results)
        let checkpoints = [];
        let inspections = [];
        try {
          const [cpData, inspectionData] = await Promise.all([
            executionService.getStageCheckpoints(stageId),
            executionService.getStageInspections(stageId)
          ]);
          checkpoints = cpData || [];
          inspections = inspectionData || [];
        } catch (err) {
          console.warn('Could not fetch QC data:', err);
        }

        // Merge checkpoints with inspection results
        const mergedCheckpoints = checkpoints.map(cp => {
          const inspection = inspections.find(i => i.qcCheckpointId === cp.id);
          return {
            ...cp,
            result: inspection ? inspection.result : null,
            notes: inspection ? inspection.notes : '',
            photoUrl: inspection ? inspection.photoUrl : ''
          };
        });

        setQcCheckpoints(mergedCheckpoints);
        await loadStageTrackings(stage.id);

        // Map backend data to match UI structure
        const mapped = {
          productionOrderId: stage.productionOrderId,
          orderCode: orderInfo.orderCode || 'N/A',
          productName: orderInfo.productName || 'N/A',
          quantity: orderInfo.quantity || 0,
          stageName: getStageTypeName(stage.stageType) || stage.stageType || 'N/A',
          responsiblePerson: stage.assignedLeader?.fullName ||
            stage.assigneeName ||
            'Chưa phân công',
          plannedDurationHours: stage.plannedDurationHours ? Number(stage.plannedDurationHours) : 0,
          progressPercent: stage.progressPercent || 0,
          remainingHours: stage.remainingHours ? Number(stage.remainingHours) : 0,
          status: stage.executionStatus || stage.status || 'PENDING',
          workedHours: stage.totalHours ? Number(stage.totalHours) :
            (stage.workedHours ? Number(stage.workedHours) : 0),
          stageStartTime: stage.startAt || stage.startTimeFormatted || null,
          stageEndTime: stage.completeAt || stage.endTimeFormatted || null,
          defectLevel: stage.defectLevel,
          defectSeverity: stage.defectSeverity,
          history: [] // Backend chưa có history API
        };
        console.log('Mapped stage data:', mapped);
        console.log('Stage data keys:', Object.keys(mapped));
        setStageData(mapped);
        setError(null);
      } catch (error) {
        console.error('Error fetching stage:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data,
          stageId: stageId
        });

        let errorMessage = 'Không thể tải thông tin công đoạn';
        if (error.response?.status === 404 || error.response?.status === 500) {
          errorMessage = `Không tìm thấy công đoạn với ID: ${stageId}`;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        setError(errorMessage);
        setStageData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStage();
  }, [stageId, refreshKey]);

  useEffect(() => {
    let intervalId;
    if (stageData?.stageStartTime && !stageData?.stageEndTime) {
      const updateElapsed = () => {
        const start = new Date(stageData.stageStartTime);
        const now = new Date();
        if (!isNaN(start.getTime())) {
          const diffMs = now - start;
          const hours = diffMs / (1000 * 60 * 60);
          const formatted = hours < 1
            ? `${(hours * 60).toFixed(0)} phút`
            : `${hours.toFixed(1)} giờ`;
          setElapsedDisplay(formatted);
        }
      };
      updateElapsed();
      intervalId = setInterval(updateElapsed, 60000);
    } else if (stageData?.stageStartTime && stageData?.stageEndTime) {
      const start = new Date(stageData.stageStartTime);
      const end = new Date(stageData.stageEndTime);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        const diffMs = end - start;
        const hours = diffMs / (1000 * 60 * 60);
        setElapsedDisplay(hours < 1 ? `${(hours * 60).toFixed(0)} phút` : `${hours.toFixed(1)} giờ`);
      } else {
        setElapsedDisplay('0.0 giờ');
      }
    } else if (stageData?.workedHours) {
      setElapsedDisplay(`${Number(stageData.workedHours).toFixed(1)} giờ`);
    } else {
      setElapsedDisplay('0.0 giờ');
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [stageData?.stageStartTime, stageData?.stageEndTime, stageData?.workedHours]);

  // Polling for real-time history updates (every 1 seconds)
  useEffect(() => {
    if (!stageId) return;

    const pollHistory = async () => {
      // Don't set loading state to avoid UI flickering
      try {
        const trackings = await executionService.getStageTrackings(stageId);
        const mappedHistory = (trackings || []).map((tracking) => ({
          id: tracking.id,
          action: mapTrackingAction(tracking.action),
          progress: formatTrackingProgress(tracking),
          timestamp: formatTimestamp(tracking.timestamp),
          operator: tracking.operatorName || 'Không xác định',
          notes: tracking.notes || '',
          isRework: tracking.isRework,
        }));

        // Only update if data has changed to avoid unnecessary re-renders
        setHistory(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(mappedHistory)) {
            return mappedHistory;
          }
          return prev;
        });
      } catch (err) {
        console.error('Error polling stage trackings:', err);
      }
    };

    const intervalId = setInterval(pollHistory, 1000); // Poll every 1 seconds

    return () => clearInterval(intervalId);
  }, [stageId]);

  // WebSocket subscription for real-time updates
  const { subscribe } = useWebSocketContext();
  useEffect(() => {
    const unsubscribe = subscribe('/topic/updates', (update) => {
      if (['PRODUCTION_STAGE', 'QUALITY_ISSUE'].includes(update.entity)) {
        console.log('[StageProgressDetail] Received update, refreshing...', update);
        setRefreshKey(prev => prev + 1);
      }
    });
    return () => unsubscribe();
  }, [subscribe]);

  // Window focus refetch - refresh when user switches back to tab
  useEffect(() => {
    const handleFocus = () => {
      console.log('[StageProgressDetail] Window focused, refreshing...');
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleBack = () => {
    if (stageData?.productionOrderId) {
      navigate(`/production/orders/${stageData.productionOrderId}`);
    } else {
      navigate('/production/orders');
    }
  };

  const handleStartStage = async () => {
    if (!stageId || !userId) {
      toast.error('Thiếu thông tin để bắt đầu công đoạn');
      return;
    }
    try {
      await executionService.startStage(stageId, userId);
      toast.success('Đã bắt đầu công đoạn');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error starting stage:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi bắt đầu công đoạn');
    }
  };

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS (Rules of Hooks)
  // Check if this is DYEING stage managed by PM
  const isDyeingStage = stageData?.stageName === 'Nhuộm' || stageData?.stageName === 'DYEING';

  // Enable manual update only for DYEING stage (NHUOM) managed by PM
  const isManualUpdateEnabled = isDyeingStage &&
    (stageData?.status === 'WAITING' || stageData?.status === 'READY' || stageData?.status === 'IN_PROGRESS');

  // Check if PM can start the DYEING stage (enabled when WAITING, READY, WAITING_REWORK)
  const canStartDyeing = isDyeingStage &&
    (stageData?.status === 'WAITING' || stageData?.status === 'READY' || stageData?.status === 'READY_TO_PRODUCE' || stageData?.status === 'WAITING_REWORK');

  // Check if stage is pending (disabled state)
  const isDyeingPending = isDyeingStage && stageData?.status === 'PENDING';

  // Check if PM can update progress
  const canUpdateProgress = isDyeingStage &&
    (stageData?.status === 'IN_PROGRESS' || stageData?.status === 'REWORK_IN_PROGRESS') &&
    stageData?.progressPercent < 100;

  // Map QC checkpoints from API response
  const qaCriteria = qcCheckpoints.map(cp => ({
    title: translateCheckpointName(cp.checkpointName || cp.name),
    result: cp.result, // Don't default to PASS
    image: formatPhotoUrl(cp.photoUrl || cp.imageUrl),
    remark: cp.notes || cp.remark
  }));

  const infoFields = useMemo(
    () => {
      if (!stageData) return [];
      return [
        { label: 'Công đoạn', value: stageData.stageName || 'N/A' },
        {
          label: 'Thời gian bắt đầu công đoạn',
          value: stageData.stageStartTime ?
            (() => {
              try {
                if (typeof stageData.stageStartTime === 'string') {
                  const date = new Date(stageData.stageStartTime);
                  return isNaN(date.getTime()) ? stageData.stageStartTime : date.toLocaleString('vi-VN');
                }
                return stageData.stageStartTime;
              } catch {
                return stageData.stageStartTime || 'Chưa bắt đầu';
              }
            })() :
            'Chưa bắt đầu'
        },
        {
          label: 'Thời gian kết thúc công đoạn',
          value: stageData.stageEndTime ?
            (() => {
              try {
                if (typeof stageData.stageEndTime === 'string') {
                  const date = new Date(stageData.stageEndTime);
                  return isNaN(date.getTime()) ? stageData.stageEndTime : date.toLocaleString('vi-VN');
                }
                return stageData.stageEndTime;
              } catch {
                return stageData.stageEndTime || 'Chưa hoàn thành';
              }
            })() :
            'Chưa hoàn thành'
        },
        { label: 'Thời gian đã làm', value: elapsedDisplay },
        { label: 'Người phụ trách', value: stageData.responsiblePerson },
      ];
    },
    [stageData],
  );

  const statusConfig = useMemo(() => {
    if (!stageData) return { label: 'N/A', variant: 'secondary' };
    const statusLabel = getStatusLabel(stageData.status);
    const variant = getStatusVariant(stageData.status);
    return { label: statusLabel, variant };
  }, [stageData?.status]);

  // NOW WE CAN DO EARLY RETURNS AFTER ALL HOOKS
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error || !stageData) {
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="production" />
          <Container fluid className="p-4">
            <Button variant="link" onClick={handleBack}>&larr; Quay lại</Button>
            <div className={`alert mt-3 ${error ? 'alert-danger' : 'alert-warning'}`}>
              {error || 'Không tìm thấy thông tin công đoạn'}
              {stageData && (
                <div className="mt-2">
                  <small>Debug info: {JSON.stringify(stageData, null, 2)}</small>
                </div>
              )}
            </div>
          </Container>
        </div>
      </div>
    );
  }

  const handleUpdateProgress = async () => {
    if (!stageId) return;
    const target = Number(progressInput);
    if (Number.isNaN(target) || target < 0 || target > 100) {
      toast.error('Vui lòng nhập tiến độ từ 0 đến 100');
      return;
    }
    if (target <= (stageData.progressPercent || 0)) {
      toast.error('Tiến độ mới phải lớn hơn tiến độ hiện tại');
      return;
    }

    try {
      // const userId = 1; // REMOVED: Use userId from component scope
      await executionService.updateProgress(stageId, userId, target);
      toast.success('Cập nhật tiến độ thành công');
      setProgressInput('');
      // Refresh stage data
      const stage = await productionService.getStage(stageId);
      const mapped = {
        ...stageData,
        progressPercent: stage.progressPercent || target,
        status: stage.executionStatus || stage.status,
      };
      setStageData(mapped);
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error(error.message || 'Lỗi khi cập nhật tiến độ');
    }
  };

  // Final safety check before render
  if (!stageData || !stageData.stageName) {
    console.error('Cannot render - stageData invalid:', stageData);
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="production" />
          <Container fluid className="p-4">
            <Button variant="link" onClick={handleBack}>&larr; Quay lại</Button>
            <div className="alert alert-danger mt-3">
              <strong>Lỗi:</strong> Dữ liệu công đoạn không hợp lệ.
              <pre className="mt-2" style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(stageData, null, 2)}
              </pre>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  try {
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
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <Button variant="link" className="btn-back-link mb-2" onClick={handleBack}>
                    &larr; Quay lại kế hoạch
                  </Button>
                  <h4 className="mb-0">Tiến độ công đoạn {stageData.stageName || 'N/A'}</h4>
                </div>
              </div>

              <Card className="shadow-sm mb-3">
                <Card.Body>
                  <div className="row g-3">
                    {infoFields.map((item) => (
                      <div key={item.label} className="col-12 col-md-6 col-lg-4">
                        <div className="text-muted small mb-1">{item.label}</div>
                        <Form.Control
                          readOnly
                          value={item.value || 'N/A'}
                          className="fw-semibold"
                          style={{ backgroundColor: '#f8f9fb' }}
                        />
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>

              <Card className="shadow-sm mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div>
                      <div className="text-muted">Tiến độ hiện tại</div>
                      <div className="h4 mb-0">{stageData.progressPercent}%</div>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <Badge bg={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>
                  </div>
                  <ProgressBar
                    now={stageData.progressPercent}
                    label={`${stageData.progressPercent}%`}
                    style={{ height: 18, borderRadius: 999 }}
                    variant="primary"
                  />
                </Card.Body>
              </Card>



              <Card className="shadow-sm mb-3">
                <Card.Body className="p-0">
                  <div className="p-3 border-bottom">
                    <strong>Lịch sử tiến độ</strong>
                  </div>
                  {historyLoading ? (
                    <div className="p-4 text-center text-muted">Đang tải lịch sử...</div>
                  ) : history.length === 0 ? (
                    <div className="p-4 text-center text-muted">Chưa có lịch sử cập nhật</div>
                  ) : (
                    <>
                      {/* Normal Progress History */}
                      <div className="p-3 bg-light border-bottom">
                        <h6 className="mb-0 text-primary">Lịch sử cập nhật tiến độ</h6>
                      </div>
                      <Table responsive className="mb-0 align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Hành động</th>
                            <th>Tiến độ</th>
                            <th>Thời gian</th>
                            <th>Người cập nhật</th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.filter(h => !h.isRework).length > 0 ? (
                            history.filter(h => !h.isRework).map((item) => (
                              <tr key={item.id}>
                                <td>{item.action}</td>
                                <td>{item.progress}</td>
                                <td>{item.timestamp}</td>
                                <td>{item.operator}</td>
                                <td>{item.notes}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="5" className="text-center text-muted py-3">Chưa có dữ liệu</td></tr>
                          )}
                        </tbody>
                      </Table>

                      {/* Rework Progress History */}
                      {history.some(h => h.isRework) && (
                        <>
                          <div className="p-3 bg-light border-bottom border-top">
                            <h6 className="mb-0 text-danger">Lịch sử cập nhật tiến độ lỗi</h6>
                          </div>
                          <Table responsive className="mb-0 align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Hành động</th>
                                <th>Tiến độ</th>
                                <th>Thời gian</th>
                                <th>Người cập nhật</th>
                                <th>Ghi chú</th>
                              </tr>
                            </thead>
                            <tbody>
                              {history.filter(h => h.isRework).map((item) => (
                                <tr key={item.id}>
                                  <td>{item.action}</td>
                                  <td>{item.progress}</td>
                                  <td>{item.timestamp}</td>
                                  <td>{item.operator}</td>
                                  <td>{item.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>

              {/* Kết quả kiểm tra - Always show, even if not inspected yet */}
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <strong>Kết quả kiểm tra</strong>
                    <div className="d-flex align-items-center gap-3">
                      <small className="text-muted">Kết quả do KCS gửi về</small>
                      {qaCriteria.length > 0 && qaCriteria.some(item => item.result) ? (
                        <Badge
                          bg={
                            (stageData?.defectLevel === 'MINOR' || stageData?.defectSeverity === 'MINOR') ? 'warning' : 'danger'
                          }
                        >
                          {(stageData?.defectLevel === 'MINOR' || stageData?.defectSeverity === 'MINOR') ? 'Lỗi nhẹ' : 'Lỗi nặng'}
                        </Badge>
                      ) : (
                        <Badge bg="secondary">Chưa kiểm tra</Badge>
                      )}
                    </div>
                  </div>
                  {qaCriteria.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {qaCriteria.map((criteriaItem, index) => (
                        <div
                          key={`${criteriaItem.title}-${index}`}
                          className="p-3 rounded"
                          style={{
                            border: `1px solid ${criteriaItem.result === 'PASS' ? '#c3ebd3' : criteriaItem.result === 'FAIL' ? '#f9cfd9' : '#e9ecef'}`,
                            backgroundColor: criteriaItem.result === 'PASS' ? '#e8f7ef' : criteriaItem.result === 'FAIL' ? '#fdecef' : '#f8f9fa',
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="fw-semibold">{criteriaItem.title}</div>
                            {criteriaItem.result ? (
                              <Badge bg={criteriaItem.result === 'PASS' ? 'success' : 'danger'}>
                                {criteriaItem.result === 'PASS' ? 'Đạt' : 'Không đạt'}
                              </Badge>
                            ) : (
                              <Badge bg="secondary">Chưa kiểm tra</Badge>
                            )}
                          </div>
                          {criteriaItem.result === 'FAIL' && criteriaItem.image && (
                            <img
                              src={criteriaItem.image}
                              alt={criteriaItem.title}
                              className="rounded mt-2"
                              style={{ maxWidth: '100%', height: 'auto' }}
                            />
                          )}
                          {criteriaItem.remark && (
                            <div className="mt-2 text-muted small">{criteriaItem.remark}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-3">
                      Chưa có kết quả kiểm tra cho công đoạn này
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Container>
          </div>
        </div>
      </div>
    );
  } catch (renderError) {
    console.error('Error rendering StageProgressDetail:', renderError);
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="production" />
          <Container fluid className="p-4">
            <Button variant="link" onClick={handleBack}>&larr; Quay lại</Button>
            <div className="alert alert-danger mt-3">
              <strong>Lỗi render:</strong> {renderError.message}
              <pre className="mt-2" style={{ fontSize: '12px' }}>
                {renderError.stack}
              </pre>
            </div>
          </Container>
        </div>
      </div>
    );
  }
};

export default StageProgressDetail;
