import React, { useState, useMemo } from 'react';
import { Container, Card, Button, Form } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const CRITERIA_BY_STAGE = {
  CUONG_MAC: [
    { key: 'fabric_quality', name: 'Chất lượng sợi' },
    { key: 'tension', name: 'Độ căng sợi' },
    { key: 'uniformity', name: 'Sợi mắc đều' },
    { key: 'roll', name: 'Khổ & chiều dài cây sợi' },
  ],
  DET: [
    { key: 'durability', name: 'Độ bền sợi' },
    { key: 'density', name: 'Mật độ sợi' },
    { key: 'shape', name: 'Hình dáng khăn' },
    { key: 'surface', name: 'Bề mặt vải' },
  ],
  NHUOM: [
    { key: 'color', name: 'Màu sắc' },
    { key: 'color_fastness', name: 'Độ bền màu' },
    { key: 'coverage', name: 'Độ phủ màu' },
    { key: 'stain', name: 'Độ loang màu' },
  ],
  CAT: [
    { key: 'size', name: 'Kích thước khăn' },
    { key: 'angle', name: 'Độ nghiêng góc' },
    { key: 'uniform_cut', name: 'Độ đồng đều' },
    { key: 'cut_quality', name: 'Vết cắt' },
  ],
  MAY: [
    { key: 'strength', name: 'Tiêu chuẩn bền khăn' },
    { key: 'label', name: 'Nhãn mác' },
    { key: 'stitch_density', name: 'Mật độ mũi may' },
    { key: 'thread', name: 'Chỉ thừa, màu chỉ' },
  ],
  DONG_GOI: [
    { key: 'cleanliness', name: 'Độ sạch khăn' },
    { key: 'folding', name: 'Gấp khăn' },
    { key: 'tag', name: 'Tem nhãn' },
    { key: 'package', name: 'Túi đóng gói' },
    { key: 'quantity', name: 'Số lượng' },
  ],
};

const QaStageQualityCheck = () => {
  const navigate = useNavigate();
  const { orderId, stageCode } = useParams();

  const initialStageKey = (stageCode || '').toUpperCase();
  const [criteria, setCriteria] = useState(() =>
    (CRITERIA_BY_STAGE[initialStageKey] || CRITERIA_BY_STAGE.NHUOM).map((c, index) => ({
      id: `${initialStageKey}-${index}`,
      ...c,
      result: '',
      photo: null,
    })),
  );
  const [defectLevel, setDefectLevel] = useState('');
  const [defectDescription, setDefectDescription] = useState('');

  const overallResult = useMemo(() => {
    const hasFail = criteria.some((c) => c.result === 'FAIL');
    const allSelected = criteria.every((c) => c.result === 'PASS' || c.result === 'FAIL');
    if (!allSelected) return 'PENDING';
    return hasFail ? 'FAIL' : 'PASS';
  }, [criteria]);

  const handleBack = () => {
    navigate(`/qa/orders/${orderId || 'LOT-002'}`);
  };

  const handleChangeResult = (id, value) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              result: value,
              // reset photo if chuyển về Đạt / Chọn
              photo: value === 'FAIL' ? c.photo : null,
            }
          : c,
      ),
    );
  };

  const handleSubmit = () => {
    if (overallResult === 'PENDING') {
      alert('Vui lòng chọn đầy đủ kết quả cho tất cả tiêu chí.');
      return;
    }
    if (overallResult === 'FAIL') {
      // kiểm tra ảnh bắt buộc và thông tin lỗi
      const missingPhoto = criteria.some((c) => c.result === 'FAIL' && !c.photo);
      if (missingPhoto) {
        alert('Vui lòng bổ sung hình ảnh lỗi cho các tiêu chí Không đạt yêu cầu.');
        return;
      }
      if (!defectLevel || !defectDescription.trim()) {
        alert('Vui lòng nhập đầy đủ Mức độ lỗi và Mô tả lỗi.');
        return;
      }
    }
    // Mock submit
    alert('Đã gửi kết quả kiểm tra (mock).');
  };

  const stageKey = (stageCode || '').toUpperCase();
  const stageNameMap = {
    CUONG_MAC: 'Cuồng mắc',
    DET: 'Dệt',
    NHUOM: 'Nhuộm',
    CAT: 'Cắt',
    MAY: 'May',
    DONG_GOI: 'Đóng gói',
  };
  const stageName = stageNameMap[stageKey] || 'Công đoạn';

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
              &larr; Quay lại kế hoạch
            </Button>

            {/* Header thông tin */}
            <Card className="shadow-sm mb-3">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">Kiểm tra chất lượng</h5>
                  <div className="text-muted small">
                    {orderId || 'LOT-002'} • Khăn mặt cotton
                  </div>
                  <div className="mt-2">
                    <span className="text-muted small">Công đoạn:&nbsp;</span>
                    <strong>{stageName}</strong>
                  </div>
                </div>
                <div className="text-end">
                  <span className="badge rounded-pill text-bg-light" style={{ color: '#6f42c1' }}>
                    Đang kiểm tra
                  </span>
                </div>
              </Card.Body>
            </Card>

            {/* Danh sách tiêu chí */}
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <h6 className="mb-3">Danh sách tiêu chí kiểm tra</h6>
                {criteria.map((c) => (
                  <div key={c.id} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>{c.name}</div>
                      <Form.Select
                        value={c.result}
                        onChange={(e) => handleChangeResult(c.id, e.target.value)}
                        style={{ maxWidth: 180 }}
                      >
                        <option value="">Chọn</option>
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
                        <Button
                          variant="outline-dark"
                          size="sm"
                          onClick={() => {
                            // mock chụp ảnh: gán c.photo = {} để đánh dấu đã có ảnh
                            setCriteria((prev) =>
                              prev.map((item) =>
                                item.id === c.id ? { ...item, photo: {} } : item,
                              ),
                            );
                            alert('Giả lập: đã đính kèm hình ảnh lỗi (mock).');
                          }}
                        >
                          Chụp ảnh
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
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
                      <option value="CRITICAL">Nghiêm trọng</option>
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
              <Button variant="dark" onClick={handleSubmit}>
                Gửi kết quả kiểm tra
              </Button>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default QaStageQualityCheck;


