import React, { useState } from 'react';
import { Container, Card, Button, ProgressBar, Table, Form, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header';
import InternalSidebar from '../../components/common/InternalSidebar';

const LeaderStageProgress = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [currentProgress, setCurrentProgress] = useState(0);
  const [inputProgress, setInputProgress] = useState('');
  const [totalHours, setTotalHours] = useState(0);
  const [history, setHistory] = useState([]);
  const [actualStartTime, setActualStartTime] = useState(null);
  const [actualEndTime, setActualEndTime] = useState(null);

  const handleBack = () => {
    navigate(`/leader/orders/${orderId || 'LOT-002'}`);
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

    if (!actualStartTime) {
      const confirmed = window.confirm(`Bắt đầu cập nhật tiến độ cho lô ${orderId || 'LOT-002'}?`);
      if (!confirmed) {
        return;
      }
      const startFormatted = new Date().toLocaleString('vi-VN', { hour12: false });
      setActualStartTime(startFormatted);
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
      setActualEndTime(formatted);
    }
    setInputProgress('');
  };

  const infoFields = [
    { label: 'Công đoạn', value: 'Cuồng Mắc' },
    { label: 'Thời gian bắt đầu thực tế', value: actualStartTime || 'Chưa bắt đầu' },
    { label: 'Thời gian kết thúc thực tế', value: actualEndTime || 'Chưa hoàn thành' },
    { label: 'Thời gian đã làm', value: `${totalHours.toFixed(1)} giờ` },
    { label: 'Người phụ trách', value: 'Võ Thị F' }
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
                      <small className="text-muted">
                        Còn lại {Math.max(0, (100 - currentProgress) / 10).toFixed(1)} giờ (mô phỏng)
                      </small>
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
                        <th>Thời gian bắt đầu thực tế</th>
                        <th>Thời gian kết thúc thực tế</th>
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
          </Container>
        </div>
      </div>
    </div>
  );
};

export default LeaderStageProgress;


