import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Button, Form, Spinner } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';
import api from '../../api/apiConfig';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/constants';
import { getStageTypeName } from '../../utils/statusMapper';

const severityStyles = {
  minor: { label: 'Lỗi nhẹ', variant: 'warning' },
  major: { label: 'Lỗi nặng', variant: 'danger' },
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

const TechnicalDefectDetail = () => {
  const navigate = useNavigate();
  const { defectId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [defect, setDefect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [materialRequest, setMaterialRequest] = useState({
    type: '',
    quantity: '',
    notes: ''
  });

  useEffect(() => {
    const fetchDefect = async () => {
      try {
        const response = await api.get(`/v1/production/defects/${defectId}`);
        setDefect(response.data);
      } catch (error) {
        console.error("Error fetching defect:", error);
        toast.error("Không thể tải thông tin lỗi");
      } finally {
        setLoading(false);
      }
    };

    const fetchMaterials = async () => {
      try {
        const res = await api.get('/v1/products/materials');
        setMaterials(res.data);
      } catch (err) {
        console.error("Error fetching materials:", err);
      }
    };

    fetchDefect();
    fetchMaterials();
  }, [defectId]);

  const handleQuantityChange = (materialId, value) => {
    setQuantities(prev => ({
      ...prev,
      [materialId]: value
    }));
  };

  const handleDecision = async (decision) => {
    try {
      const userId = parseInt(localStorage.getItem('userId') || sessionStorage.getItem('userId'));
      if (!userId) {
        toast.error("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      let finalNotes = notes;
      let details = [];
      let totalQuantity = 0;

      if (decision === 'MATERIAL_REQUEST') {
        // Collect details
        details = Object.entries(quantities)
          .filter(([_, qty]) => qty && parseFloat(qty) > 0)
          .map(([matId, qty]) => {
            const mat = materials.find(m => m.id.toString() === matId);
            totalQuantity += parseFloat(qty);
            return {
              materialId: parseInt(matId),
              quantityRequested: parseFloat(qty),
              unit: mat ? mat.unit : 'KG',
              notes: ''
            };
          });

        if (details.length === 0) {
          toast.error("Vui lòng nhập số lượng cho ít nhất một loại sợi");
          return;
        }

        finalNotes = `Yêu cầu cấp sợi. Ghi chú: ${materialRequest.notes}`;
      }

      await api.post('/v1/technical/defects/handle', {
        stageId: defect.stageId,
        decision: decision,
        notes: finalNotes,
        technicalUserId: userId,
        quantity: totalQuantity,
        details: details
      });

      toast.success("Đã gửi xử lý thành công");
      navigate('/technical/defects');
    } catch (error) {
      console.error("Error handling defect:", error);
      toast.error("Có lỗi xảy ra khi xử lý");
    }
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (!defect) return <div className="text-center p-5">Không tìm thấy lỗi</div>;

  const severity = severityStyles[defect.severity?.toLowerCase()] || severityStyles.minor;

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="technical" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={() => navigate('/technical/defects')}>
              &larr; Quay lại
            </Button>

            <Card className="shadow-sm mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
                  <div>
                    <h5 className="mb-1">Chi Tiết Lỗi #{defect.id}</h5>
                    <small className="text-muted">Xem và xử lý lỗi</small>
                  </div>
                  <Badge bg={severity.variant} className="align-self-start">
                    {severity.label}
                  </Badge>
                </div>
                <Row className="g-3">
                  <Col md={4}>
                    <div className="text-muted small mb-1">Công đoạn</div>
                    <div className="fw-semibold">{getStageTypeName(defect.stageType || defect.stageName) || defect.stageName}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small mb-1">Mã lô</div>
                    <div className="fw-semibold">{defect.batchNumber || 'N/A'}</div>
                  </Col>
                  <Col md={4}>
                    <div className="text-muted small mb-1">Người báo cáo</div>
                    <div className="fw-semibold">{defect.reportedBy}</div>
                  </Col>
                  <Col md={12}>
                    <div className="text-muted small mb-1">Mô tả lỗi</div>
                    <div className="fw-semibold">{defect.issueDescription}</div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Inspection Criteria List */}
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <strong>Tiêu chí kiểm tra</strong>
              </Card.Header>
              <Card.Body>
                {defect.inspections && defect.inspections.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {defect.inspections.map((item, index) => {
                      // Helper for robust URL
                      const getFullPhotoUrl = (url) => {
                        if (!url) return null;
                        const domain = API_BASE_URL.replace(/^https?:\/\//, '');
                        if (url.includes(domain)) {
                          return url.startsWith('http') ? url : `https://${url}`;
                        }
                        return `${API_BASE_URL}/api/files/${url}`;
                      };

                      const itemPhotoUrl = getFullPhotoUrl(item.photoUrl);
                      const translatedName = translateCheckpointName(item.checkpointName);

                      return (
                        <div
                          key={index}
                          className="p-3 rounded"
                          style={{
                            border: `1px solid ${item.result === 'PASS' ? '#c3ebd3' : '#f9cfd9'}`,
                            backgroundColor: item.result === 'PASS' ? '#e8f7ef' : '#fdecef',
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="fw-semibold">{translatedName || `Tiêu chí ${index + 1}`}</div>
                            <Badge bg={item.result === 'PASS' ? 'success' : 'danger'}>
                              {item.result === 'PASS' ? 'Đạt' : 'Không đạt'}
                            </Badge>
                          </div>
                          {itemPhotoUrl && (
                            <div className="mt-2">
                              <img
                                src={itemPhotoUrl}
                                alt={translatedName}
                                className="rounded mb-2"
                                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                              />
                            </div>
                          )}
                          {item.notes && <div className="text-muted small">Ghi chú: {item.notes}</div>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-muted">Không có thông tin chi tiết tiêu chí.</div>
                )}
              </Card.Body>
            </Card>

            {defect.severity === 'MINOR' ? (
              <Card className="shadow-sm">
                <Card.Body>
                  <strong>Xử lý lỗi nhẹ</strong>

                  {/* Rework Progress Section */}
                  {(defect.stageStatus === 'WAITING_REWORK' || defect.stageStatus === 'REWORK_IN_PROGRESS' || (defect.reworkHistory && defect.reworkHistory.length > 0)) && (
                    <div className="mb-4 p-3 bg-light rounded border">
                      <h6 className="text-primary mb-3">Tiến độ sửa lỗi (Rework)</h6>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between mb-1">
                          <small>Tiến độ hiện tại</small>
                          <small className="fw-bold">{defect.reworkProgress || 0}%</small>
                        </div>
                        <div className="progress" style={{ height: '10px' }}>
                          <div
                            className="progress-bar bg-warning"
                            role="progressbar"
                            style={{ width: `${defect.reworkProgress || 0}%` }}
                            aria-valuenow={defect.reworkProgress || 0}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>

                      {defect.reworkHistory && defect.reworkHistory.length > 0 && (
                        <div className="mt-3">
                          <small className="text-muted d-block mb-2">Lịch sử cập nhật:</small>
                          <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <table className="table table-sm table-bordered bg-white mb-0" style={{ fontSize: '0.85rem' }}>
                              <thead>
                                <tr>
                                  <th>Thời gian</th>
                                  <th>Hành động</th>
                                  <th>%</th>
                                  <th>Người cập nhật</th>
                                </tr>
                              </thead>
                              <tbody>
                                {defect.reworkHistory.map((h) => (
                                  <tr key={h.id}>
                                    <td>{new Date(h.timestamp).toLocaleString('vi-VN')}</td>
                                    <td>{h.action}</td>
                                    <td>{h.quantityCompleted}%</td>
                                    <td>{h.operatorName}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-muted mt-2 mb-4">Lỗi này được đánh giá là lỗi nhẹ. Bạn có thể yêu cầu Leader làm lại (Rework).</p>

                  {/* FIX: Show button based on defect.status (PENDING), not stageStatus */}
                  {/* This ensures new defects after second QC fail still show the button */}
                  {defect.status === 'PROCESSED' ? (
                    <div className="alert alert-info">
                      <strong>Đã yêu cầu làm lại.</strong>
                      <div className="mt-1">
                        <small className="text-muted">Ghi chú đã gửi:</small>
                        <div>{defect.technicalNotes}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Ghi chú cho Leader</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Nhập hướng dẫn sửa lỗi..."
                        />
                      </Form.Group>
                      <Button variant="warning" onClick={() => handleDecision('REWORK')}>Yêu cầu làm lại</Button>
                    </>
                  )}
                </Card.Body>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <Card.Body>
                  <strong>Yêu cầu cấp lại sợi (Lỗi nặng)</strong>
                  <p className="text-muted mt-2 mb-4">Lỗi được đánh giá là lỗi nặng. Vui lòng điền thông tin yêu cầu cấp lại sợi để gửi cho PM phê duyệt.</p>

                  {defect.materialRequisition ? (
                    <div className="alert alert-success">
                      <strong><i className="bi bi-check-circle-fill me-2"></i>Đã gửi yêu cầu cấp sợi.</strong>
                      <div className="mt-2">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Trạng thái: <strong>{defect.materialRequisition.status}</strong></span>
                          <span>Ngày gửi: {new Date(defect.materialRequisition.requestedAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="table-responsive bg-white rounded border">
                          <table className="table table-sm mb-0">
                            <thead className="bg-light">
                              <tr>
                                <th>Vật tư</th>
                                <th className="text-end">SL Yêu cầu</th>
                                <th className="text-end">SL Duyệt</th>
                                <th>Đơn vị</th>
                              </tr>
                            </thead>
                            <tbody>
                              {defect.materialRequisition.details && defect.materialRequisition.details.map((d) => (
                                <tr key={d.id}>
                                  <td>{d.materialName}</td>
                                  <td className="text-end">{d.quantityRequested}</td>
                                  <td className="text-end">{d.quantityApproved || '-'}</td>
                                  <td>{d.unit || 'KG'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="table table-bordered table-hover">
                          <thead className="table-light sticky-top">
                            <tr>
                              <th>Vật tư</th>
                              <th style={{ width: '150px' }}>Số lượng (KG)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {materials.map(mat => (
                              <tr key={mat.id}>
                                <td>
                                  <div className="fw-medium">{mat.name}</div>
                                  <small className="text-muted">{mat.code}</small>
                                </td>
                                <td>
                                  <Form.Control
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    placeholder="0"
                                    value={quantities[mat.id] || ''}
                                    onChange={(e) => handleQuantityChange(mat.id, e.target.value)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Row className="g-3 mb-3">
                        <Col md={12}>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Ghi chú thêm về yêu cầu..."
                            value={materialRequest.notes}
                            onChange={(e) => setMaterialRequest({ ...materialRequest, notes: e.target.value })}
                          />
                        </Col>
                      </Row>
                      <div className="d-flex justify-content-end">
                        <Button variant="danger" onClick={() => handleDecision('MATERIAL_REQUEST')}>Tạo phiếu yêu cầu cấp sợi</Button>
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default TechnicalDefectDetail;
