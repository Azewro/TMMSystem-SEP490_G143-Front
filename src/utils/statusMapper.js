/**
 * Status mapping utilities for mapping backend status to Vietnamese labels
 * and determining button actions based on status and user role
 */

// Map backend status to Vietnamese display label
export const getStatusLabel = (status) => {
  const statusMap = {
    // ProductionOrder statuses
    'PENDING_APPROVAL': 'Chờ phê duyệt',
    'WAITING_PRODUCTION': 'Chờ sản xuất',
    'CHO_SAN_XUAT': 'Chờ sản xuất',
    'DANG_SAN_XUAT': 'Đang sản xuất',
    'IN_PROGRESS': 'Đang sản xuất',
    'ORDER_COMPLETED': 'Hoàn thành',
    'COMPLETED': 'Hoàn thành',
    'HOAN_THANH': 'Hoàn thành',

    // ProductionStage statuses
    'PENDING': 'đợi',
    'WAITING': 'chờ làm',
    'READY': 'sẵn sàng sản xuất',
    'READY_TO_PRODUCE': 'sẵn sàng sản xuất',
    'IN_PROGRESS': 'đang làm',
    'WAITING_QC': 'chờ kiểm tra',
    'QC_IN_PROGRESS': 'đang kiểm tra',
    'QC_PASSED': 'đạt',
    'QC_FAILED': 'không đạt',
    'WAITING_REWORK': 'chờ sửa',
    'REWORK_IN_PROGRESS': 'đang sửa',
    'COMPLETED': 'hoàn thành',
    'DANG_LAM': 'đang làm', // Legacy status
  };
  return statusMap[status] || status;
};

// Map stage type code to Vietnamese name
export const getStageTypeName = (stageType) => {
  const stageTypeMap = {
    'WARPING': 'Cuồng mắc',
    'CUONG_MAC': 'Cuồng mắc',
    'WEAVING': 'Dệt',
    'DET': 'Dệt',
    'DYEING': 'Nhuộm',
    'NHUOM': 'Nhuộm',
    'CUTTING': 'Cắt',
    'CAT': 'Cắt',
    'HEMMING': 'May',
    'MAY': 'May',
    'PACKAGING': 'Đóng gói',
    'DONG_GOI': 'Đóng gói',
  };
  return stageTypeMap[stageType] || stageType;
};

// Get button configuration based on stage status and user role
export const getButtonForStage = (status, userRole) => {
  if (userRole === 'leader') {
    // PENDING: đợi - không có button (chỉ xem được)
    if (status === 'PENDING') {
      return { text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary', disabled: false };
    }
    // WAITING/READY/READY_TO_PRODUCE: sẵn sàng sản xuất - button "Bắt đầu"
    if (status === 'WAITING' || status === 'READY' || status === 'READY_TO_PRODUCE') {
      return { text: 'Bắt đầu', action: 'start', variant: 'success', disabled: false };
    }
    // IN_PROGRESS: đang làm - button "Cập nhật tiến độ"
    if (status === 'IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update', variant: 'primary', disabled: false };
    }
    // WAITING_QC: chờ kiểm tra - button "Xem chi tiết"
    if (status === 'WAITING_QC') {
      return { text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary', disabled: false };
    }
    // QC_IN_PROGRESS: đang kiểm tra - button "Xem chi tiết"
    if (status === 'QC_IN_PROGRESS') {
      return { text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary', disabled: false };
    }
    // QC_PASSED: đạt - button "Xem chi tiết"
    if (status === 'QC_PASSED') {
      return { text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary', disabled: false };
    }
    // QC_FAILED: không đạt - button "Xem chi tiết"
    if (status === 'QC_FAILED') {
      return { text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary', disabled: false };
    }
    // WAITING_REWORK: chờ sửa - button "Bắt đầu" (sau khi kỹ thuật gửi yêu cầu làm lại)
    if (status === 'WAITING_REWORK') {
      return { text: 'Bắt đầu', action: 'start', variant: 'warning', disabled: false };
    }
    // REWORK_IN_PROGRESS: đang sửa - button "Cập nhật tiến độ"
    if (status === 'REWORK_IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update', variant: 'primary', disabled: false };
    }
    // COMPLETED: hoàn thành - button "Xem chi tiết"
    if (status === 'COMPLETED') {
      return { text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary', disabled: false };
    }
  }

  if (userRole === 'qa' || userRole === 'kcs') {
    // WAITING_QC: chờ kiểm tra - button "Kiểm tra"
    if (status === 'WAITING_QC') {
      return { text: 'Kiểm tra', action: 'inspect', variant: 'warning' };
    }
    // QC_IN_PROGRESS: đang kiểm tra - button "Kiểm tra" (có thể tiếp tục kiểm tra)
    if (status === 'QC_IN_PROGRESS') {
      return { text: 'Kiểm tra', action: 'inspect', variant: 'warning' };
    }
    // QC_PASSED: đạt - button "Chi tiết" (chi tiết chính là kết quả kiểm tra)
    if (status === 'QC_PASSED') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    // QC_FAILED: không đạt - button "Chi tiết" (chi tiết chính là kết quả kiểm tra)
    if (status === 'QC_FAILED') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    // Các trạng thái khác: button "Chi tiết"
    return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
  }

  if (userRole === 'production' || userRole === 'pm') {
    // For dyeing stage (NHUOM) managed by PM
    // PENDING: đợi - không có button (chỉ xem)
    if (status === 'PENDING') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    // WAITING/READY/READY_TO_PRODUCE: chờ làm - button "Bắt đầu" (với công đoạn nhuộm)
    if (status === 'WAITING' || status === 'READY' || status === 'READY_TO_PRODUCE') {
      return { text: 'Bắt đầu', action: 'start', variant: 'success' };
    }
    // IN_PROGRESS: đang làm - button "Chi tiết, cập nhật công đoạn" (với công đoạn nhuộm)
    if (status === 'IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update', variant: 'primary' };
    }
    // WAITING_QC: chờ kiểm tra - button "Chi tiết"
    if (status === 'WAITING_QC') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    // QC_IN_PROGRESS: đang kiểm tra - button "Chi tiết"
    if (status === 'QC_IN_PROGRESS') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    // QC_PASSED: đạt - button "Chi tiết"
    if (status === 'QC_PASSED') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    // QC_FAILED: không đạt - button "Chi tiết"
    if (status === 'QC_FAILED') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    // WAITING_REWORK: chờ sửa - button "Chi tiết, bắt đầu" (với công đoạn nhuộm)
    if (status === 'WAITING_REWORK') {
      return { text: 'Bắt đầu', action: 'start', variant: 'warning' };
    }
    // REWORK_IN_PROGRESS: đang sửa - button "Chi tiết"
    if (status === 'REWORK_IN_PROGRESS') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    // COMPLETED: hoàn thành - button "Chi tiết"
    if (status === 'COMPLETED') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
  }

  return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
};

// Get status badge variant for Bootstrap
export const getStatusVariant = (status) => {
  const variantMap = {
    // ProductionOrder statuses
    'PENDING_APPROVAL': 'secondary',
    'WAITING_PRODUCTION': 'secondary',
    'CHO_SAN_XUAT': 'secondary',
    'DANG_SAN_XUAT': 'info',
    'IN_PROGRESS': 'info',
    'ORDER_COMPLETED': 'success',
    'COMPLETED': 'success',
    'HOAN_THANH': 'success',

    // ProductionStage statuses
    'PENDING': 'secondary',
    'WAITING': 'secondary',
    'READY': 'primary',
    'READY_TO_PRODUCE': 'success',
    'IN_PROGRESS': 'primary',
    'WAITING_QC': 'warning',
    'QC_IN_PROGRESS': 'warning',
    'QC_PASSED': 'success',
    'QC_FAILED': 'danger',
    'WAITING_REWORK': 'warning',
    'REWORK_IN_PROGRESS': 'info',
    'COMPLETED': 'success',
    'DANG_LAM': 'info',
  };
  return variantMap[status] || 'secondary';
};


// --- DIRECTOR ROLE MAPPERS ---
export const getDirectorRfqStatus = (rfq) => {
  if (!rfq) return { label: 'Không xác định', variant: 'secondary', value: '' };

  if (rfq.status === 'SENT') {
    return rfq.assignedSales
      ? { label: 'Đã phân công', variant: 'primary', value: 'ASSIGNED' }
      : { label: 'Chờ phân công', variant: 'warning', value: 'WAITING_ASSIGNMENT' };
  }

  // Fallback to standard mapping
  const label = getStatusLabel(rfq.status);
  const variant = getStatusVariant(rfq.status);
  return { label, variant, value: rfq.status };
};

export const getDirectorContractStatus = (status) => {
  if (status === 'PENDING_APPROVAL') return { label: 'Chờ duyệt', variant: 'warning', value: 'PENDING_APPROVAL' };
  if (status === 'APPROVED') return { label: 'Đã duyệt', variant: 'success', value: 'APPROVED' };
  if (status === 'REJECTED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getDirectorPlanStatus = (status) => {
  if (status === 'PENDING_APPROVAL') return { label: 'Chờ duyệt', variant: 'warning', value: 'PENDING_APPROVAL' };
  if (status === 'APPROVED') return { label: 'Đã duyệt', variant: 'success', value: 'APPROVED' };
  if (status === 'REJECTED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

// --- PLANNING ROLE MAPPERS ---
export const getPlanningRfqStatus = (rfq) => {
  if (!rfq) return { label: 'N/A', variant: 'secondary' };

  if (rfq.status === 'FORWARDED_TO_PLANNING') return { label: 'Chờ tiếp nhận', variant: 'warning', value: 'FORWARDED_TO_PLANNING' };
  if (rfq.status === 'RECEIVED_BY_PLANNING') return { label: 'Chờ tạo', variant: 'primary', value: 'RECEIVED_BY_PLANNING' };
  if (rfq.status === 'QUOTED') return { label: 'Đã báo giá', variant: 'success', value: 'QUOTED' };

  const label = getStatusLabel(rfq.status);
  const variant = getStatusVariant(rfq.status);
  return { label, variant, value: rfq.status };
};

export const getPlanningPlanStatus = (status) => {
  if (status === 'READY_FOR_PLANNING') return { label: 'Chờ tạo', variant: 'info', value: 'READY_FOR_PLANNING' };
  if (status === 'DRAFT') return { label: 'Chờ gửi', variant: 'secondary', value: 'DRAFT' };
  if (status === 'PENDING_APPROVAL') return { label: 'Chờ duyệt', variant: 'warning', value: 'PENDING_APPROVAL' };
  if (status === 'APPROVED') return { label: 'Đã duyệt', variant: 'success', value: 'APPROVED' };
  if (status === 'REJECTED') return { label: 'Từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

// --- SALES ROLE MAPPERS ---
export const getSalesRfqStatus = (status) => {
  if (status === 'SENT') return { label: 'Chờ xác nhận', variant: 'info', value: 'SENT' };
  if (status === 'PRELIMINARY_CHECKED') return { label: 'Đã xác nhận', variant: 'primary', value: 'PRELIMINARY_CHECKED' };
  if (status === 'RECEIVED_BY_PLANNING') return { label: 'Đã xác nhận', variant: 'primary', value: 'RECEIVED_BY_PLANNING' };
  if (status === 'QUOTED') return { label: 'Đã báo giá', variant: 'success', value: 'QUOTED' };
  if (status === 'CANCELED') return { label: 'Đã hủy', variant: 'dark', value: 'CANCELED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getSalesQuoteStatus = (status) => {
  if (status === 'DRAFT') return { label: 'Chờ báo giá', variant: 'secondary', value: 'DRAFT' };
  if (status === 'SENT') return { label: 'Chờ phê duyệt', variant: 'info', value: 'SENT' };
  if (status === 'ACCEPTED') return { label: 'Đã duyệt', variant: 'success', value: 'ACCEPTED' };
  if (status === 'REJECTED') return { label: 'Từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getSalesOrderStatus = (status) => {
  if (status === 'PENDING_UPLOAD') return { label: 'Chờ ký HĐ', variant: 'warning', value: 'PENDING_UPLOAD' };
  if (status === 'PENDING_APPROVAL') return { label: 'Chờ phê duyệt HĐ', variant: 'primary', value: 'PENDING_APPROVAL' };
  if (status === 'APPROVED') return { label: 'HĐ được duyệt', variant: 'success', value: 'APPROVED' };
  if (status === 'REJECTED') return { label: 'HĐ bị từ chối', variant: 'danger', value: 'REJECTED' };
  if (['WAITING_PRODUCTION', 'IN_PROGRESS'].includes(status)) {
    return { label: 'Đang sản xuất', variant: 'info', value: 'IN_PRODUCTION' };
  }
  if (status === 'COMPLETED') return { label: 'Sản xuất xong', variant: 'success', value: 'COMPLETED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

// --- CUSTOMER ROLE MAPPERS ---
export const getCustomerRfqStatus = (status) => {
  if (status === 'SENT') return { label: 'Chờ xác nhận', variant: 'info', value: 'SENT' };
  if (status === 'PRELIMINARY_CHECKED') return { label: 'Đã xác nhận', variant: 'primary', value: 'PRELIMINARY_CHECKED' };
  if (status === 'QUOTED') return { label: 'Chờ phê duyệt báo giá', variant: 'warning', value: 'QUOTED' };
  if (status === 'CANCELED') return { label: 'Đã hủy', variant: 'dark', value: 'CANCELED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getCustomerQuoteStatus = (status) => {
  if (status === 'SENT') return { label: 'Chờ phê duyệt', variant: 'info', value: 'SENT' };
  if (status === 'ACCEPTED') return { label: 'Đã duyệt', variant: 'success', value: 'ACCEPTED' };
  if (status === 'REJECTED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getCustomerOrderStatus = (status) => {
  if (status === 'PENDING_UPLOAD') return { label: 'Chờ ký HĐ', variant: 'warning', value: 'PENDING_UPLOAD' };
  if (['PENDING_APPROVAL', 'APPROVED', 'WAITING_PRODUCTION'].includes(status)) {
    return { label: 'Chờ sản xuất', variant: 'primary', value: 'PENDING_PROCESS' };
  }
  if (status === 'IN_PROGRESS') return { label: 'Đang sản xuất', variant: 'info', value: 'IN_PROGRESS' };
  if (status === 'COMPLETED') return { label: 'Sản xuất xong', variant: 'success', value: 'COMPLETED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};
