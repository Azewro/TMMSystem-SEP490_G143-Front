import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { productionService } from '../../api/productionService';
import { orderService } from '../../api/orderService';
import { qcService } from '../../api/qcService';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/constants';
import { getStageTypeName } from '../../utils/statusMapper';
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
      // If it's a direct match with a common word, try to construct Vietnamese name
      if (lowerName === keyword) {
        return translation;
      }
      // For compound names, try to translate
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

  // Return original if no match found
  return name;
};

const QaStageCheckResult = () => {
  const navigate = useNavigate();
  const { orderId, stageCode } = useParams(); // Route uses :stageCode, not :stageId
  const [qaResult, setQaResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStageResult = async () => {
      try {
        setLoading(true);

        // First, fetch order to get stages and find the stage by stageCode
        const orderData = await orderService.getOrderById(orderId);

        // Find stage by stageCode (stageType)
        const foundStage = orderData.stages?.find(s =>
          s.stageType === stageCode ||
          s.stageType === stageCode.toUpperCase()
        );

        if (!foundStage) {
          throw new Error(`Stage not found for code: ${stageCode}`);
        }

        // Fetch full stage details using stage ID
        const stage = await productionService.getStage(foundStage.id);

        // Fetch inspection criteria/results
        let inspections = [];
        try {
          inspections = await qcService.getStageInspections(foundStage.id);
        } catch (inspectionError) {
          console.warn('Could not load inspection criteria:', inspectionError);
        }

        const criteria = (inspections || []).map((item, index) => {
          const checkpointName = item.checkpointName || `Tiêu chí ${index + 1}`;
          let photoUrl = item.photoUrl;
          let fullPhotoUrl = photoUrl;

          if (photoUrl) {
            const domain = API_BASE_URL.replace(/^https?:\/\//, '');
            if (photoUrl.includes(domain)) {
              if (!photoUrl.startsWith('http')) {
                fullPhotoUrl = `https://${photoUrl}`;
              }
            } else {
              fullPhotoUrl = `${API_BASE_URL}/api/files/${photoUrl}`;
            }
          }

          return {
            title: translateCheckpointName(checkpointName),
            result: (item.result || 'PASS').toUpperCase(),
            remark: item.notes,
            image: fullPhotoUrl
          };
        });

        // Map backend data to match mock structure
        const mapped = {
          lotCode: orderData.lotCode || orderData.poNumber || 'N/A',
          productName: orderData.productName || orderData.contract?.contractNumber || 'N/A',
          criteria,
          overall: stage.executionStatus === 'QC_PASSED' ? 'PASS' :
            (['QC_FAILED', 'WAITING_REWORK', 'REWORK_IN_PROGRESS'].includes(stage.executionStatus) ? 'FAIL' : 'PENDING'),
          summary: stage.executionStatus === 'QC_PASSED' ? 'Tất cả tiêu chí đều Đạt.' :
            (['QC_FAILED', 'WAITING_REWORK', 'REWORK_IN_PROGRESS'].includes(stage.executionStatus) ? 'Có tiêu chí Không đạt. Vui lòng xử lý lỗi theo quy định.' : 'Chưa có kết quả kiểm tra'),
          defectLevel: stage.defectLevel || stage.defectSeverity,
          defectDescription: stage.defectDescription,
          stageType: stage.stageType || stageCode
        };
        setQaResult(mapped);
      } catch (error) {
        console.error('Error fetching stage result:', error);
        toast.error('Không thể tải kết quả kiểm tra');
      } finally {
        setLoading(false);
      }
    };
    if (orderId && stageCode) fetchStageResult();
  }, [orderId, stageCode]);

  // WebSocket subscription for real-time updates
  const { subscribe } = useWebSocketContext();
  useEffect(() => {
    const unsubscribe = subscribe('/topic/updates', (update) => {
      if (['QUALITY_ISSUE', 'PRODUCTION_STAGE'].includes(update.entity)) {
        console.log('[QaStageCheckResult] Received update, refreshing...', update);
        // Trigger re-fetch by setting loading (simplified approach)
        setLoading(true);
      }
    });
    return () => unsubscribe();
  }, [subscribe]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!qaResult) {
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="qa" />
          <Container fluid className="p-4">
            <Button variant="link" onClick={() => navigate(`/qa/orders/${orderId}`)}>&larr; Quay lại</Button>
            <div className="alert alert-warning mt-3">Không tìm thấy kết quả kiểm tra</div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="qa" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={() => navigate(`/qa/orders/${orderId || 'LOT-002'}`)}>
              &larr; Quay lại kế hoạch
            </Button>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h4 className="mb-1">Kết quả Kiểm Tra</h4>
                    <div className="text-muted small">
                      {qaResult.lotCode} • {qaResult.productName}
                    </div>
                    <div className="text-muted small">
                      Công đoạn: <strong>{getStageTypeName(qaResult.stageType) || qaResult.stageType || 'N/A'}</strong>
                    </div>
                  </div>
                  <Badge bg={qaResult.overall === 'PASS' ? 'success' : 'danger'}>
                    {qaResult.overall === 'PASS' ? 'Đạt' : 'Không đạt'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <h6 className="mb-3">Tiêu chí kiểm tra</h6>
                {qaResult.criteria.length === 0 ? (
                  <div className="text-muted small">
                    Chưa có tiêu chí kiểm tra nào được lưu cho công đoạn này.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {qaResult.criteria.map((criteria) => (
                      <div
                        key={criteria.title}
                        className="p-3 rounded"
                        style={{
                          border: `1px solid ${criteria.result === 'PASS' ? '#c3ebd3' : '#f9cfd9'}`,
                          backgroundColor: criteria.result === 'PASS' ? '#e8f7ef' : '#fdecef',
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="fw-semibold">{criteria.title}</div>
                          <Badge bg={criteria.result === 'PASS' ? 'success' : 'danger'}>
                            {criteria.result === 'PASS' ? 'Đạt' : 'Không đạt'}
                          </Badge>
                        </div>
                        {criteria.image && (
                          <img
                            src={criteria.image}
                            alt={criteria.title}
                            className="rounded mb-2"
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        )}
                        {criteria.remark && <div className="text-muted small">{criteria.remark}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card
              className="shadow-sm"
              style={{
                borderColor: qaResult.overall === 'PASS' ? '#c3e6cb' : '#f5c2c7',
                backgroundColor: qaResult.overall === 'PASS' ? '#e9f7ef' : '#fdecec',
              }}
            >
              <Card.Body>
                <div className="fw-semibold mb-2">
                  Kết quả kiểm tra: <span>{qaResult.overall === 'PASS' ? 'Đạt' : 'Không đạt'}</span>
                </div>
                <div className="text-muted small mb-2">{qaResult.summary}</div>
                {qaResult.overall === 'FAIL' && (
                  <div className="d-flex flex-column gap-1">
                    <div>
                      <span className="text-muted small me-1">Mức độ lỗi:</span>
                      {(() => {
                        const level = qaResult.defectLevel;
                        const config = {
                          'MINOR': { label: 'Lỗi nhẹ', variant: 'warning' },
                          'MAJOR': { label: 'Lỗi nặng', variant: 'danger' },
                          'CRITICAL': { label: 'Lỗi nghiêm trọng', variant: 'danger' }
                        };
                        const info = config[level] || { label: level || 'Chưa xác định', variant: 'secondary' };
                        return <Badge bg={info.variant}>{info.label}</Badge>;
                      })()}
                    </div>
                    <div>
                      <span className="text-muted small me-1">Mô tả lỗi:</span>
                      <span>{qaResult.defectDescription || 'Chưa ghi chú'}</span>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QaStageCheckResult;
