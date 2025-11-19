import React, { useState } from 'react';
import { Container, Card, Button, ProgressBar, Table, Form } from 'react-bootstrap';
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
    setInputProgress('');
  };

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

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <div className="text-muted small mb-1">Công đoạn</div>
                <h4 className="mb-0">Cuồng mắc</h4>
              </div>
              <div className="text-end">
                <div className="text-muted small">Thời gian đã làm</div>
                <div className="h5 mb-0">{totalHours.toFixed(1)} giờ</div>
              </div>
            </div>

            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="mb-3">
                  <div className="text-muted mb-1">Tiến độ hiện tại</div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="h5 mb-0">{currentProgress}%</div>
                    <small className="text-muted">
                      Còn lại {Math.max(0, (100 - currentProgress) / 10).toFixed(1)} giờ (mô phỏng)
                    </small>
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


