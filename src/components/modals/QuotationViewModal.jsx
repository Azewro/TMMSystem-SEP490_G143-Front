import React, { useState, useEffect } from 'react';
import { Modal, Card, Table, Spinner, Alert } from 'react-bootstrap';
import { quotationService } from '../../api/quotationService';
import { productService } from '../../api/productService';

// Helper functions
const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : 'N/A';

// Convert number to Vietnamese words
const numberToWords = (num) => {
    const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
    const teens = ["mười", "mười một", "mười hai", "mười ba", "mười bốn", "mười lăm", "mười sáu", "mười bảy", "mười tám", "mười chín"];
    const tens = ["", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];
    const powers = ["", "nghìn", "triệu", "tỷ"];

    if (num === 0) return "không đồng";

    let words = [];
    let i = 0;

    while (num > 0) {
        let chunk = num % 1000;
        if (chunk > 0) {
            let chunkWords = [];
            let h = Math.floor(chunk / 100);
            let t = Math.floor((chunk % 100) / 10);
            let u = chunk % 10;

            if (h > 0) {
                chunkWords.push(units[h] + " trăm");
            }

            if (t > 1) {
                chunkWords.push(tens[t]);
                if (u === 1) {
                    chunkWords.push("mốt");
                } else if (u > 0) {
                    chunkWords.push(units[u]);
                }
            } else if (t === 1) {
                chunkWords.push(teens[u]);
            } else if (u > 0) {
                if (h > 0 || num >= 1000) {
                    chunkWords.push("linh " + units[u]);
                } else {
                    chunkWords.push(units[u]);
                }
            }

            if (powers[i]) {
                chunkWords.push(powers[i]);
            }
            words.unshift(chunkWords.join(" "));
        }
        num = Math.floor(num / 1000);
        i++;
    }

    const finalWords = words.join(" ").trim();
    return finalWords.charAt(0).toUpperCase() + finalWords.slice(1) + " đồng";
};

const QuotationViewModal = ({ show, onHide, quotationId }) => {
    const [quotation, setQuotation] = useState(null);
    const [productDetails, setProductDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchQuotationDetails = async () => {
            if (!quotationId || !show) return;

            setLoading(true);
            setError('');
            try {
                // Fetch quotation details
                const quotationData = await quotationService.getQuotationById(quotationId);

                // Fetch product details for each line item
                const productPromises = quotationData.details.map(item =>
                    productService.getProductById(item.productId)
                );
                const products = await Promise.all(productPromises);

                // Create product map
                const productsMap = products.reduce((acc, product) => {
                    acc[product.id] = product;
                    return acc;
                }, {});
                setProductDetails(productsMap);

                // Enrich details with totalPrice
                const enrichedDetails = quotationData.details.map(item => ({
                    ...item,
                    totalPrice: item.unitPrice * item.quantity
                }));

                setQuotation({
                    ...quotationData,
                    details: enrichedDetails,
                });

            } catch (err) {
                console.error('Error fetching quotation:', err);
                setError(err.message || 'Không thể tải báo giá');
            } finally {
                setLoading(false);
            }
        };

        fetchQuotationDetails();
    }, [quotationId, show]);

    // Calculate total weight
    const totalWeight = quotation?.details.reduce((total, item) => {
        const product = productDetails[item.productId];
        const weight = (product?.standardWeight || 0) / 1000; // Convert gram to kg
        return total + (item.quantity * weight);
    }, 0) || 0;

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>Bảng Báo Giá {quotation?.quotationNumber || ''}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" />
                        <p className="mt-2">Đang tải báo giá...</p>
                    </div>
                ) : error ? (
                    <Alert variant="danger">{error}</Alert>
                ) : quotation ? (
                    <Card className="shadow-sm p-4">
                        {/* Company Header */}
                        <div className="text-end mb-4">
                            <h5 className="mb-0">CÔNG TY TNHH DỆT MAY MỸ ĐỨC</h5>
                            <p className="mb-0">Địa chỉ: X. Phùng Xá, H. Mỹ Đức, Hà Nội, Việt Nam</p>
                        </div>

                        {/* Quotation Number */}
                        <div className="mb-4">
                            <p className="mb-1">Mã báo giá: {quotation.quotationNumber || `QUO-${quotation.id}`}</p>
                        </div>

                        {/* Title */}
                        <h2 className="text-center mb-4 fw-bold">BẢNG BÁO GIÁ</h2>

                        {/* Customer Info */}
                        <div className="mb-4">
                            <p className="mb-1">Kính gửi: {quotation.contactPersonSnapshot || quotation.customer?.contactPerson || quotation.customer?.companyName || 'Quý khách hàng'}</p>
                            <p className="mb-1">{quotation.customer?.companyName || 'Công Ty TNHH Dệt May Mỹ Đức'}</p>
                            <p className="mb-0">xin trân trọng báo giá các sản phẩm như sau:</p>
                        </div>

                        {/* Product Table */}
                        <Table bordered responsive className="mb-4">
                            <thead>
                                <tr className="text-center">
                                    <th style={{ width: '5%' }}>STT</th>
                                    <th style={{ width: '35%' }}>THÔNG TIN SẢN PHẨM</th>
                                    <th style={{ width: '10%' }}>SỐ LƯỢNG</th>
                                    <th style={{ width: '10%' }}>KHỐI LƯỢNG (kg)</th>
                                    <th style={{ width: '15%' }}>ĐƠN GIÁ (VNĐ)</th>
                                    <th style={{ width: '25%' }}>THÀNH TIỀN (VNĐ)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotation.details.map((item, idx) => {
                                    const product = productDetails[item.productId];
                                    const itemWeight = product ? (item.quantity * (product.standardWeight || 0)) / 1000 : 0;
                                    return (
                                        <tr key={item.id || idx}>
                                            <td className="text-center">{idx + 1}</td>
                                            <td>
                                                <div>{product?.name || 'Sản phẩm không xác định'}</div>
                                                <small className="text-muted">Kích thước: {product?.standardDimensions || 'N/A'}</small>
                                            </td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-center">{itemWeight.toFixed(2)}</td>
                                            <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                                            <td className="text-end fw-bold">{formatCurrency(item.totalPrice)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="3" className="text-end fw-bold">TỔNG CỘNG:</td>
                                    <td className="text-center fw-bold">{totalWeight.toFixed(2)}</td>
                                    <td className="text-end fw-bold"></td>
                                    <td className="text-end fw-bold">{formatCurrency(quotation.totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </Table>

                        {/* Total in words */}
                        <div className="mb-3">
                            <p className="mb-1">(Bằng chữ: {numberToWords(quotation.totalAmount)})</p>
                        </div>

                        {/* Notes */}
                        <div className="mb-3">
                            <p className="mb-1 fw-bold">Ghi chú:</p>
                            <ul className="list-unstyled ms-3">
                                <li>- Đơn giá chưa bao gồm thuế VAT</li>
                                <li>- Đơn giá chưa bao gồm phí vận chuyển</li>
                            </ul>
                        </div>

                        {/* Signature */}
                        <div className="text-end mb-3">
                            <p className="mb-1">Hà Nội, ngày {formatDate(quotation.createdAt)}</p>
                            <p className="mb-0 fw-bold">CÔNG TY TNHH DỆT MAY MỸ ĐỨC</p>
                        </div>

                        <p className="mb-0 text-center">Trân trọng kính chào!</p>
                    </Card>
                ) : (
                    <div className="text-center py-5 text-muted">Không tìm thấy báo giá</div>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default QuotationViewModal;
