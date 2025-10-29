package tmmsystem.mapper;

import org.springframework.stereotype.Component;
import tmmsystem.dto.production_plan.*;
import tmmsystem.entity.*;

import java.util.stream.Collectors;

@Component
public class ProductionPlanMapper {
    
    public ProductionPlanDto toDto(ProductionPlan plan) {
        if (plan == null) return null;
        
        ProductionPlanDto dto = new ProductionPlanDto();
        dto.setId(plan.getId());
        dto.setContractId(plan.getContract() != null ? plan.getContract().getId() : null);
        dto.setContractNumber(plan.getContract() != null ? plan.getContract().getContractNumber() : null);
        dto.setPlanCode(plan.getPlanCode());
        dto.setStatus(plan.getStatus() != null ? plan.getStatus().name() : null);
        dto.setCreatedById(plan.getCreatedBy() != null ? plan.getCreatedBy().getId() : null);
        dto.setCreatedByName(plan.getCreatedBy() != null ? plan.getCreatedBy().getName() : null);
        dto.setApprovedById(plan.getApprovedBy() != null ? plan.getApprovedBy().getId() : null);
        dto.setApprovedByName(plan.getApprovedBy() != null ? plan.getApprovedBy().getName() : null);
        dto.setApprovedAt(plan.getApprovedAt());
        dto.setApprovalNotes(plan.getApprovalNotes());
        dto.setCreatedAt(plan.getCreatedAt());
        dto.setUpdatedAt(plan.getUpdatedAt());
        
        // Contract information
        if (plan.getContract() != null) {
            dto.setCustomerName(plan.getContract().getCustomer() != null ? 
                plan.getContract().getCustomer().getCompanyName() : null);
            dto.setCustomerCode(plan.getContract().getCustomer() != null ? 
                plan.getContract().getCustomer().getTaxCode() : null);
            dto.setContractCreatedAt(plan.getContract().getCreatedAt());
            dto.setContractApprovedAt(plan.getContract().getDirectorApprovedAt());
        }
        
        // Map details if available
        if (plan.getDetails() != null) {
            dto.setDetails(plan.getDetails().stream()
                .map(this::toDto)
                .collect(Collectors.toList()));
        }
        
        return dto;
    }
    
    public ProductionPlanDetailDto toDto(ProductionPlanDetail detail) {
        if (detail == null) return null;
        
        ProductionPlanDetailDto dto = new ProductionPlanDetailDto();
        dto.setId(detail.getId());
        dto.setPlanId(detail.getProductionPlan() != null ? detail.getProductionPlan().getId() : null);
        dto.setProductId(detail.getProduct() != null ? detail.getProduct().getId() : null);
        dto.setProductCode(detail.getProduct() != null ? detail.getProduct().getCode() : null);
        dto.setProductName(detail.getProduct() != null ? detail.getProduct().getName() : null);
        dto.setProductDescription(detail.getProduct() != null ? detail.getProduct().getDescription() : null);
        dto.setPlannedQuantity(detail.getPlannedQuantity());
        dto.setRequiredDeliveryDate(detail.getRequiredDeliveryDate());
        dto.setProposedStartDate(detail.getProposedStartDate());
        dto.setProposedEndDate(detail.getProposedEndDate());
        dto.setWorkCenterId(detail.getWorkCenter() != null ? detail.getWorkCenter().getId() : null);
        dto.setWorkCenterName(detail.getWorkCenter() != null ? detail.getWorkCenter().getName() : null);
        dto.setWorkCenterCode(detail.getWorkCenter() != null ? detail.getWorkCenter().getCode() : null);
        dto.setExpectedCapacityPerDay(detail.getExpectedCapacityPerDay());
        dto.setLeadTimeDays(detail.getLeadTimeDays());
        dto.setNotes(detail.getNotes());
        
        // Map stages if available
        if (detail.getStages() != null) {
            dto.setStages(detail.getStages().stream()
                .map(this::toDto)
                .collect(Collectors.toList()));
            dto.setTotalStages(detail.getStages().size());
        }
        
        // Calculate total duration
        if (detail.getProposedStartDate() != null && detail.getProposedEndDate() != null) {
            dto.setTotalDurationDays(java.math.BigDecimal.valueOf(java.time.temporal.ChronoUnit.DAYS.between(
                detail.getProposedStartDate(), detail.getProposedEndDate())));
        }
        
        return dto;
    }
    
    public ProductionPlanStageDto toDto(ProductionPlanStage stage) {
        if (stage == null) return null;
        
        ProductionPlanStageDto dto = new ProductionPlanStageDto();
        dto.setId(stage.getId());
        dto.setPlanDetailId(stage.getPlanDetail() != null ? stage.getPlanDetail().getId() : null);
        dto.setStageType(stage.getStageType());
        dto.setStageTypeName(getStageTypeDisplayName(stage.getStageType()));
        dto.setSequenceNo(stage.getSequenceNo());
        dto.setAssignedMachineId(stage.getAssignedMachine() != null ? stage.getAssignedMachine().getId() : null);
        dto.setAssignedMachineName(stage.getAssignedMachine() != null ? stage.getAssignedMachine().getName() : null);
        dto.setAssignedMachineCode(stage.getAssignedMachine() != null ? stage.getAssignedMachine().getCode() : null);
        dto.setInChargeUserId(stage.getInChargeUser() != null ? stage.getInChargeUser().getId() : null);
        dto.setInChargeUserName(stage.getInChargeUser() != null ? stage.getInChargeUser().getName() : null);
        dto.setPlannedStartTime(stage.getPlannedStartTime());
        dto.setPlannedEndTime(stage.getPlannedEndTime());
        dto.setMinRequiredDurationMinutes(stage.getMinRequiredDurationMinutes());
        dto.setTransferBatchQuantity(stage.getTransferBatchQuantity());
        dto.setCapacityPerHour(stage.getCapacityPerHour());
        dto.setNotes(stage.getNotes());
        
        // Calculate duration
        if (stage.getPlannedStartTime() != null && stage.getPlannedEndTime() != null) {
            dto.setDurationMinutes(java.time.Duration.between(
                stage.getPlannedStartTime(), stage.getPlannedEndTime()).toMinutes());
        }
        
        // Calculate estimated output
        if (stage.getCapacityPerHour() != null && dto.getDurationMinutes() != null) {
            dto.setEstimatedOutput(stage.getCapacityPerHour()
                .multiply(java.math.BigDecimal.valueOf(dto.getDurationMinutes()))
                .divide(java.math.BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP));
        }
        
        return dto;
    }
    
    private String getStageTypeDisplayName(String stageType) {
        if (stageType == null) return null;
        
        return switch (stageType.toUpperCase()) {
            case "WARPING" -> "Mắc";
            case "WEAVING" -> "Dệt";
            case "DYEING" -> "Nhuộm";
            case "CUTTING" -> "Cắt";
            case "HEMMING" -> "Viền";
            case "PACKAGING" -> "Đóng gói";
            default -> stageType;
        };
    }
}
