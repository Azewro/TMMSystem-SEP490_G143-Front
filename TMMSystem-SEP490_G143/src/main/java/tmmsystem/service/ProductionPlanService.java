package tmmsystem.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tmmsystem.dto.production_plan.*;
import tmmsystem.entity.*;
import tmmsystem.mapper.ProductionPlanMapper;
import tmmsystem.repository.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductionPlanService {
    
    private final ProductionPlanRepository planRepo;
    private final ProductionPlanDetailRepository detailRepo;
    private final ProductionPlanStageRepository stageRepo;
    private final ContractRepository contractRepo;
    private final UserRepository userRepo;
    private final MachineRepository machineRepo;
    private final ProductRepository productRepo;
    private final ProductionOrderRepository poRepo;
    private final ProductionOrderDetailRepository podRepo;
    @SuppressWarnings("unused")
    private final NotificationService notificationService;
    private final ProductionPlanMapper mapper;
    private final MachineSelectionService machineSelectionService;
    
    public ProductionPlanService(ProductionPlanRepository planRepo,
                                ProductionPlanDetailRepository detailRepo,
                                ProductionPlanStageRepository stageRepo,
                                ContractRepository contractRepo,
                                UserRepository userRepo,
                                MachineRepository machineRepo,
                                ProductRepository productRepo,
                                ProductionOrderRepository poRepo,
                                ProductionOrderDetailRepository podRepo,
                                NotificationService notificationService,
                                ProductionPlanMapper mapper,
                                MachineSelectionService machineSelectionService) {
        this.planRepo = planRepo;
        this.detailRepo = detailRepo;
        this.stageRepo = stageRepo;
        this.contractRepo = contractRepo;
        this.userRepo = userRepo;
        this.machineRepo = machineRepo;
        this.productRepo = productRepo;
        this.poRepo = poRepo;
        this.podRepo = podRepo;
        this.notificationService = notificationService;
        this.mapper = mapper;
        this.machineSelectionService = machineSelectionService;
    }
    
    // ===== CRUD Operations =====
    
    public List<ProductionPlanDto> findAllPlans() {
        return planRepo.findAll().stream()
            .map(mapper::toDto)
            .toList();
    }
    
    public ProductionPlanDto findPlanById(Long id) {
        ProductionPlan plan = planRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Production plan not found"));
        return mapper.toDto(plan);
    }
    
    public List<ProductionPlanDto> findPlansByStatus(String status) {
        try {
            ProductionPlan.PlanStatus planStatus = ProductionPlan.PlanStatus.valueOf(status.toUpperCase());
            return planRepo.findByStatus(planStatus).stream()
                .map(mapper::toDto)
                .toList();
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }
    
    public List<ProductionPlanDto> findPendingApprovalPlans() {
        return planRepo.findPendingApprovalPlans().stream()
            .map(mapper::toDto)
            .toList();
    }
    
    // ===== Create Production Plan =====
    
    @Transactional
    public ProductionPlanDto createPlanFromContract(CreateProductionPlanRequest request) {
        // Validate contract
        Contract contract = contractRepo.findById(request.getContractId())
            .orElseThrow(() -> new RuntimeException("Contract not found"));
        
        if (!"APPROVED".equals(contract.getStatus())) {
            throw new RuntimeException("Contract must be approved before creating production plan");
        }
        
        // Check if plan already exists for this contract
        if (planRepo.findByContractId(request.getContractId()).size() > 0) {
            throw new RuntimeException("Production plan already exists for this contract");
        }
        
        // Generate plan code if not provided
        String planCode = request.getPlanCode();
        if (planCode == null || planCode.trim().isEmpty()) {
            planCode = generatePlanCode();
        }
        
        // Validate plan code uniqueness
        if (planRepo.existsByPlanCode(planCode)) {
            throw new RuntimeException("Plan code already exists: " + planCode);
        }
        
        // Create production plan
        ProductionPlan plan = new ProductionPlan();
        plan.setContract(contract);
        plan.setPlanCode(planCode);
        plan.setStatus(ProductionPlan.PlanStatus.DRAFT);
        plan.setCreatedBy(getCurrentUser()); // This should be injected from security context
        plan.setApprovalNotes(request.getNotes());
        
        ProductionPlan savedPlan = planRepo.save(plan);
        
        // Create plan details
        if (request.getDetails() != null) {
            for (ProductionPlanDetailRequest detailRequest : request.getDetails()) {
                createPlanDetail(savedPlan, detailRequest);
            }
        }
        
        // Send notification to Director
        notificationService.notifyProductionPlanCreated(savedPlan);
        
        return mapper.toDto(savedPlan);
    }
    
    private void createPlanDetail(ProductionPlan plan, ProductionPlanDetailRequest request) {
        // Validate product
        Product product = productRepo.findById(request.getProductId())
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        // Validate work center
        Machine workCenter = null;
        if (request.getWorkCenterId() != null) {
            workCenter = machineRepo.findById(request.getWorkCenterId())
                .orElseThrow(() -> new RuntimeException("Work center not found"));
        }
        
        // Create plan detail
        ProductionPlanDetail detail = new ProductionPlanDetail();
        detail.setProductionPlan(plan);
        detail.setProduct(product);
        detail.setPlannedQuantity(request.getPlannedQuantity());
        detail.setRequiredDeliveryDate(request.getRequiredDeliveryDate());
        detail.setProposedStartDate(request.getProposedStartDate());
        detail.setProposedEndDate(request.getProposedEndDate());
        detail.setWorkCenter(workCenter);
        detail.setExpectedCapacityPerDay(request.getExpectedCapacityPerDay());
        detail.setLeadTimeDays(request.getLeadTimeDays());
        detail.setNotes(request.getNotes());
        
        ProductionPlanDetail savedDetail = detailRepo.save(detail);
        
        // Create plan stages
        if (request.getStages() != null) {
            for (ProductionPlanStageRequest stageRequest : request.getStages()) {
                createPlanStage(savedDetail, stageRequest);
            }
        }
    }
    
    private void createPlanStage(ProductionPlanDetail detail, ProductionPlanStageRequest request) {
        // Validate assigned machine
        Machine assignedMachine = null;
        if (request.getAssignedMachineId() != null) {
            assignedMachine = machineRepo.findById(request.getAssignedMachineId())
                .orElseThrow(() -> new RuntimeException("Assigned machine not found"));
        }
        
        // Validate in-charge user
        User inChargeUser = null;
        if (request.getInChargeUserId() != null) {
            inChargeUser = userRepo.findById(request.getInChargeUserId())
                .orElseThrow(() -> new RuntimeException("In-charge user not found"));
        }
        
        // Create plan stage
        ProductionPlanStage stage = new ProductionPlanStage();
        stage.setPlanDetail(detail);
        stage.setStageType(request.getStageType());
        stage.setSequenceNo(request.getSequenceNo());
        stage.setAssignedMachine(assignedMachine);
        stage.setInChargeUser(inChargeUser);
        stage.setPlannedStartTime(request.getPlannedStartTime());
        stage.setPlannedEndTime(request.getPlannedEndTime());
        stage.setMinRequiredDurationMinutes(request.getMinRequiredDurationMinutes());
        stage.setTransferBatchQuantity(request.getTransferBatchQuantity());
        stage.setCapacityPerHour(request.getCapacityPerHour());
        stage.setNotes(request.getNotes());
        
        stageRepo.save(stage);
    }
    
    // ===== Approval Workflow =====
    
    @Transactional
    public ProductionPlanDto submitForApproval(Long planId, SubmitForApprovalRequest request) {
        ProductionPlan plan = planRepo.findById(planId)
            .orElseThrow(() -> new RuntimeException("Production plan not found"));
        
        if (plan.getStatus() != ProductionPlan.PlanStatus.DRAFT) {
            throw new RuntimeException("Only draft plans can be submitted for approval");
        }
        
        // Validate plan has details
        List<ProductionPlanDetail> details = detailRepo.findByProductionPlanId(planId);
        if (details.isEmpty()) {
            throw new RuntimeException("Production plan must have at least one detail");
        }
        
        // Update status
        plan.setStatus(ProductionPlan.PlanStatus.PENDING_APPROVAL);
        plan.setApprovalNotes(request.getNotes());
        
        ProductionPlan savedPlan = planRepo.save(plan);
        
        // Send notification to Director
        notificationService.notifyProductionPlanSubmittedForApproval(savedPlan);
        
        return mapper.toDto(savedPlan);
    }
    
    @Transactional
    public ProductionPlanDto approvePlan(Long planId, ApproveProductionPlanRequest request) {
        ProductionPlan plan = planRepo.findById(planId)
            .orElseThrow(() -> new RuntimeException("Production plan not found"));
        
        if (plan.getStatus() != ProductionPlan.PlanStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Only pending approval plans can be approved");
        }
        
        // Update plan
        plan.setStatus(ProductionPlan.PlanStatus.APPROVED);
        plan.setApprovedBy(getCurrentUser()); // This should be injected from security context
        plan.setApprovedAt(Instant.now());
        plan.setApprovalNotes(request.getApprovalNotes());
        
        ProductionPlan savedPlan = planRepo.save(plan);
        
        // Automatically create Production Order
        createProductionOrderFromPlan(savedPlan);
        
        // Send notification to Planning Department
        notificationService.notifyProductionPlanApproved(savedPlan);
        
        return mapper.toDto(savedPlan);
    }
    
    @Transactional
    public ProductionPlanDto rejectPlan(Long planId, RejectProductionPlanRequest request) {
        ProductionPlan plan = planRepo.findById(planId)
            .orElseThrow(() -> new RuntimeException("Production plan not found"));
        
        if (plan.getStatus() != ProductionPlan.PlanStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Only pending approval plans can be rejected");
        }
        
        // Update plan
        plan.setStatus(ProductionPlan.PlanStatus.REJECTED);
        plan.setApprovedBy(getCurrentUser()); // This should be injected from security context
        plan.setApprovedAt(Instant.now());
        plan.setApprovalNotes(request.getRejectionReason());
        
        ProductionPlan savedPlan = planRepo.save(plan);
        
        // Send notification to Planning Department
        notificationService.notifyProductionPlanRejected(savedPlan);
        
        return mapper.toDto(savedPlan);
    }
    
    // ===== Helper Methods =====
    
    private String generatePlanCode() {
        String year = String.valueOf(LocalDate.now().getYear());
        String month = String.format("%02d", LocalDate.now().getMonthValue());
        String day = String.format("%02d", LocalDate.now().getDayOfMonth());
        
        String prefix = "PP-" + year + "-" + month + day + "-";
        
        // Find the next sequence number
        long count = planRepo.count();
        String sequence = String.format("%03d", count + 1);
        
        return prefix + sequence;
    }
    
    private User getCurrentUser() {
        // This should be implemented to get current user from security context
        // For now, return a default user or throw exception
        return userRepo.findById(1L).orElseThrow(() -> new RuntimeException("Current user not found"));
    }
    
    public ProductionOrder createProductionOrderFromApprovedPlan(Long planId) {
        ProductionPlan plan = planRepo.findById(planId)
            .orElseThrow(() -> new RuntimeException("Production plan not found"));
        
        if (plan.getStatus() != ProductionPlan.PlanStatus.APPROVED) {
            throw new RuntimeException("Only approved production plans can be converted to Production Orders");
        }
        
        return createProductionOrderFromPlan(plan);
    }
    
    private ProductionOrder createProductionOrderFromPlan(ProductionPlan plan) {
        // Create Production Order
        ProductionOrder po = new ProductionOrder();
        po.setPoNumber("PO-" + System.currentTimeMillis());
        po.setContract(plan.getContract());
        po.setStatus("PENDING_APPROVAL");
        po.setNotes("Auto-generated from Production Plan: " + plan.getPlanCode());
        po.setCreatedBy(plan.getCreatedBy());
        
        // Calculate total quantity from plan details
        List<ProductionPlanDetail> details = detailRepo.findByProductionPlanId(plan.getId());
        java.math.BigDecimal totalQuantity = details.stream()
            .map(ProductionPlanDetail::getPlannedQuantity)
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        
        po.setTotalQuantity(totalQuantity);
        
        // Set planned dates from earliest start and latest end
        LocalDate earliestStart = details.stream()
            .map(ProductionPlanDetail::getProposedStartDate)
            .min(LocalDate::compareTo)
            .orElse(LocalDate.now());
        
        LocalDate latestEnd = details.stream()
            .map(ProductionPlanDetail::getProposedEndDate)
            .max(LocalDate::compareTo)
            .orElse(LocalDate.now().plusDays(30));
        
        po.setPlannedStartDate(earliestStart);
        po.setPlannedEndDate(latestEnd);
        
        ProductionOrder savedPO = poRepo.save(po);
        
        // Create Production Order Details
        for (ProductionPlanDetail detail : details) {
            ProductionOrderDetail pod = new ProductionOrderDetail();
            pod.setProductionOrder(savedPO);
            pod.setProduct(detail.getProduct());
            pod.setQuantity(detail.getPlannedQuantity());
            pod.setUnit("UNIT");
            pod.setNoteColor(detail.getNotes());
            
            podRepo.save(pod);
        }
        
        return savedPO;
    }
    
    public List<ProductionPlanDto> findPlansByContract(Long contractId) {
        return planRepo.findByContractId(contractId).stream()
            .map(mapper::toDto)
            .toList();
    }
    
    public List<ProductionPlanDto> findPlansByCreator(Long userId) {
        return planRepo.findByCreatedById(userId).stream()
            .map(mapper::toDto)
            .toList();
    }
    
    public List<ProductionPlanDto> findApprovedPlansNotConverted() {
        return planRepo.findApprovedPlansNotConverted().stream()
            .map(mapper::toDto)
            .toList();
    }
    
    public ProductionPlanStage findStageById(Long stageId) {
        return stageRepo.findById(stageId)
            .orElseThrow(() -> new RuntimeException("Production plan stage not found"));
    }
    
    // ===== Machine Selection Methods =====
    
    /**
     * Lấy gợi ý máy móc cho một công đoạn sản xuất
     */
    public List<MachineSelectionService.MachineSuggestionDto> getMachineSuggestionsForStage(
            String stageType, Long productId, BigDecimal requiredQuantity,
            LocalDateTime preferredStartTime, LocalDateTime preferredEndTime) {
        
        return machineSelectionService.getSuitableMachines(
            stageType, productId, requiredQuantity, preferredStartTime, preferredEndTime);
    }
    
    /**
     * Tự động gán máy móc cho một công đoạn dựa trên gợi ý
     */
    @Transactional
    public ProductionPlanStageDto autoAssignMachineToStage(Long stageId) {
        ProductionPlanStage stage = stageRepo.findById(stageId)
            .orElseThrow(() -> new RuntimeException("Production plan stage not found"));
        
        // Lấy gợi ý máy móc
        List<MachineSelectionService.MachineSuggestionDto> suggestions = 
            machineSelectionService.getSuitableMachines(
                stage.getStageType(),
                stage.getPlanDetail().getProduct().getId(),
                stage.getPlanDetail().getPlannedQuantity(),
                stage.getPlannedStartTime(),
                stage.getPlannedEndTime()
            );
        
        if (!suggestions.isEmpty()) {
            // Chọn máy có điểm ưu tiên cao nhất
            MachineSelectionService.MachineSuggestionDto bestSuggestion = suggestions.get(0);
            
            // Cập nhật stage với máy được gợi ý
            Machine suggestedMachine = machineRepo.findById(bestSuggestion.getMachineId())
                .orElseThrow(() -> new RuntimeException("Suggested machine not found"));
            
            stage.setAssignedMachine(suggestedMachine);
            
            // Cập nhật thời gian nếu có gợi ý
            if (bestSuggestion.getSuggestedStartTime() != null) {
                stage.setPlannedStartTime(bestSuggestion.getSuggestedStartTime());
            }
            if (bestSuggestion.getSuggestedEndTime() != null) {
                stage.setPlannedEndTime(bestSuggestion.getSuggestedEndTime());
            }
            
            // Cập nhật thời lượng dựa trên năng suất máy
            if (bestSuggestion.getEstimatedDurationHours() != null) {
                stage.setMinRequiredDurationMinutes(
                    bestSuggestion.getEstimatedDurationHours().multiply(BigDecimal.valueOf(60)).intValue()
                );
            }
            
            ProductionPlanStage savedStage = stageRepo.save(stage);
            return mapper.toDto(savedStage);
        }
        
        throw new RuntimeException("No suitable machines found for stage: " + stage.getStageType());
    }
    
    /**
     * Kiểm tra xung đột lịch trình cho một stage
     */
    public List<String> checkStageScheduleConflicts(Long stageId) {
        ProductionPlanStage stage = stageRepo.findById(stageId)
            .orElseThrow(() -> new RuntimeException("Production plan stage not found"));
        
        if (stage.getAssignedMachine() == null) {
            return List.of("No machine assigned to this stage");
        }
        
        // Lấy gợi ý máy móc để kiểm tra xung đột
        List<MachineSelectionService.MachineSuggestionDto> suggestions = 
            machineSelectionService.getSuitableMachines(
                stage.getStageType(),
                stage.getPlanDetail().getProduct().getId(),
                stage.getPlanDetail().getPlannedQuantity(),
                stage.getPlannedStartTime(),
                stage.getPlannedEndTime()
            );
        
        // Tìm suggestion cho máy hiện tại
        MachineSelectionService.MachineSuggestionDto currentMachineSuggestion = suggestions.stream()
            .filter(s -> s.getMachineId().equals(stage.getAssignedMachine().getId()))
            .findFirst()
            .orElse(null);
        
        if (currentMachineSuggestion != null) {
            return currentMachineSuggestion.getConflicts();
        }
        
        return List.of("Unable to check conflicts for assigned machine");
    }
}
