import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Button, ProgressBar, Table, Badge, Form } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

// Mock data cho chi tiết công đoạn theo từng code
const STAGE_CONFIG = {
  CUONG_MAC: {
    stageName: 'Cuồng Mắc',
    responsiblePerson: 'Nguyễn Văn A',
  },
  DET: {
    stageName: 'Dệt',
    responsiblePerson: 'Trần Thị B',
  },
  NHUOM: {
    stageName: 'Nhuộm',
    responsiblePerson: 'Production Manager',
  },
  CAT: {
    stageName: 'Cắt',
    responsiblePerson: 'Phạm Thị D',
  },
  MAY: {
    stageName: 'May',
    responsiblePerson: 'Hoàng Văn E',
  },
  DONG_GOI: {
    stageName: 'Đóng gói',
    responsiblePerson: 'Võ Thị F',
  },
};

const BASE_STAGE_DETAIL = {
  orderCode: 'ORD-2025-001',
  productName: 'Khăn tắm cao cấp',
  quantity: 1000,
  plannedDurationHours: 9.1,
  progressPercent: 65,
  remainingHours: 4.9,
  status: 'DANG_LAM',
  workedHours: 4.0,
  stageStartTime: '2025-11-17 08:00',
  stageEndTime: null,
  history: [
    {
      id: 1,
      description: 'Tăng từ 0% → 30%',
      durationHours: 4,
      startTime: '2025-11-17 08:00',
      endTime: '2025-11-17 12:00'
    },
    {
      id: 2,
      description: 'Tăng từ 30% → 65%',
      durationHours: 5,
      startTime: '2025-11-17 13:00',
      endTime: '2025-11-17 18:00'
    }
  ]
};

const getInitialStageData = (stageKey) => {
  const config = STAGE_CONFIG[stageKey] || STAGE_CONFIG.MAY;

  if (stageKey === 'NHUOM') {
    return {
      ...BASE_STAGE_DETAIL,
      stageName: config.stageName,
      responsiblePerson: config.responsiblePerson,
      progressPercent: 10,
      remainingHours: 9.0,
      status: 'DANG_LAM',
      workedHours: 0.4,
      stageStartTime: '2025-11-19 16:42',
      stageEndTime: null,
      history: [
        {
          id: 1,
          description: 'Tăng từ 0% → 10%',
          durationHours: 0.4,
          startTime: '2025-11-19 16:42',
          endTime: '2025-11-19 16:42'
        }
      ],
    };
  }

  return {
    ...BASE_STAGE_DETAIL,
    stageName: config.stageName,
    responsiblePerson: config.responsiblePerson,
  };
};

const QA_CRITERIA_BY_STAGE = {
  CUONG_MAC: [
    { title: 'Chất lượng sợi', result: 'PASS' },
    { title: 'Độ căng sợi', result: 'PASS' },
    { title: 'Sợi mắc đều', result: 'PASS' },
  ],
  DET: [
    { title: 'Độ bền sợi', result: 'FAIL', remark: 'Không đạt' },
    { title: 'Hình dáng khăn', result: 'PASS' },
    { title: 'Bề mặt vải', result: 'PASS' },
  ],
  NHUOM: [
    { title: 'Màu sắc đồng đều', result: 'PASS' },
    { title: 'Độ bền màu', result: 'PASS' },
  ],
  CAT: [
    { title: 'Kích thước khăn', result: 'PASS' },
    { title: 'Độ nghiêng góc', result: 'PASS' },
    { title: 'Độ đồng đều đường cắt', result: 'PASS' },
    { title: 'Vết cắt', result: 'PASS' },
  ],
  MAY: [
    { title: 'Tiêu chuẩn bền khăn', result: 'PASS' },
    { title: 'Chỉ thừa', result: 'PASS' },
  ],
  DONG_GOI: [
    { title: 'Độ sạch khăn', result: 'PASS' },
    { title: 'Gấp khăn', result: 'PASS' },
  ],
};

const StageProgressDetail = () => {
  const navigate = useNavigate();
  const { orderId, stageCode } = useParams();
  const stageKey = (stageCode || 'MAY').toUpperCase();

  const [stageData, setStageData] = useState(() => getInitialStageData(stageKey));
  const [progressInput, setProgressInput] = useState('');
  const qaCriteria = QA_CRITERIA_BY_STAGE[stageKey] || [];

  useEffect(() => {
    setStageData(getInitialStageData(stageKey));
    setProgressInput('');
  }, [stageKey]);

  const handleBack = () => {
    navigate(`/production/orders/${orderId || stageData.orderCode}`);
  };

  const isManualUpdateEnabled = stageKey === 'NHUOM';

  const handleUpdateProgress = () => {
    const target = Number(progressInput);
    if (Number.isNaN(target) || target < 0 || target > 100) {
      alert('Vui lòng nhập tiến độ từ 0 đến 100');
      return;
    }
    if (target <= stageData.progressPercent) {
      alert('Tiến độ mới phải lớn hơn tiến độ hiện tại');
      return;
    }

    const now = new Date();
    const formatted = now.toLocaleString('vi-VN', { hour12: false });
    const deltaHours = 0.4;
    setStageData((prev) => {
      const nextProgress = {
        ...prev,
        progressPercent: target,
        remainingHours: Math.max(0, prev.remainingHours - deltaHours),
        status: target >= 100 ? 'HOAN_THANH' : 'DANG_LAM',
        workedHours: +(prev.workedHours + deltaHours).toFixed(1),
        stageStartTime: prev.stageStartTime || formatted,
        stageEndTime: target >= 100 ? formatted : prev.stageEndTime,
        history: [
          ...prev.history,
          {
            id: prev.history.length + 1,
            description: `Tăng từ ${prev.progressPercent}% → ${target}%`,
            durationHours: deltaHours,
            startTime: formatted,
            endTime: formatted,
          },
        ],
      };
      return nextProgress;
    });
    setProgressInput('');
  };

  const infoFields = useMemo(
    () => [
      { label: 'Công đoạn', value: stageData.stageName },
      { label: 'Thời gian bắt đầu công đoạn', value: stageData.stageStartTime || 'Chưa bắt đầu' },
      { label: 'Thời gian kết thúc công đoạn', value: stageData.stageEndTime || 'Chưa hoàn thành' },
      { label: 'Thời gian đã làm', value: `${(stageData.workedHours || 0).toFixed(1)} giờ` },
      { label: 'Người phụ trách', value: stageData.responsiblePerson },
    ],
    [stageData],
  );

  const statusConfig = useMemo(() => {
    if (stageData.status === 'HOAN_THANH') {
      return { label: 'Hoàn thành', variant: 'success' };
    }
    if (stageData.status === 'DANG_LAM') {
      return { label: 'Đang làm', variant: 'info' };
    }
    return { label: 'Chờ bắt đầu', variant: 'secondary' };
  }, [stageData.status]);

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
                <h4 className="mb-0">Tiến độ công đoạn {stageData.stageName}</h4>
                <small className="text-muted">
                  Đơn hàng {orderId || stageData.orderCode} • {stageData.productName} •{' '}
                  {stageData.quantity.toLocaleString('vi-VN')} sản phẩm
                </small>
              </div>
              <div className="text-end">
                <div className="mb-1">
                  <span className="text-muted me-2">Người phụ trách:</span>
                  <strong>{stageData.responsiblePerson}</strong>
                </div>
                <div>
                  <Badge bg={stageData.status === 'HOAN_THANH' ? 'success' : 'info'}>
                    {stageData.status === 'HOAN_THANH' ? 'Hoàn thành' : 'Đang làm'}
                  </Badge>
                </div>
              </div>
            </div>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="row g-3">
                  {infoFields.map((item) => (
                    <div key={item.label} className="col-12 col-md-6 col-lg-4">
                      <div className="text-muted small mb-1">{item.label}</div>
                      <Form.Control readOnly value={item.value} className="fw-semibold" style={{ backgroundColor: '#f8f9fb' }} />
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
                    <small className="text-muted">
                      Còn lại {stageData.remainingHours.toFixed(1)} giờ (mô phỏng)
                    </small>
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

            {isManualUpdateEnabled && (
              <Card className="shadow-sm mb-3" style={{ borderColor: '#e7f1ff', backgroundColor: '#f5f9ff' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <strong>Cập nhật tiến độ (công đoạn Nhuộm)</strong>
                    <small className="text-muted">Nhập tiến độ từ 0 đến 100</small>
                  </div>
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <Form.Control
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Tiến độ (%)"
                      value={progressInput}
                      onChange={(e) => setProgressInput(e.target.value)}
                      style={{ maxWidth: 200 }}
                    />
                    <Button variant="dark" className="btn-pill-primary" onClick={handleUpdateProgress}>
                      Cập nhật
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            <Card className="shadow-sm mb-3">
              <Card.Body className="p-0">
                <div className="p-3 border-bottom">
                  <strong>Lịch sử tiến độ</strong>
                </div>
                {stageData.history.length === 0 ? (
                  <div className="p-4 text-center text-muted">Chưa có lịch sử cập nhật</div>
                ) : (
                  <Table responsive className="mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Tiến trình</th>
                        <th>Thời gian làm</th>
                        <th>Thời gian bắt đầu</th>
                        <th>Thời gian kết thúc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stageData.history.map((item) => (
                        <tr key={item.id}>
                          <td>{item.description}</td>
                          <td>{item.durationHours} giờ</td>
                          <td>{item.startTime}</td>
                          <td>{item.endTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>

            {qaCriteria.length > 0 && (
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <strong>Tiêu chí kiểm tra sau QC</strong>
                    <small className="text-muted">Kết quả do KCS gửi về</small>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {qaCriteria.map((criteriaItem, index) => (
                      <div
                        key={`${criteriaItem.title}-${index}`}
                        className="p-3 rounded"
                        style={{
                          border: `1px solid ${criteriaItem.result === 'PASS' ? '#c3ebd3' : '#f9cfd9'}`,
                          backgroundColor: criteriaItem.result === 'PASS' ? '#e8f7ef' : '#fdecef',
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="fw-semibold">{criteriaItem.title}</div>
                          <Badge bg={criteriaItem.result === 'PASS' ? 'success' : 'danger'}>
                            {criteriaItem.result === 'PASS' ? 'Đạt' : 'Không đạt'}
                          </Badge>
                        </div>
                        {criteriaItem.remark && (
                          <div className="mt-2 text-muted small">{criteriaItem.remark}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </Container>
        </div>
      </div>
    </div>
  );
};

export default StageProgressDetail;


