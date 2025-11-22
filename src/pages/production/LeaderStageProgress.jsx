import React, { useMemo, useState } from 'react';
import { Container, Card, Button, ProgressBar, Table, Form, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const QA_CRITERIA = [
  { title: 'Độ bền sợi', result: 'FAIL', image: 'https://placekitten.com/640/260' },
  { title: 'Hình dáng khăn', result: 'PASS' },
  { title: 'Bề mặt vải', result: 'PASS' },
];

const ORDER_SUMMARY = {
  id: 'LOT-002',
  productName: 'Khăn mặt cotton',
  size: '30x30cm',
  quantity: 2000,
  expectedStartDate: '2025-11-18',
  expectedFinishDate: '2025-12-01',
  statusLabel: 'Chờ kiểm tra',
  statusVariant: 'secondary',
};

const LeaderStageProgress = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [currentProgress, setCurrentProgress] = useState(10);
  const [inputProgress, setInputProgress] = useState('');
  const [totalHours, setTotalHours] = useState(0.4);
  const [history, setHistory] = useState([
    {
      id: 1,
      description: 'Tăng từ 0% → 10%',
      durationHours: 0.4,
      startTime: '2025-11-19 16:42',
      endTime: '2025-11-19 16:42',
    },
  ]);
  const [stageStartTime, setStageStartTime] = useState('2025-11-19 16:42');
  const [stageEndTime, setStageEndTime] = useState(null);

  const orderInfo = useMemo(
    () => ({
      ...ORDER_SUMMARY,
      id: orderId || ORDER_SUMMARY.id,
    }),
    [orderId],
  );

  const handleBack = () => {
    navigate('/leader/orders');
  };

  const handleUpdateProgress = () => {
    const target = Number(inputProgress);
    if (Number.isNaN(target) || target < 0 || target > 100) {
      alert('Vui lòng nhập tiến độ từ 0 đến 100');
      return;
    }
    if (target <= currentProgress) {
      alert('Tiến độ mới phải lớn hơn tiến độ hiện tại');
      return;
    }

    if (!stageStartTime) {
      const confirmed = window.confirm(`Bắt đầu cập nhật tiến độ cho lô ${orderId || 'LOT-002'}?`);
      if (!confirmed) {
        return;
      }
      const startFormatted = new Date().toLocaleString('vi-VN', { hour12: false });
      setStageStartTime(startFormatted);
    }

    const now = new Date();
    const formatted = now.toLocaleString('vi-VN', { hour12: false });

    // Đơn giản: giả lập thời gian làm 0.4 giờ cho mỗi lần cập nhật
    const deltaHours = 0.4;

    const newHistoryItem = {
      id: history.length + 1,
      description: `Tăng từ ${currentProgress}% → ${target}%`,
      durationHours: deltaHours,
      startTime: formatted,
      endTime: formatted
    };

    setHistory((prev) => [...prev, newHistoryItem]);
    setCurrentProgress(target);
    setTotalHours((prev) => +(prev + deltaHours).toFixed(1));
    if (target === 100) {
      setStageEndTime(formatted);
    }
    setInputProgress('');
  };

  const infoFields = [
    { label: 'Công đoạn', value: 'Cuồng Mắc' },
    { label: 'Thời gian bắt đầu công đoạn', value: stageStartTime || 'Chưa bắt đầu' },
    { label: 'Thời gian kết thúc công đoạn', value: stageEndTime || 'Chưa hoàn thành' },
    { label: 'Thời gian đã làm', value: `${totalHours.toFixed(1)} giờ` },
    { label: 'Người phụ trách', value: 'Nguyễn Văn A' }
  ];

  const statusConfig = currentProgress >= 100
    ? { label: 'Hoàn thành', variant: 'success' }
    : currentProgress > 0
      ? { label: 'Đang làm', variant: 'info' }
      : { label: 'Chưa bắt đầu', variant: 'secondary' };

  return (
    <div className="customer-layout">
      <Header />
      <div className="d-flex">
        <InternalSidebar userRole="leader" />
        <div
          className="flex-grow-1"
          style={{ backgroundColor: '#f8f9fa', minHeight: 'calc(100vh - 70px)' }}
        >
          <Container fluid className="p-4">
            <Button variant="link" className="p-0 mb-3" onClick={handleBack}>
              &larr; Quay lại kế hoạch
            </Button>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="row g-4">
                  <div className="col-lg-4 d-flex gap-3 align-items-center">
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 12,
                        border: '1px dashed #ced4da',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        color: '#adb5bd',
                      }}
                    >
                      QR
                    </div>
                    <div>
                      <div className="text-muted small mb-1">Mã lô sản xuất</div>
                      <h5 className="mb-1">{orderInfo.id}</h5>
                      <small className="text-muted">Đơn hàng {orderInfo.productName}</small>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-2">
                      <div className="text-muted small">Tên sản phẩm</div>
                      <div className="fw-semibold">{orderInfo.productName}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Kích thước</div>
                      <div className="fw-semibold">{orderInfo.size}</div>
                    </div>
                    <div>
                      <div className="text-muted small">Số lượng</div>
                      <div className="fw-semibold">{orderInfo.quantity.toLocaleString('vi-VN')} sản phẩm</div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-2">
                      <div className="text-muted small">Ngày bắt đầu dự kiến</div>
                      <div className="fw-semibold">{orderInfo.expectedStartDate}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Ngày kết thúc dự kiến</div>
                      <div className="fw-semibold">{orderInfo.expectedFinishDate}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="text-muted small mb-0">Trạng thái</div>
                      <Badge bg={orderInfo.statusVariant} className="status-badge">
                        {orderInfo.statusLabel}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="row g-3">
                  {infoFields.map((field) => (
                    <div key={field.label} className="col-12 col-md-6 col-lg-4">
                      <div className="text-muted small mb-1">{field.label}</div>
                      <Form.Control
                        readOnly
                        value={field.value}
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
                <div className="mb-3">
                  <div className="text-muted mb-1">Tiến độ hiện tại</div>
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div className="h5 mb-0">{currentProgress}%</div>
                    <div className="d-flex align-items-center gap-3">
                      <Badge bg={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>
                  </div>
                  <ProgressBar
                    now={currentProgress}
                    label={`${currentProgress}%`}
                    style={{ height: 18, borderRadius: 999 }}
                  />
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm mb-3" style={{ borderColor: '#e7f1ff', backgroundColor: '#f5f9ff' }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <strong>Cập nhật tiến độ</strong>
                  <small className="text-muted">Nhập tiến độ từ 0 đến 100</small>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <Form.Control
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Tiến độ (%)"
                    value={inputProgress}
                    onChange={(e) => setInputProgress(e.target.value)}
                    style={{ maxWidth: 200 }}
                  />
                  <Button variant="dark" onClick={handleUpdateProgress}>
                    Cập nhật
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <div className="p-3 border-bottom">
                  <strong>Lịch sử tiến độ</strong>
                </div>
                {history.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    Chưa có lịch sử cập nhật
                  </div>
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
                      {history.map((item) => (
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

            <Card className="shadow-sm mt-3">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <strong>Kết quả kiểm tra</strong>
                  <div className="d-flex align-items-center gap-3">
                    <small className="text-muted">Kết quả do KCS gửi</small>
                    <Badge
                      bg={QA_CRITERIA.some((item) => item.result === 'FAIL') ? 'danger' : 'success'}
                    >
                      {QA_CRITERIA.some((item) => item.result === 'FAIL') ? 'Lỗi nặng' : 'Đạt'}
                    </Badge>
                  </div>
                </div>
                <div className="d-flex flex-column gap-3">
                  {QA_CRITERIA.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="p-3 rounded"
                      style={{
                        border: `1px solid ${item.result === 'PASS' ? '#c3ebd3' : '#f9cfd9'}`,
                        backgroundColor: item.result === 'PASS' ? '#e8f7ef' : '#fdecef',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="fw-semibold">{item.title}</div>
                        <Badge bg={item.result === 'PASS' ? 'success' : 'danger'}>
                          {item.result === 'PASS' ? 'Đạt' : 'Không đạt'}
                        </Badge>
                      </div>
                      {item.result === 'FAIL' ? (
                        <img
                          src={
                            item.image ||
                            'https://placehold.co/640x240?text=QC+Image'
                          }
                          alt={item.title}
                          className="rounded mt-2"
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      ) : (
                        item.remark && <div className="text-muted mt-1 small">{item.remark}</div>
                      )}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Container>
        </div>
      </div>
    </div>
  );
};

export default LeaderStageProgress;


