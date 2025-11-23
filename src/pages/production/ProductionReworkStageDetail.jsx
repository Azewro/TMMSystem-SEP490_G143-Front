import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, ProgressBar, Table, Form, Badge } from 'react-bootstrap';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const REWORK_STAGE_CONFIG = {
  CUONG_MAC: {
    stageName: 'Cuồng Mắc',
    responsiblePerson: 'Nguyễn Văn A',
    criteria: [
      { title: 'Chất lượng sợi', result: 'PASS' },
      { title: 'Độ căng sợi', result: 'PASS' },
      { title: 'Sợi mắc đều', result: 'PASS' },
    ],
  },
  DET: {
    stageName: 'Dệt',
    responsiblePerson: 'Trần Thị B',
    criteria: [
      { title: 'Độ bền sợi', result: 'FAIL', image: 'https://placekitten.com/640/260' },
      { title: 'Hình dáng khăn', result: 'PASS' },
      { title: 'Bề mặt vải', result: 'PASS' },
    ],
  },
  NHUOM: {
    stageName: 'Nhuộm',
    responsiblePerson: 'Production Manager',
    criteria: [
      { title: 'Màu sắc đồng đều', result: 'PASS' },
      { title: 'Độ bền màu', result: 'PASS' },
    ],
  },
  CAT: {
    stageName: 'Cắt',
    responsiblePerson: 'Phạm Thị D',
    criteria: [
      { title: 'Kích thước khăn', result: 'PASS' },
      { title: 'Độ nghiêng góc', result: 'PASS' },
      { title: 'Vết cắt', result: 'PASS' },
    ],
  },
  MAY: {
    stageName: 'May',
    responsiblePerson: 'Hoàng Văn E',
    criteria: [
      { title: 'Tiêu chuẩn bền khăn', result: 'PASS' },
      { title: 'Chỉ thừa', result: 'PASS' },
    ],
  },
  DONG_GOI: {
    stageName: 'Đóng gói',
    responsiblePerson: 'Võ Thị F',
    criteria: [
      { title: 'Độ sạch khăn', result: 'PASS' },
      { title: 'Gấp khăn', result: 'PASS' },
    ],
  },
};

const getInitialReworkStageData = (stageKey) => {
  const config = REWORK_STAGE_CONFIG[stageKey] || REWORK_STAGE_CONFIG.CUONG_MAC;

  return {
    stageName: config.stageName,
    responsiblePerson: config.responsiblePerson,
    stageStartTime: '2025-11-19 16:42',
    stageEndTime: null,
    workedHours: 0.4,
    progressPercent: stageKey === 'CUONG_MAC' ? 65 : 10,
    remainingHours: 4.9,
    status: stageKey === 'CUONG_MAC' ? 'DANG_LAM' : 'CHO_BAT_DAU',
    history:
      stageKey === 'CUONG_MAC'
        ? [
            {
              id: 1,
              description: 'Tăng từ 0% → 30%',
              durationHours: 4,
              startTime: '2025-11-17 08:00',
              endTime: '2025-11-17 12:00',
            },
            {
              id: 2,
              description: 'Tăng từ 30% → 65%',
              durationHours: 5,
              startTime: '2025-11-17 13:00',
              endTime: '2025-11-17 18:00',
            },
          ]
        : [],
    criteria: config.criteria,
  };
};

const ProductionReworkStageDetail = () => {
  const navigate = useNavigate();
  const { orderId, stageCode } = useParams();
  const stageKey = (stageCode || 'CUONG_MAC').toUpperCase();

  const [stageData, setStageData] = useState(() => getInitialReworkStageData(stageKey));
  const [progressInput, setProgressInput] = useState('');

  const handleBack = () => {
    navigate(`/production/rework-orders/${orderId || 'LOT-2025-001'}`);
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
    }));
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

  const statusConfig =
    stageData.status === 'HOAN_THANH'
      ? { label: 'Hoàn thành', variant: 'success' }
      : stageData.status === 'DANG_LAM'
      ? { label: 'Đang làm', variant: 'info' }
      : { label: 'Chờ bắt đầu', variant: 'secondary' };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="production" />
        <div className="flex-grow-1" style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}>
          <Container fluid className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <Button variant="link" className="btn-back-link mb-2" onClick={handleBack}>
                  &larr; Quay lại kế hoạch bổ sung
                </Button>
                <h4 className="mb-0">Tiến độ công đoạn {stageData.stageName}</h4>
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

            {stageData.criteria.length > 0 && (
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <strong>Kết quả kiểm tra</strong>
                    <div className="d-flex align-items-center gap-3">
                      <small className="text-muted">Kết quả do KCS gửi về</small>
                      <Badge
                        bg={stageData.criteria.some((item) => item.result === 'FAIL') ? 'danger' : 'success'}
                      >
                        {stageData.criteria.some((item) => item.result === 'FAIL') ? 'Lỗi nặng' : 'Đạt'}
                      </Badge>
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-3">
                    {stageData.criteria.map((criteriaItem, index) => (
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
                        {criteriaItem.result === 'FAIL' ? (
                          <img
                            src={
                              criteriaItem.image ||
                              'https://placehold.co/640x240?text=QC+Image'
                            }
                            alt={criteriaItem.title}
                            className="rounded mt-2"
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        ) : (
                          criteriaItem.remark && <div className="mt-2 text-muted small">{criteriaItem.remark}</div>
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

export default ProductionReworkStageDetail;

