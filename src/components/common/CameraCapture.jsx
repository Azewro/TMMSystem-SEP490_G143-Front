import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import toast from 'react-hot-toast';

const CameraCapture = ({ show, onHide, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    // Start camera when modal opens
    useEffect(() => {
        if (show) {
            startCamera();
        } else {
            stopCamera();
        }
        // Cleanup on unmount
        return () => {
            stopCamera();
        };
    }, [show]);

    const startCamera = async () => {
        try {
            setCapturedImage(null);
            setIsCameraReady(false);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prefer back camera on mobile
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.error("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
            onHide();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraReady(false);
    };

    const handleCanPlay = () => {
        setIsCameraReady(true);
    };

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to data URL for preview
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
        }
    }, []);

    const retakePhoto = () => {
        setCapturedImage(null);
        setIsCameraReady(false);

        // Try to re-attach existing stream first
        if (stream && videoRef.current) {
            // Check if stream is still active
            const tracks = stream.getTracks();
            const allTracksActive = tracks.every(track => track.readyState === 'live');

            if (allTracksActive) {
                videoRef.current.srcObject = stream;
                return;
            }
        }

        // Fallback: restart camera if stream is not available
        startCamera();
    };

    const confirmPhoto = () => {
        if (canvasRef.current) {
            canvasRef.current.toBlob((blob) => {
                if (blob) {
                    // Create a File object from the Blob
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                    onHide();
                }
            }, 'image/jpeg', 0.9); // 0.9 quality
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Chụp ảnh lỗi</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center p-0 bg-dark">
                <div style={{ position: 'relative', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!capturedImage ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            onCanPlay={handleCanPlay}
                            style={{ maxWidth: '100%', maxHeight: '60vh', display: isCameraReady ? 'block' : 'none' }}
                        />
                    ) : (
                        <img
                            src={capturedImage}
                            alt="Captured"
                            style={{ maxWidth: '100%', maxHeight: '60vh' }}
                        />
                    )}

                    {!isCameraReady && !capturedImage && (
                        <div className="text-white">Đang khởi động camera...</div>
                    )}

                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Hủy
                </Button>

                {!capturedImage ? (
                    <Button variant="primary" onClick={capturePhoto} disabled={!isCameraReady}>
                        <i className="bi bi-camera-fill me-2"></i>Chụp ảnh
                    </Button>
                ) : (
                    <>
                        <Button variant="outline-primary" onClick={retakePhoto}>
                            Chụp lại
                        </Button>
                        <Button variant="success" onClick={confirmPhoto}>
                            Sử dụng ảnh này
                        </Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default CameraCapture;
