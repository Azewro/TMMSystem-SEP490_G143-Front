import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Button, ProgressBar, Table, Badge, Form } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

// Mock data cho chi tiết công đoạn theo từng code
const STAGE_CONFIG = {
  MAY: {
    stageName: 'May',
    responsiblePerson: 'Hoàng Văn E',
  },
  NHUOM: {
    stageName: 'Nhuộm',
    // Công đoạn nhuộm outsource nhưng Production Manager vẫn chịu trách nhiệm
    responsiblePerson: 'Production Manager',
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
      progressPercent: 0,
      remainingHours: 4.0,
      status: 'CHO_BAT_DAU',
      history: [],
    };
  }

  return {
    ...BASE_STAGE_DETAIL,
    stageName: config.stageName,
    responsiblePerson: config.responsiblePerson,
  };
};

const StageProgressDetail = () => {
  const navigate = useNavigate();
  const { orderId, stageCode } = useParams();
  const stageKey = (stageCode || 'MAY').toUpperCase();

  const [stageData, setStageData] = useState(() => getInitialStageData(stageKey));
  const [progressInput, setProgressInput] = useState('');

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
    setStageData((prev) => ({
      ...prev,
      progressPercent: target,
      remainingHours: Math.max(0, prev.remainingHours - deltaHours),
      status: target >= 100 ? 'HOAN_THANH' : 'DANG_LAM',
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
    }));
    setProgressInput('');
  };

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
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div className="text-muted">Tiến độ hiện tại</div>
                    <div className="h4 mb-0">{stageData.progressPercent}%</div>
                    <small className="text-muted">
                      Còn lại khoảng {stageData.remainingHours.toFixed(1)} giờ
                    </small>
                  </div>
                  <div className="text-end">
                    <div className="text-muted">Thời gian đã làm</div>
                    <div className="h5 mb-0">
                      {stageData.plannedDurationHours.toFixed(1)} giờ
                    </div>
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

            <Card className="shadow-sm">
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
                        <th>Thời gian bắt đầu thực tế</th>
                        <th>Thời gian kết thúc thực tế</th>
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
          </Container>
        </div>
      </div>
    </div>
  );
};

export default StageProgressDetail;


