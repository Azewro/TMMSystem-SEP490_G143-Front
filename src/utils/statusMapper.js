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

    // ProductionStage statuses - ALL CAPITALIZED
    'PENDING': 'Đang đợi',
    'WAITING': 'Sẵn sàng',
    'READY': 'Sẵn sàng',
    'READY_TO_PRODUCE': 'Sẵn sàng',
    // Note: IN_PROGRESS is mapped above as 'Đang sản xuất' for order level
    'WAITING_QC': 'Chờ kiểm tra',
    'QC_IN_PROGRESS': 'Đang kiểm tra',
    'QC_PASSED': 'Đạt',
    'QC_FAILED': 'Không đạt',
    'WAITING_REWORK': 'Chờ sửa lỗi',
    'REWORK_IN_PROGRESS': 'Đang xử lý',
    'PAUSED': 'Tạm dừng',
    'WAITING_MATERIAL': 'Chờ phê duyệt cấp sợi',

    // Supplementary/Rework order statuses
    'READY_SUPPLEMENTARY': 'Chờ sản xuất',
    'WAITING_SUPPLEMENTARY': 'Chờ sản xuất',
    'IN_SUPPLEMENTARY': 'Đang sản xuất',
    'SUPPLEMENTARY_CREATED': 'Đang sản xuất',
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

/**
 * Build dynamic status label for Production Order based on active stage
 * Format: "Prefix StageName" (e.g., "Đang Dệt", "Chờ kiểm tra Nhuộm")
 * @param {Object} order - ProductionOrderDto with stages array
 * @returns {{ label: string, variant: string }} Status label and Bootstrap variant
 */
export const getProductionOrderStatusFromStages = (order) => {
  // Handle special status: Chờ phê duyệt cấp sợi (only if still pending)
  if (order.pendingMaterialRequestId && order.executionStatus === 'WAITING_MATERIAL_APPROVAL') {
    return { label: 'Chờ phê duyệt cấp sợi', variant: 'warning' };
  }

  // Handle order-level execution status for non-supplementary statuses first
  if (order.executionStatus === 'WAITING_PRODUCTION') {
    return { label: 'Chờ sản xuất', variant: 'secondary' };
  }
  if (order.executionStatus === 'COMPLETED' || order.executionStatus === 'ORDER_COMPLETED') {
    return { label: 'Hoàn thành', variant: 'success' };
  }

  // Find active stage FIRST (not PENDING and not COMPLETED) - for both normal and supplementary orders
  const stages = order.stages || [];
  const activeStage = stages.find(s =>
    s.executionStatus &&
    s.executionStatus !== 'PENDING' &&
    s.executionStatus !== 'COMPLETED' &&
    s.executionStatus !== 'QC_PASSED'
  );

  // If there's an active stage, use its status (simplified labels per teammate's diagram)
  if (activeStage) {
    const status = (activeStage.status === 'PAUSED') ? 'PAUSED' : activeStage.executionStatus;
    const isFirstStage = activeStage.stageSequence === 1 || activeStage.stageSequence === '1';

    // NEW: Direct mapping based on executionStatus (no longer need isBlocked flag)
    // READY_TO_PRODUCE / READY = Leader can start this lot
    // But if any stage has been worked on, order is still "Đang làm" (not "Sẵn sàng")
    if (status === 'READY_TO_PRODUCE' || status === 'READY') {
      // Check if any stage has been worked on (progress > 0 or QC_PASSED)
      const hasStarted = stages.some(s =>
        (s.progressPercent && s.progressPercent > 0) || s.executionStatus === 'QC_PASSED'
      );
      if (hasStarted) {
        return { label: 'Đang làm', variant: 'info' };  // Production ongoing
      }
      // FIX: Check if blocked by another lot at the same stage type
      // Per PM diagram: "Sẵn sàng sản xuất" only if no other lot is active at first stage
      if (activeStage.isBlocked) {
        return { label: 'Chờ đến lượt', variant: 'secondary' };
      }
      return { label: 'Sẵn sàng sản xuất', variant: 'primary' };  // Ready to start first stage
    }
    if (status === 'WAITING') {
      // First stage WAITING = "Chờ đến lượt" (another lot is IN_PROGRESS)
      // Later stages WAITING (after previous stage passed QC) = "Đang làm"
      if (isFirstStage) {
        return { label: 'Chờ đến lượt', variant: 'secondary' };
      } else {
        return { label: 'Đang làm', variant: 'info' };
      }
    }

    // Simplified status labels for PM Order List - only 9 statuses per diagram
    const statusLabelMap = {
      'IN_PROGRESS': { label: 'Đang làm', variant: 'info' },
      'WAITING_QC': { label: 'Đang làm', variant: 'info' },  // Grouped into "Đang làm"
      'QC_IN_PROGRESS': { label: 'Đang làm', variant: 'info' },  // Grouped into "Đang làm"
      'WAITING_REWORK': { label: 'Đang làm', variant: 'info' },  // Still in production
      'REWORK_IN_PROGRESS': { label: 'Đang làm', variant: 'info' },  // Still in production
      'PAUSED': { label: 'Tạm dừng', variant: 'danger' },
    };

    const mapping = statusLabelMap[status];
    if (mapping) {
      return mapping;
    }
  }

  // NOW handle supplementary/rework order statuses (fallback when no active stage found)
  if (order.executionStatus === 'READY_SUPPLEMENTARY') {
    return { label: 'Chờ sản xuất', variant: 'secondary' };
  }
  if (order.executionStatus === 'WAITING_SUPPLEMENTARY') {
    return { label: 'Chờ sản xuất', variant: 'secondary' };
  }
  if (order.executionStatus === 'IN_SUPPLEMENTARY') {
    return { label: 'Đang sản xuất', variant: 'info' };
  }
  if (order.executionStatus === 'SUPPLEMENTARY_CREATED') {
    return { label: 'Đang sản xuất', variant: 'info' };
  }

  // Fallback: use first pending stage
  const firstPendingStage = stages.find(s => s.executionStatus === 'WAITING' || s.executionStatus === 'READY' || s.executionStatus === 'READY_TO_PRODUCE');
  if (firstPendingStage) {
    // Direct mapping based on executionStatus (no longer need isBlocked)
    if (firstPendingStage.executionStatus === 'WAITING') {
      return { label: 'Chờ đến lượt', variant: 'secondary' };
    }
    return { label: 'Sẵn sàng sản xuất', variant: 'primary' };
  }

  // Final fallback - handle IN_PROGRESS order without recognizable active stage
  if (order.executionStatus === 'IN_PROGRESS' || order.executionStatus === 'DANG_SAN_XUAT') {
    return { label: 'Đang làm', variant: 'info' };
  }

  // Ultimate fallback
  return { label: getStatusLabel(order.executionStatus || order.status), variant: getStatusVariant(order.executionStatus || order.status) };
};


/**
 * Build dynamic status label for Leader Order List with stage name
 * Format: "Status [StageName]" (e.g., "Đang làm Cuồng mắc", "Chờ kiểm tra Dệt")
 * 
 * Status labels per Leader diagram:
 * 1. Sẵn sàng sản xuất [xxx]
 * 2. Chờ đến lượt [xxx]
 * 3. Đang làm [xxx]
 * 4. Chờ kiểm tra [xxx]
 * 5. Đang kiểm tra [xxx]
 * 6. [xxx] lỗi nhẹ
 * 7. [xxx] lỗi nặng
 * 8. Tạm dừng
 * 9. Hoàn thành
 * 
 * @param {Object} order - ProductionOrderDto with stages array
 * @returns {{ label: string, variant: string }} Status label with stage name and Bootstrap variant
 */
export const getLeaderOrderStatusFromStages = (order) => {
  // Handle order-level execution status first
  if (order.executionStatus === 'WAITING_PRODUCTION') {
    return { label: 'Chờ sản xuất', variant: 'secondary' };
  }
  if (order.executionStatus === 'COMPLETED' || order.executionStatus === 'ORDER_COMPLETED') {
    return { label: 'Hoàn thành', variant: 'success' };
  }

  // Find active stage
  const stages = order.stages || [];
  const activeStage = stages.find(s =>
    s.executionStatus &&
    s.executionStatus !== 'PENDING' &&
    s.executionStatus !== 'COMPLETED' &&
    s.executionStatus !== 'QC_PASSED'
  );

  if (activeStage) {
    const status = (activeStage.status === 'PAUSED') ? 'PAUSED' : activeStage.executionStatus;
    const stageName = getStageTypeName(activeStage.stageType) || activeStage.stageType;

    // Status with stage name for Leader list
    // DYEING/NHUOM stages are outsourced/parallel - never show as "Chờ đến lượt"
    const isDyeingStage = ['DYEING', 'NHUOM'].includes(activeStage.stageType?.toUpperCase());

    // Handle WAITING status separately with DYEING exception
    if (status === 'WAITING') {
      if (isDyeingStage) {
        // DYEING is parallel/outsourced - always show "Sẵn sàng sản xuất"
        return { label: `Sẵn sàng sản xuất ${stageName}`, variant: 'primary' };
      }
      // Other stages: WAITING means blocked by another lot
      return { label: `Chờ đến lượt ${stageName}`, variant: 'secondary' };
    }

    const statusConfig = {
      'READY': { prefix: 'Sẵn sàng sản xuất', variant: 'primary' },
      'READY_TO_PRODUCE': { prefix: 'Sẵn sàng sản xuất', variant: 'primary' },
      'IN_PROGRESS': { prefix: 'Đang làm', variant: 'info' },
      'WAITING_QC': { prefix: 'Chờ kiểm tra', variant: 'warning' },
      'QC_IN_PROGRESS': { prefix: 'Đang kiểm tra', variant: 'warning' },
      // WAITING_REWORK and REWORK_IN_PROGRESS: show defect label per diagram
      'WAITING_REWORK': { useDefectLabel: true, variant: 'danger' },
      'REWORK_IN_PROGRESS': { useDefectLabel: true, variant: 'danger' },
      'QC_FAILED': { useDefectLabel: true, variant: 'danger' },
      'PAUSED': { label: 'Tạm dừng', variant: 'danger' },
    };

    const config = statusConfig[status];
    if (config) {
      // Handle PAUSED - no stage name
      if (config.label) {
        return { label: config.label, variant: config.variant };
      }
      // Handle prefix format: "Status StageName"
      // READY_TO_PRODUCE → "Sẵn sàng sản xuất xxx" OR "Chờ đến lượt xxx" if blocked
      // WAITING → "Chờ đến lượt xxx" (when Leader tried to start but blocked)
      // EXCEPTION: DYEING/NHUOM is a parallel stage - never show as "Chờ đến lượt"
      if (config.prefix) {
        // Check isBlocked for READY_TO_PRODUCE - if blocked by another lot (including QC), show "Chờ đến lượt"
        // EXCEPTION: DYEING/NHUOM stages are outsourced/parallel - never blocked
        if ((status === 'READY_TO_PRODUCE' || status === 'READY') && activeStage.isBlocked && !isDyeingStage) {
          return { label: `Chờ đến lượt ${stageName}`, variant: 'secondary' };
        }
        return { label: `${config.prefix} ${stageName}`, variant: config.variant };
      }
      // Handle defect label format: "StageName lỗi nhẹ/nặng" - for QC_FAILED, WAITING_REWORK, REWORK_IN_PROGRESS
      if (config.useDefectLabel) {
        // Check defectSeverity to show 'lỗi nhẹ' or 'lỗi nặng'
        const severity = activeStage.defectSeverity || activeStage.defectLevel;
        let defectLabel = 'lỗi';
        if (severity === 'MINOR') {
          defectLabel = 'lỗi nhẹ';
        } else if (severity === 'MAJOR') {
          defectLabel = 'lỗi nặng';
        }
        return { label: `${stageName} ${defectLabel}`, variant: config.variant };
      }
    }
  }

  // Handle supplementary order statuses
  if (order.executionStatus === 'READY_SUPPLEMENTARY' || order.executionStatus === 'WAITING_SUPPLEMENTARY') {
    return { label: 'Chờ sản xuất', variant: 'secondary' };
  }
  if (order.executionStatus === 'IN_SUPPLEMENTARY' || order.executionStatus === 'SUPPLEMENTARY_CREATED') {
    return { label: 'Đang sản xuất', variant: 'info' };
  }

  // Fallback: find first pending stage
  const firstPendingStage = stages.find(s =>
    s.executionStatus === 'WAITING' || s.executionStatus === 'READY' || s.executionStatus === 'READY_TO_PRODUCE'
  );
  if (firstPendingStage) {
    const stageName = getStageTypeName(firstPendingStage.stageType) || firstPendingStage.stageType;
    // WAITING → "Chờ đến lượt" (blocked), EXCEPTION: DYEING is parallel
    // READY_TO_PRODUCE → "Sẵn sàng sản xuất"
    const isPendingDyeing = ['DYEING', 'NHUOM'].includes(firstPendingStage.stageType?.toUpperCase());
    if (firstPendingStage.executionStatus === 'WAITING' && !isPendingDyeing) {
      return { label: `Chờ đến lượt ${stageName}`, variant: 'secondary' };
    }
    return { label: `Sẵn sàng sản xuất ${stageName}`, variant: 'primary' };
  }

  // Final fallback
  return { label: getStatusLabel(order.executionStatus || order.status), variant: getStatusVariant(order.executionStatus || order.status) };
};


/**
 * Build dynamic status label for QA (KCS) Order List with stage name
 * 
 * Status labels per QA diagram:
 * 1. Chuẩn bị làm - PM started but Leader hasn't
 * 2. Đang làm - Leader in progress
 * 3. Chờ kiểm tra [xxx] - Leader completed 100%
 * 4. Đang kiểm tra [xxx] - KCS started inspection
 * 5. [xxx] lỗi nhẹ - QC failed with MINOR severity
 * 6. [xxx] lỗi nặng - QC failed with MAJOR severity
 * 7. Tạm dừng - Paused for another order's rework
 * 8. Hoàn thành - All stages completed
 * 
 * @param {Object} order - ProductionOrderDto with stages array
 * @returns {{ label: string, variant: string }} Status label with stage name and Bootstrap variant
 */
export const getQaOrderStatusFromStages = (order) => {
  // Handle order-level completed status first
  if (order.executionStatus === 'COMPLETED' || order.executionStatus === 'ORDER_COMPLETED') {
    return { label: 'Hoàn thành', variant: 'success' };
  }

  // Find active stage
  const stages = order.stages || [];
  const activeStage = stages.find(s =>
    s.executionStatus &&
    s.executionStatus !== 'PENDING' &&
    s.executionStatus !== 'COMPLETED' &&
    s.executionStatus !== 'QC_PASSED'
  );

  if (activeStage) {
    const status = (activeStage.status === 'PAUSED') ? 'PAUSED' : activeStage.executionStatus;
    const stageName = getStageTypeName(activeStage.stageType) || activeStage.stageType;

    // Status config per QA diagram
    switch (status) {
      // PM started but Leader hasn't started first stage - "Chuẩn bị làm"
      // After QC pass on non-final stage, next stage is WAITING but should show "Đang làm"
      case 'WAITING':
      case 'READY':
      case 'READY_TO_PRODUCE': {
        // Only show "Chuẩn bị làm" if this is the FIRST stage (stageSequence=1)
        // After QC pass on previous stage, the next stage becomes WAITING but order should show "Đang làm"
        const isFirstStage = activeStage.stageSequence === 1 || activeStage.stageSequence === '1';
        if (isFirstStage) {
          return { label: 'Chuẩn bị làm', variant: 'secondary' };
        }
        // Non-first stage in WAITING means previous stage passed QC → "Đang làm"
        return { label: 'Đang làm', variant: 'info' };
      }

      // Leader in progress - "Đang làm"
      case 'IN_PROGRESS':
      case 'REWORK_IN_PROGRESS':
        return { label: 'Đang làm', variant: 'info' };

      // Leader completed 100% - "Chờ kiểm tra xxx"
      case 'WAITING_QC':
        return { label: `Chờ kiểm tra ${stageName}`, variant: 'warning' };

      // KCS started inspection - "Đang kiểm tra xxx"
      case 'QC_IN_PROGRESS':
        return { label: `Đang kiểm tra ${stageName}`, variant: 'warning' };

      // QC failed - "xxx lỗi nhẹ" or "xxx lỗi nặng"
      case 'QC_FAILED':
      case 'WAITING_REWORK': {
        const severity = activeStage.defectSeverity;
        let defectLabel = 'lỗi';
        let variant = 'danger';
        if (severity === 'MINOR') {
          defectLabel = 'lỗi nhẹ';
          variant = 'warning';
        } else if (severity === 'MAJOR') {
          defectLabel = 'lỗi nặng';
          variant = 'danger';
        }
        return { label: `${stageName} ${defectLabel}`, variant };
      }

      // Paused - "Tạm dừng"
      case 'PAUSED':
        return { label: 'Tạm dừng', variant: 'danger' };

      default:
        break;
    }
  }

  // Handle supplementary order statuses
  if (order.executionStatus === 'READY_SUPPLEMENTARY' || order.executionStatus === 'WAITING_SUPPLEMENTARY') {
    return { label: 'Chờ sản xuất', variant: 'secondary' };
  }
  if (order.executionStatus === 'IN_SUPPLEMENTARY' || order.executionStatus === 'SUPPLEMENTARY_CREATED') {
    return { label: 'Đang sản xuất', variant: 'info' };
  }

  // Fallback: PM started but Leader hasn't (first stage is WAITING)
  const firstWaitingStage = stages.find(s =>
    s.executionStatus === 'WAITING' || s.executionStatus === 'READY' || s.executionStatus === 'READY_TO_PRODUCE'
  );
  if (firstWaitingStage) {
    return { label: 'Chuẩn bị làm', variant: 'secondary' };
  }

  // Final fallback
  return { label: getStatusLabel(order.executionStatus || order.status), variant: getStatusVariant(order.executionStatus || order.status) };
};


/**
 * Get stage status label and buttons for Production Manager view
 * Maps backend executionStatus to Vietnamese labels and determines button configuration
 * 
 * BUSINESS LOGIC:
 * - Đang đợi (PENDING): Công đoạn trước chưa hoàn thành → Không có button
 * - Chờ làm (WAITING/READY): PM bấm bắt đầu lệnh || công đoạn trước đạt → Button: Bắt đầu (Nhuộm)
 * - Đang làm (IN_PROGRESS): Leader bấm bắt đầu → Chi tiết, Cập nhật công đoạn (Nhuộm)
 * - Chờ kiểm tra (WAITING_QC): Progress = 100% → Chi tiết
 * - Đang kiểm tra (QC_IN_PROGRESS): KCS bấm kiểm tra → Chi tiết
 * - Đạt (QC_PASSED): Kết quả kiểm tra đạt → Chi tiết
 * - Không đạt (QC_FAILED): Kết quả kiểm tra không đạt → Chi tiết
 * - Chờ sửa (WAITING_REWORK): Kỹ thuật gửi yêu cầu làm lại → Chi tiết, Tạm dừng và Sửa lỗi (Nhuộm)
 * - Đang sửa (REWORK_IN_PROGRESS): Leader bấm tạm dừng và sửa lỗi → Chi tiết
 * - Tạm dừng (PAUSED): Đơn hàng khác đang sửa lỗi → Chi tiết
 * 
 * @param {string} status - Backend executionStatus
 * @param {boolean} isDyeingStage - True if this is DYEING/NHUOM stage (managed by PM)
 * @returns {{ label: string, variant: string, buttons: Array<{text: string, action: string, variant: string, disabled?: boolean}> }}
 */
export const getPMStageStatusLabel = (status, isDyeingStage = false) => {
  const statusMap = {
    // Đang đợi - công đoạn trước chưa hoàn thành
    'PENDING': {
      label: 'Đang đợi',
      variant: 'secondary',
      buttons: [] // Không có button
    },
    // Sẵn sàng - PM bấm bắt đầu lệnh || công đoạn trước đạt
    // Changed to show 'Đang đợi' same as PENDING per user request
    'WAITING': {
      label: 'Đang đợi',
      variant: 'secondary',
      buttons: isDyeingStage
        ? [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' },
        { text: 'Bắt đầu', action: 'start', variant: 'dark' }]
        : [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    'READY': {
      label: 'Đang đợi',
      variant: 'secondary',
      buttons: isDyeingStage
        ? [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' },
        { text: 'Bắt đầu', action: 'start', variant: 'dark' }]
        : [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    'READY_TO_PRODUCE': {
      label: 'Đang đợi',
      variant: 'secondary',
      buttons: isDyeingStage
        ? [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' },
        { text: 'Bắt đầu', action: 'start', variant: 'dark' }]
        : [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Đang làm - leader bấm bắt đầu
    'IN_PROGRESS': {
      label: 'Đang làm',
      variant: 'info',
      buttons: isDyeingStage
        ? [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' },
        { text: 'Cập nhật tiến độ', action: 'update', variant: 'dark' }]
        : [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Chờ kiểm tra - progress = 100%
    'WAITING_QC': {
      label: 'Chờ kiểm tra',
      variant: 'warning',
      buttons: [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Đang kiểm tra - KCS bấm kiểm tra
    'QC_IN_PROGRESS': {
      label: 'Đang kiểm tra',
      variant: 'warning',
      buttons: [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Đạt - kết quả kiểm tra đạt
    'QC_PASSED': {
      label: 'Đạt',
      variant: 'success',
      buttons: [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Không đạt - kết quả kiểm tra không đạt
    'QC_FAILED': {
      label: 'Không đạt',
      variant: 'danger',
      buttons: [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Chờ sửa - kỹ thuật gửi yêu cầu làm lại || PM phê duyệt yêu cầu cấp sợi
    'WAITING_REWORK': {
      label: 'Chờ sửa',
      variant: 'warning',
      buttons: isDyeingStage
        ? [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' },
        { text: 'Tạm dừng và Sửa lỗi', action: 'rework', variant: 'dark' }]
        : [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Đang sửa - leader bấm "tạm dừng và sửa lỗi"
    'REWORK_IN_PROGRESS': {
      label: 'Đang xử lý',
      variant: 'info',
      buttons: [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Tạm dừng - đơn hàng khác đang sửa lỗi
    'PAUSED': {
      label: 'Tạm dừng',
      variant: 'danger',
      buttons: [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Hoàn thành
    'COMPLETED': {
      label: 'Hoàn thành',
      variant: 'success',
      buttons: [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
    }
  };

  const result = statusMap[status];
  if (result) {
    return result;
  }

  // Fallback
  return {
    label: getStatusLabel(status) || status,
    variant: getStatusVariant(status) || 'secondary',
    buttons: [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
  };
};


/**
 * Get QA stage status label and variant
 * For QA/KCS pages to display stage status
 * 
 * @param {string} status - Backend executionStatus
 * @returns {{ label: string, variant: string }}
 */
export const getQaStageStatusLabel = (status) => {
  const statusMap = {
    'PENDING': { label: 'Đang đợi', variant: 'secondary' },
    'WAITING': { label: 'Đang đợi', variant: 'secondary' },  // Per KCS diagram: before Leader starts
    'READY': { label: 'Đang đợi', variant: 'secondary' },
    'READY_TO_PRODUCE': { label: 'Đang đợi', variant: 'secondary' },
    'IN_PROGRESS': { label: 'Đang làm', variant: 'info' },
    'REWORK_IN_PROGRESS': { label: 'Đang xử lý', variant: 'info' },
    'WAITING_QC': { label: 'Chờ kiểm tra', variant: 'warning' },
    'QC_IN_PROGRESS': { label: 'Đang kiểm tra', variant: 'warning' },
    'QC_PASSED': { label: 'Đạt', variant: 'success' },
    'QC_FAILED': { label: 'Không đạt', variant: 'danger' },
    'WAITING_REWORK': { label: 'Chờ sửa lỗi', variant: 'warning' },
    'PAUSED': { label: 'Tạm dừng', variant: 'danger' },
    'COMPLETED': { label: 'Hoàn thành', variant: 'success' }
  };

  return statusMap[status] || { label: status || 'N/A', variant: 'secondary' };
};


/**
 * Get stage status label and buttons for Leader Order List view
 * Maps backend executionStatus to Vietnamese labels and determines button configuration
 * 
 * BUSINESS LOGIC (from requirements):
 * - Đợi (PENDING): Đơn hàng phía trước chưa xong công đoạn → Không có button
 * - Sẵn sàng sản xuất (WAITING/READY): Công đoạn trước 100% và đạt → Bắt đầu (auto navigate to progress page)
 * - Đang làm (IN_PROGRESS): Leader bấm bắt đầu → Cập nhật tiến độ
 * - Chờ kiểm tra (WAITING_QC): Progress = 100% → Xem chi tiết
 * - Đang kiểm tra (QC_IN_PROGRESS): KCS bấm kiểm tra → Xem chi tiết
 * - Đạt (QC_PASSED): Kết quả kiểm tra đạt → Xem chi tiết
 * - Không đạt (QC_FAILED): Kết quả kiểm tra không đạt → Xem chi tiết
 * - Chờ sửa (WAITING_REWORK): Kỹ thuật gửi yêu cầu làm lại → Tạm dừng và Sửa lỗi
 * - Đang sửa (REWORK_IN_PROGRESS): Leader bấm tạm dừng và sửa lỗi → Cập nhật tiến độ
 * - Tạm dừng (PAUSED): Đơn hàng khác đang sửa lỗi → Không có button
 * 
 * @param {string} status - Backend executionStatus
 * @returns {{ label: string, variant: string, buttons: Array<{text: string, action: string, variant: string, disabled?: boolean}> }}
 */
export const getLeaderStageStatusLabel = (status, defectSeverity = null) => {
  const statusMap = {
    // Đang đợi - đơn hàng phía trước chưa xong công đoạn
    'PENDING': {
      label: 'Đang đợi',
      variant: 'secondary',
      buttons: [] // Không có button
    },
    // Chờ làm - PM bấm bắt đầu, Leader chưa bấm (per diagram: "chờ làm")
    'WAITING': {
      label: 'Chờ làm',
      variant: 'primary',
      buttons: [{ text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    'READY': {
      label: 'Chờ làm',
      variant: 'primary',
      buttons: [{ text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    'READY_TO_PRODUCE': {
      label: 'Chờ làm',
      variant: 'primary',
      buttons: [{ text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Đang làm - leader bấm bắt đầu
    'IN_PROGRESS': {
      label: 'Đang làm',
      variant: 'info',
      buttons: [{ text: 'Cập nhật tiến độ', action: 'update', variant: 'primary' }]
    },
    // Chờ kiểm tra - progress = 100%
    'WAITING_QC': {
      label: 'Chờ kiểm tra',
      variant: 'warning',
      buttons: [{ text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Đang kiểm tra - KCS bắ bấm kiểm tra
    'QC_IN_PROGRESS': {
      label: 'Đang kiểm tra',
      variant: 'warning',
      buttons: [{ text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Đạt - kết quả kiểm tra đạt
    'QC_PASSED': {
      label: 'Đạt',
      variant: 'success',
      buttons: [{ text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Không đạt - kết quả kiểm tra không đạt (will be overridden by severity below)
    'QC_FAILED': {
      label: 'Không đạt',
      variant: 'danger',
      buttons: [{ text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Chờ sửa - kỹ thuật gửi yêu cầu làm lại
    'WAITING_REWORK': {
      label: 'Chờ sửa lỗi',
      variant: 'warning',
      buttons: [{ text: 'Tạm dừng và Sửa lỗi', action: 'rework', variant: 'warning' }]
    },
    // Đang sửa - leader bấm tạm dừng và sửa lỗi
    'REWORK_IN_PROGRESS': {
      label: 'Đang xử lý',
      variant: 'info',
      buttons: [{ text: 'Cập nhật tiến độ', action: 'update', variant: 'primary' }]
    },
    // Tạm dừng - đơn hàng khác đang sửa lỗi
    'PAUSED': {
      label: 'Tạm dừng',
      variant: 'danger',
      buttons: [] // Không có button
    },
    // Hoàn thành
    'COMPLETED': {
      label: 'Hoàn thành',
      variant: 'success',
      buttons: [{ text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary' }]
    },
    // Sản xuất bổ sung - chờ
    'READY_SUPPLEMENTARY': {
      label: 'Chờ sản xuất',
      variant: 'secondary',
      buttons: [{ text: 'Bắt đầu SX bổ sung', action: 'start', variant: 'warning' }]
    },
    // Sản xuất bổ sung - chờ
    'WAITING_SUPPLEMENTARY': {
      label: 'Chờ sản xuất',
      variant: 'secondary',
      buttons: [] // Đang chờ máy/công đoạn rảnh
    },
    // Sản xuất bổ sung - đang làm
    'IN_SUPPLEMENTARY': {
      label: 'Đang sản xuất',
      variant: 'info',
      buttons: [{ text: 'Cập nhật tiến độ', action: 'update', variant: 'primary' }]
    },
    'SUPPLEMENTARY_CREATED': {
      label: 'Đang sản xuất',
      variant: 'info',
      buttons: [{ text: 'Cập nhật tiến độ', action: 'update', variant: 'primary' }]
    }
  };

  const result = statusMap[status];

  // Special handling for defect-related statuses - check defectSeverity to show 'Lỗi nhẹ' or 'Lỗi nặng'
  // Per diagram: defect label persists through QC_FAILED, WAITING_REWORK, REWORK_IN_PROGRESS
  if ((status === 'WAITING_REWORK' || status === 'REWORK_IN_PROGRESS') && defectSeverity) {
    if (defectSeverity === 'MINOR') {
      return {
        label: 'Lỗi nhẹ',
        variant: 'warning',
        buttons: status === 'REWORK_IN_PROGRESS'
          ? [{ text: 'Cập nhật tiến độ', action: 'update', variant: 'primary' }]
          : status === 'WAITING_REWORK'
            ? [{ text: 'Tạm dừng và Sửa lỗi', action: 'rework', variant: 'warning' }]
            : [{ text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary' }]
      };
    } else if (defectSeverity === 'MAJOR') {
      return {
        label: 'Lỗi nặng',
        variant: 'danger',
        buttons: status === 'REWORK_IN_PROGRESS'
          ? [{ text: 'Cập nhật tiến độ', action: 'update', variant: 'primary' }]
          : status === 'WAITING_REWORK'
            ? [{ text: 'Tạm dừng và Sửa lỗi', action: 'rework', variant: 'warning' }]
            : [{ text: 'Xem chi tiết', action: 'detail', variant: 'outline-secondary' }]
      };
    }
  }

  if (result) {
    return result;
  }

  // Fallback
  return {
    label: getStatusLabel(status) || status,
    variant: getStatusVariant(status) || 'secondary',
    buttons: [{ text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' }]
  };
};

// Get button configuration based on stage status and user role
export const getButtonForStage = (status, userRole) => {
  if (userRole === 'leader') {
    // PENDING: đợi - không có button
    if (status === 'PENDING') {
      return { text: 'Chờ', action: 'none', variant: 'secondary', disabled: true };
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
    // WAITING_REWORK: chờ sửa - button "Bắt đầu"
    if (status === 'WAITING_REWORK') {
      return { text: 'Bắt đầu', action: 'start', variant: 'warning', disabled: false };
    }
    // REWORK_IN_PROGRESS: đang sửa - button "Cập nhật tiến độ"
    if (status === 'REWORK_IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update', variant: 'primary', disabled: false };
    }
    // PAUSED: tạm dừng - không có button (theo yêu cầu Leader > Danh sách đơn hàng)
    if (status === 'PAUSED') {
      return { text: 'Tạm dừng', action: 'none', variant: 'secondary', disabled: true };
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
    // QC_IN_PROGRESS: đang kiểm tra - button "Kiểm tra"
    if (status === 'QC_IN_PROGRESS') {
      return { text: 'Kiểm tra', action: 'inspect', variant: 'warning' };
    }
    // QC_PASSED: đạt - button "Chi tiết"
    if (status === 'QC_PASSED') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    // QC_FAILED: không đạt - button "Chi tiết"
    if (status === 'QC_FAILED') {
      return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
    }
    return { text: 'Chi tiết', action: 'detail', variant: 'outline-secondary' };
  }

  if (userRole === 'production' || userRole === 'pm') {
    // For dyeing stage (NHUOM) managed by PM
    if (status === 'PENDING') {
      return { text: '', action: 'none', variant: 'secondary', disabled: true };
    }
    if (status === 'WAITING' || status === 'READY' || status === 'READY_TO_PRODUCE') {
      return { text: 'Bắt đầu', action: 'start', variant: 'success' };
    }
    if (status === 'IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update', variant: 'primary' };
    }
    if (status === 'WAITING_REWORK') {
      return { text: 'Bắt đầu', action: 'start', variant: 'warning' };
    }
    if (status === 'REWORK_IN_PROGRESS') {
      return { text: 'Cập nhật tiến độ', action: 'update', variant: 'primary' };
    }
    // Default fallback
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
    'PAUSED': 'danger',
    'WAITING_MATERIAL': 'warning',
  };
  return variantMap[status] || 'secondary';
};


// --- DIRECTOR ROLE MAPPERS ---
// --- DIRECTOR ROLE MAPPERS ---
export const getDirectorRfqStatus = (rfq) => {
  if (!rfq) return { label: 'Không xác định', variant: 'secondary', value: '' };

  // Logic:
  // - Nếu chưa có assignedSales -> Chờ phân công
  // - Nếu đã có assignedSales -> Đã phân công

  if (!rfq.assignedSales && !rfq.assignedSalesId) {
    return { label: 'Chờ phân công', variant: 'warning', value: 'WAITING_ASSIGNMENT' };
  } else {
    return { label: 'Đã phân công', variant: 'primary', value: 'ASSIGNED' };
  }
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
  if (status === 'DRAFT') return { label: 'Nháp', variant: 'secondary', value: 'DRAFT' };
  if (status === 'SUPERSEDED') return { label: 'Đã thay thế', variant: 'dark', value: 'SUPERSEDED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

// --- PLANNING ROLE MAPPERS ---
export const getPlanningRfqStatus = (rfq) => {
  if (!rfq) return { label: 'N/A', variant: 'secondary' };
  const status = rfq.status;

  if (status === 'DRAFT' || status === 'SENT' || status === 'PRELIMINARY_CHECKED' || status === 'FORWARDED_TO_PLANNING' || status === 'RECEIVED_BY_PLANNING') return { label: 'Chờ tạo', variant: 'warning', value: 'WAITING_CREATE' };
  if (status === 'QUOTED') return { label: 'Đã báo giá', variant: 'success', value: 'QUOTED' };
  // Gộp REJECTED và CANCELED thành "Đã từ chối"
  if (status === 'REJECTED' || status === 'CANCELED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };
  if (status === 'ACCEPTED' || status === 'ORDER_CREATED') return { label: 'Đã xác nhận', variant: 'success', value: 'CONFIRMED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getPlanningPlanStatus = (status) => {
  if (status === 'READY_FOR_PLANNING') return { label: 'Chờ tạo', variant: 'warning', value: 'READY_FOR_PLANNING' };
  if (status === 'DRAFT') return { label: 'Chờ gửi', variant: 'secondary', value: 'DRAFT' };
  if (status === 'PENDING_APPROVAL') return { label: 'Chờ duyệt', variant: 'info', value: 'PENDING_APPROVAL' };
  if (status === 'APPROVED') return { label: 'Đã duyệt', variant: 'success', value: 'APPROVED' };
  if (status === 'REJECTED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getProductionLotStatus = (status) => {
  if (status === 'FORMING') return { label: 'Đang gom đơn', variant: 'secondary', value: 'FORMING' };
  if (status === 'READY_FOR_PLANNING') return { label: 'Chờ tạo', variant: 'warning', value: 'READY_FOR_PLANNING' };
  if (status === 'PLANNING') return { label: 'Đang lập kế hoạch', variant: 'primary', value: 'PLANNING' };
  if (status === 'PLAN_APPROVED') return { label: 'Đã có kế hoạch', variant: 'success', value: 'PLAN_APPROVED' };
  if (status === 'IN_PRODUCTION') return { label: 'Đang sản xuất', variant: 'warning', value: 'IN_PRODUCTION' };
  if (status === 'COMPLETED') return { label: 'Hoàn thành', variant: 'success', value: 'COMPLETED' };
  if (status === 'CANCELED') return { label: 'Đã huỷ', variant: 'danger', value: 'CANCELED' };

  return { label: status || '—', variant: 'secondary', value: status };
};


// --- SALES ROLE MAPPERS ---
export const getSalesRfqStatus = (status) => {
  if (status === 'DRAFT' || status === 'SENT') return { label: 'Chờ xác nhận', variant: 'info', value: 'WAITING_CONFIRMATION' };
  if (status === 'PRELIMINARY_CHECKED' || status === 'FORWARDED_TO_PLANNING' || status === 'RECEIVED_BY_PLANNING') return { label: 'Đã xác nhận', variant: 'primary', value: 'CONFIRMED' };
  if (status === 'QUOTED') return { label: 'Đã báo giá', variant: 'success', value: 'QUOTED' };
  if (status === 'REJECTED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };
  if (status === 'CANCELED') return { label: 'Đã hủy', variant: 'dark', value: 'CANCELED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getSalesQuoteStatus = (status, quote) => {
  if (status === 'DRAFT') {
    // Check if created by Planning (checking role object or direct roleName)
    const creatorRole = quote?.creator?.role?.name || quote?.creator?.roleName || '';
    const roleName = creatorRole.toUpperCase();
    const isPlanning = roleName.includes('PLANNING') || roleName === 'PLANNER';
    if (isPlanning) {
      return { label: 'Đã nhận', variant: 'warning', value: 'RECEIVED' };
    }
    return { label: 'Chờ báo giá', variant: 'secondary', value: 'WAITING_QUOTE' };
  }
  if (status === 'SENT') return { label: 'Chờ phê duyệt', variant: 'info', value: 'SENT' };
  if (status === 'ACCEPTED' || status === 'ORDER_CREATED') return { label: 'Đã duyệt', variant: 'success', value: 'ACCEPTED' };
  if (status === 'REJECTED') return { label: 'Từ chối', variant: 'danger', value: 'REJECTED' };
  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getSalesOrderStatus = (status) => {
  if (status === 'DRAFT' || status === 'PENDING_UPLOAD') return { label: 'Chờ ký hợp đồng', variant: 'secondary', value: 'WAITING_SIGNATURE' };
  if (status === 'PENDING_APPROVAL') return { label: 'Chờ phê duyệt hợp đồng đã ký', variant: 'warning', value: 'PENDING_APPROVAL' };
  if (status === 'REJECTED') return { label: 'Hợp đồng đã ký bị từ chối', variant: 'danger', value: 'REJECTED' };
  if (status === 'APPROVED') return { label: 'Hợp đồng đã ký được phê duyệt', variant: 'success', value: 'APPROVED' };
  if (status === 'WAITING_PRODUCTION' || status === 'IN_PROGRESS') return { label: 'Đang sản xuất', variant: 'info', value: 'IN_PRODUCTION' };
  if (status === 'COMPLETED') return { label: 'Sản xuất xong', variant: 'success', value: 'COMPLETED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};


// --- CUSTOMER ROLE MAPPERS ---
export const getCustomerRfqStatus = (status) => {
  if (status === 'DRAFT') return { label: 'Chờ xác nhận', variant: 'secondary', value: 'DRAFT' };
  if (status === 'SENT') return { label: 'Chờ xác nhận', variant: 'info', value: 'SENT' };

  // Các trạng thái đang xử lý nội bộ -> Khách hàng thấy là "Đã xác nhận"
  if (status === 'PRELIMINARY_CHECKED') return { label: 'Đã xác nhận', variant: 'primary', value: 'PRELIMINARY_CHECKED' };
  if (status === 'FORWARDED_TO_PLANNING') return { label: 'Đã xác nhận', variant: 'primary', value: 'FORWARDED_TO_PLANNING' };
  if (status === 'RECEIVED_BY_PLANNING') return { label: 'Đã xác nhận', variant: 'primary', value: 'RECEIVED_BY_PLANNING' };

  if (status === 'QUOTED') return { label: 'Đã có báo giá', variant: 'success', value: 'QUOTED' };
  if (status === 'REJECTED') return { label: 'Đã hủy', variant: 'danger', value: 'REJECTED' };
  if (status === 'CANCELED') return { label: 'Đã hủy', variant: 'danger', value: 'CANCELED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getCustomerQuoteStatus = (status) => {
  if (status === 'DRAFT') return { label: 'Chờ báo giá', variant: 'secondary', value: 'DRAFT' };
  if (status === 'SENT') return { label: 'Chờ phê duyệt', variant: 'warning', value: 'SENT' };
  if (status === 'ACCEPTED' || status === 'ORDER_CREATED') return { label: 'Đã phê duyệt', variant: 'success', value: 'ACCEPTED' };
  if (status === 'REJECTED' || status === 'EXPIRED' || status === 'CANCELED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};

export const getCustomerOrderStatus = (status) => {
  if (status === 'DRAFT' || status === 'PENDING_UPLOAD') return { label: 'Chờ ký hợp đồng', variant: 'warning', value: 'WAITING_SIGNATURE' };
  if (status === 'PENDING_APPROVAL' || status === 'APPROVED') return { label: 'Chờ sản xuất', variant: 'primary', value: 'PENDING_PROCESS' };
  if (status === 'WAITING_PRODUCTION' || status === 'IN_PROGRESS') return { label: 'Đang sản xuất', variant: 'info', value: 'IN_PRODUCTION' };
  if (status === 'COMPLETED' || status === 'ORDER_COMPLETED') return { label: 'Sản xuất xong', variant: 'success', value: 'COMPLETED' };
  if (status === 'REJECTED') return { label: 'Đã từ chối', variant: 'danger', value: 'REJECTED' };

  const label = getStatusLabel(status);
  const variant = getStatusVariant(status);
  return { label, variant, value: status };
};
