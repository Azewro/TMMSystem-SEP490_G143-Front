import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Container, Card, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import { orderService } from '../../api/orderService';
import { executionService } from '../../api/executionService';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/constants';
import CameraCapture from '../../components/common/CameraCapture';

const DEFAULT_CRITERIA = {
  CUONG_MAC: [
    { name: 'Chất lượng sợi' },
    { name: 'Độ căng sợi' },
    { name: 'Sợi mắc đều' },
    { name: 'Khổ & chiều dài cây sợi' },
  ],
  WARPING: [
    { name: 'Chất lượng sợi' },
    { name: 'Độ căng sợi' },
    { name: 'Sợi mắc đều' },
    { name: 'Khổ & chiều dài cây sợi' },
  ],
  DET: [
    { name: 'Độ bền sợi nền' },
    { name: 'Hình dáng khăn' },
    { name: 'Bề mặt vải' },
  ],
  WEAVING: [
    { name: 'Độ bền sợi nền' },
    { name: 'Hình dáng khăn' },
    { name: 'Bề mặt vải' },
  ],
  NHUOM: [
    { name: 'Màu sắc chuẩn' },
    { name: 'Độ bền màu' },
    { name: 'Vết loang/đốm' },
  ],
  DYEING: [
    { name: 'Màu sắc chuẩn' },
    { name: 'Độ bền màu' },
    { name: 'Vết loang/đốm' },
  ],
  CAT: [
    { name: 'Kích thước chuẩn' },
    { name: 'Đường cắt sạch' },
  ],
  CUTTING: [
    { name: 'Kích thước chuẩn' },
    { name: 'Đường cắt sạch' },
  ],
  MAY: [
    { name: 'Đường may thẳng' },
    { name: 'Mật độ mũi chỉ' },
  ],
  HEMMING: [
    { name: 'Đường may thẳng' },
    { name: 'Mật độ mũi chỉ' },
  ],
  DONG_GOI: [
    { name: 'Đủ phụ kiện kèm' },
    { name: 'Tem/nhãn đúng chuẩn' },
  ],
  PACKAGING: [
    { name: 'Đủ phụ kiện kèm' },
    { name: 'Tem/nhãn đúng chuẩn' },
  ],
};

const STAGE_ALIAS = {
  WARPING: 'CUONG_MAC',
  CUONG_MAC: 'WARPING',
  WEAVING: 'DET',
  DET: 'WEAVING',
  DYEING: 'NHUOM',
  NHUOM: 'DYEING',
  CUTTING: 'CAT',
  CAT: 'CUTTING',
  HEMMING: 'MAY',
  MAY: 'HEMMING',
  PACKAGING: 'DONG_GOI',
  DONG_GOI: 'PACKAGING',
};

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

const QaStageQualityCheck = () => {
  const navigate = useNavigate();
  const { orderId, stageCode } = useParams();
  // Get userId from sessionStorage (set during login in authService.internalLogin)
  // Fallback to localStorage for backward compatibility
  const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');

  const [order, setOrder] = useState(null);
  const [stage, setStage] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [defectLevel, setDefectLevel] = useState('');
  const [defectDescription, setDefectDescription] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const fileInputsRef = useRef({});
  const [photoUploadingId, setPhotoUploadingId] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [activeCameraCriterionId, setActiveCameraCriterionId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Order Details to find Stage ID
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);

        // Find stage by code/type
        const foundStage = orderData.stages?.find(s => s.stageType === stageCode || s.stageType === stageCode.toUpperCase());

        if (foundStage) {
          setStage(foundStage);

          // 2. Start QC Session if needed (or get existing)
          if (foundStage.executionStatus === 'WAITING_QC') {
            const session = await executionService.startQcSession(foundStage.id, userId);
            setSessionId(session.id);
          } else if (foundStage.executionStatus === 'QC_IN_PROGRESS') {
            // Ideally fetch existing session, but for now we might need an endpoint for that.
            // Assuming we can start again or get the active session.
            // The startQcSession endpoint returns existing session if IN_PROGRESS.
            const session = await executionService.startQcSession(foundStage.id, userId);
            setSessionId(session.id);
          }

          // 3. Fetch Checkpoints
          const cpData = await executionService.getStageCheckpoints(foundStage.id);
          const normalizedCheckpoints = cpData && cpData.length > 0
            ? cpData
            : buildFallbackCheckpoints(foundStage.stageType);
          setCheckpoints(normalizedCheckpoints);

          // Initialize criteria state
          setCriteria(normalizedCheckpoints.map((cp, index) => {
            const checkpointName = cp.checkpointName || cp.name;
            return {
              id: cp.id || cp.tempId || `mock-${index}`,
              name: translateCheckpointName(checkpointName),
              result: '',
              notes: '',
              photo: null,
              qcCheckpointId: cp.id || null
            };
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Lỗi khi tải dữ liệu kiểm tra');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId, stageCode, userId]);

  const buildFallbackCheckpoints = (stageType) => {
    if (!stageType) return [];
    const key = stageType.toUpperCase();
    const entries = DEFAULT_CRITERIA[key] || DEFAULT_CRITERIA[STAGE_ALIAS[key]];
    if (!entries) return [];
    return entries.map((item, index) => {
      const checkpointName = item.name || item;
      return {
        checkpointName: translateCheckpointName(checkpointName),
        tempId: `fallback-${key}-${index}`,
      };
    });
  };

  const overallResult = useMemo(() => {
    if (criteria.length === 0) return 'PENDING';
    const hasFail = criteria.some((c) => c.result === 'FAIL');
    const allSelected = criteria.every((c) => c.result === 'PASS' || c.result === 'FAIL');
    if (!allSelected) return 'PENDING';
    return hasFail ? 'FAIL' : 'PASS';
  }, [criteria]);

  const handleBack = () => {
    navigate(`/qa/orders/${orderId}`);
  };

  const handleChangeResult = (id, value) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
            ...c,
            result: value,
            photo: value === 'FAIL' ? c.photo : null,
          }
          : c,
      ),
    );
  };

  const handlePhotoUploadClick = (criterionId) => {
    const input = fileInputsRef.current[criterionId];
    if (input) {
      input.click();
    }
  };
  const handlePhotoInputChange = async (criterionId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create local preview immediately using URL.createObjectURL
    const objectUrl = URL.createObjectURL(file);
    setCriteria((prev) =>
      prev.map((item) =>
        item.id === criterionId ? { ...item, photo: objectUrl } : item,
      ),
    );

    try {
      setPhotoUploadingId(criterionId);
      const uploadResult = await executionService.uploadQcPhoto(file, stage?.id, userId);

      let photoUrl = uploadResult?.url;
      if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
        photoUrl = `${API_BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
      }

      if (!photoUrl && uploadResult?.fileName) {
        photoUrl = `${API_BASE_URL}/api/files/${uploadResult.fileName}`;
      }

      if (!photoUrl) {
        throw new Error('Không thể lấy URL ảnh');
      }

      setCriteria((prev) =>
        prev.map((item) =>
          item.id === criterionId ? { ...item, photo: photoUrl } : item,
        ),
      );
      toast.success('Đã tải ảnh lỗi');
    } catch (error) {
      console.error('Upload QC photo failed', error);
      toast.error(error.response?.data?.message || error.message || 'Không thể tải ảnh');

      // Revert on error
      setCriteria((prev) =>
        prev.map((item) =>
          item.id === criterionId ? { ...item, photo: null } : item,
        ),
      );
    } finally {
      setPhotoUploadingId(null);
      // Reset input value so the same file can be uploaded again if needed
      event.target.value = '';
    }
  };

  const handleOpenCamera = (criterionId) => {
    setActiveCameraCriterionId(criterionId);
    setShowCamera(true);
  };

  const handleCameraCapture = async (file) => {
    if (!activeCameraCriterionId || !file) return;

    // Create local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setCriteria((prev) =>
      prev.map((item) =>
        item.id === activeCameraCriterionId ? { ...item, photo: objectUrl } : item,
      ),
    );

    try {
      setPhotoUploadingId(activeCameraCriterionId);
      const uploadResult = await executionService.uploadQcPhoto(file, stage?.id, userId);

      let photoUrl = uploadResult?.url;
      if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
        photoUrl = `${API_BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
      }

      if (!photoUrl && uploadResult?.fileName) {
        photoUrl = `${API_BASE_URL}/api/files/${uploadResult.fileName}`;
      }

      if (!photoUrl) {
        throw new Error('Không thể lấy URL ảnh');
      }

      setCriteria((prev) =>
        prev.map((item) =>
          item.id === activeCameraCriterionId ? { ...item, photo: photoUrl } : item,
        ),
      );
      toast.success('Đã tải ảnh chụp lên');
    } catch (error) {
      console.error('Upload captured photo failed', error);
      toast.error(error.response?.data?.message || error.message || 'Không thể tải ảnh');

      // Revert on error
      setCriteria((prev) =>
        prev.map((item) =>
          item.id === activeCameraCriterionId ? { ...item, photo: null } : item,
        ),
      );
    } finally {
      setPhotoUploadingId(null);
      setActiveCameraCriterionId(null);
    }
  };

  const handleSubmit = async () => {
    if (overallResult === 'PENDING') {
      toast.error('Vui lòng chọn đầy đủ kết quả cho tất cả tiêu chí.');
      return;
    }
    if (overallResult === 'FAIL') {
      const missingPhoto = criteria.some((c) => c.result === 'FAIL' && !c.photo);
      // Relaxing photo requirement for now as we don't have real upload
      if (missingPhoto) {
        toast.error('Vui lòng bổ sung hình ảnh lỗi cho các tiêu chí Không đạt yêu cầu.');
        return;
      }
      if (!defectLevel) {
        toast.error('Vui lòng chọn mức độ lỗi.');
        return;
      }
      if (!defectDescription.trim()) {
        toast.error('Vui lòng nhập mô tả lỗi.');
        return;
      }
    }

    try {
      // Prepare DTOs
      const criteriaResults = criteria.map(c => ({
        qcCheckpointId: c.qcCheckpointId,
        result: c.result,
        notes: c.result === 'FAIL' ? c.name : '', // Use checkpoint name as defect type/note for now
        photoUrl: c.photo
      }));

      await executionService.submitQcSession(
        sessionId,
        overallResult,
        defectDescription,
        userId,
        overallResult === 'FAIL' ? defectLevel : null,
        overallResult === 'FAIL' ? defectDescription : null,
        criteriaResults
      );

      toast.success('Đã gửi kết quả kiểm tra');
      setTimeout(() => handleBack(), 1500);
    } catch (error) {
      toast.error(error.message || 'Lỗi khi gửi kết quả');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="customer-layout">
        <Header />
        <div className="d-flex">
          <InternalSidebar userRole="qa" />
          <Container fluid className="p-4">
            <Button variant="link" onClick={handleBack}>&larr; Quay lại</Button>
            <div className="alert alert-warning mt-3">Không tìm thấy công đoạn.</div>
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
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={handleBack}>
              &larr; Quay lại chi tiết đơn hàng
            </Button>

            {/* Header thông tin */}
            <Card className="shadow-sm mb-3">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">Kiểm tra chất lượng</h5>
                  <div className="text-muted small">
                    {orderId} • {order?.productName}
                  </div>
                  <div className="mt-2">
                    <span className="text-muted small">Công đoạn:&nbsp;</span>
                    <strong>{stage.stageType}</strong>
                  </div>
                </div>
                <div className="text-end">
                  <Badge bg="info" className="p-2">
                    {stage.executionStatus}
                  </Badge>
                </div>
              </Card.Body>
            </Card>

            {/* Danh sách tiêu chí */}
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <h6 className="mb-3">Danh sách tiêu chí kiểm tra</h6>
                {criteria.length === 0 ? (
                  <div className="text-muted">Không có tiêu chí kiểm tra nào được định nghĩa cho công đoạn này.</div>
                ) : (
                  criteria.map((c) => (
                    <div key={c.id} className="mb-3 border-bottom pb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>{c.name}</div>
                        <Form.Select
                          value={c.result}
                          onChange={(e) => handleChangeResult(c.id, e.target.value)}
                          style={{ maxWidth: 180 }}
                        >
                          <option value="">Chọn kết quả</option>
                          <option value="PASS">Đạt</option>
                          <option value="FAIL">Không đạt</option>
                        </Form.Select>
                      </div>

                      {c.result === 'FAIL' && (
                        <div
                          className="p-3 rounded"
                          style={{ backgroundColor: '#ffe3e3', border: '1px solid #ffc9c9' }}
                        >
                          <div className="mb-2 fw-semibold">Hình ảnh lỗi (bắt buộc)</div>
                          <input
                            type="file"
                            accept="image/*"
                            className="d-none"
                            ref={(el) => (fileInputsRef.current[c.id] = el)}
                            onChange={(event) => handlePhotoInputChange(c.id, event)}
                          />
                          <Button
                            variant="outline-dark"
                            size="sm"
                            disabled={photoUploadingId === c.id}
                            onClick={() => handlePhotoUploadClick(c.id)}
                            className="me-2"
                          >
                            {photoUploadingId === c.id
                              ? 'Đang tải...'
                              : c.photo
                                ? 'Đổi ảnh'
                                : 'Tải ảnh'}
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            disabled={photoUploadingId === c.id}
                            onClick={() => handleOpenCamera(c.id)}
                          >
                            <i className="bi bi-camera-fill me-1"></i>
                            Chụp trực tiếp
                          </Button>
                          {c.photo && (
                            <div className="mt-2">
                              <img
                                src={c.photo}
                                alt="Ảnh lỗi"
                                className="rounded border"
                                style={{ maxWidth: '100%', height: 'auto' }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>

            {/* Kết quả tổng */}
            {overallResult === 'PASS' && (
              <Card
                className="shadow-sm mb-3"
                style={{ borderColor: '#c3e6cb', backgroundColor: '#e9f7ef' }}
              >
                <Card.Body>
                  <div className="fw-semibold mb-2">Kết quả kiểm tra: <span style={{ color: '#28a745' }}>Đạt</span></div>
                  <div className="text-muted small">
                    Tất cả tiêu chí đều Đạt. Bạn có thể gửi kết quả kiểm tra.
                  </div>
                </Card.Body>
              </Card>
            )}

            {overallResult === 'FAIL' && (
              <Card
                className="shadow-sm mb-3"
                style={{ borderColor: '#f5c2c7', backgroundColor: '#fdecec' }}
              >
                <Card.Body>
                  <div className="fw-semibold mb-3">
                    Kết quả kiểm tra: <span style={{ color: '#dc3545' }}>Không Đạt</span>
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label>Mức độ lỗi *</Form.Label>
                    <Form.Select
                      value={defectLevel}
                      onChange={(e) => setDefectLevel(e.target.value)}
                    >
                      <option value="">Chọn mức độ</option>
                      <option value="MINOR">Nhẹ</option>
                      <option value="MAJOR">Nặng</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Mô tả lỗi *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={defectDescription}
                      onChange={(e) => setDefectDescription(e.target.value)}
                      placeholder="Mô tả chi tiết lỗi phát hiện..."
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            )}

            <div className="d-flex justify-content-end">
              <Button variant="dark" onClick={handleSubmit} disabled={overallResult === 'PENDING'}>
                Gửi kết quả kiểm tra
              </Button>
            </div>
          </Container>
        </div>
      </div>

      <CameraCapture
        show={showCamera}
        onHide={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </div >
  );
};

export default QaStageQualityCheck;


