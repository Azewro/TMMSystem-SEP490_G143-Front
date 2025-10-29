package tmmsystem.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tmmsystem.entity.*;
import tmmsystem.repository.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class ProductionService {
    private final ProductionOrderRepository poRepo;
    private final ProductionOrderDetailRepository podRepo;
    private final TechnicalSheetRepository techRepo;
    private final WorkOrderRepository woRepo;
    private final WorkOrderDetailRepository wodRepo;
    private final ProductionStageRepository stageRepo;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    @SuppressWarnings("unused")
    private final ContractRepository contractRepository;
    @SuppressWarnings("unused")
    private final BomRepository bomRepository;
    @SuppressWarnings("unused")
    private final ProductionOrderDetailRepository productionOrderDetailRepository;
    private final ProductionPlanService productionPlanService;

    public ProductionService(ProductionOrderRepository poRepo,
                             ProductionOrderDetailRepository podRepo,
                             TechnicalSheetRepository techRepo,
                             WorkOrderRepository woRepo,
                             WorkOrderDetailRepository wodRepo,
                             ProductionStageRepository stageRepo,
                             UserRepository userRepository,
                             NotificationService notificationService,
                             ContractRepository contractRepository,
                             BomRepository bomRepository,
                             ProductionOrderDetailRepository productionOrderDetailRepository,
                             ProductionPlanService productionPlanService) {
        this.poRepo = poRepo; this.podRepo = podRepo; this.techRepo = techRepo;
        this.woRepo = woRepo; this.wodRepo = wodRepo; this.stageRepo = stageRepo;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.contractRepository = contractRepository;
        this.bomRepository = bomRepository;
        this.productionOrderDetailRepository = productionOrderDetailRepository;
        this.productionPlanService = productionPlanService;
    }

    // Production Order
    public List<ProductionOrder> findAllPO() { return poRepo.findAll(); }
    public ProductionOrder findPO(Long id) { return poRepo.findById(id).orElseThrow(); }
    @Transactional public ProductionOrder createPO(ProductionOrder po) { return poRepo.save(po); }
    @Transactional public ProductionOrder updatePO(Long id, ProductionOrder upd) {
        ProductionOrder e = poRepo.findById(id).orElseThrow();
        e.setPoNumber(upd.getPoNumber()); e.setContract(upd.getContract()); e.setTotalQuantity(upd.getTotalQuantity());
        e.setPlannedStartDate(upd.getPlannedStartDate()); e.setPlannedEndDate(upd.getPlannedEndDate());
        e.setStatus(upd.getStatus()); e.setPriority(upd.getPriority()); e.setNotes(upd.getNotes());
        e.setCreatedBy(upd.getCreatedBy()); e.setApprovedBy(upd.getApprovedBy()); e.setApprovedAt(upd.getApprovedAt());
        return e;
    }
    public void deletePO(Long id) { poRepo.deleteById(id); }

    // PO Detail
    public List<ProductionOrderDetail> findPODetails(Long poId) { return podRepo.findByProductionOrderId(poId); }
    public ProductionOrderDetail findPODetail(Long id) { return podRepo.findById(id).orElseThrow(); }
    @Transactional public ProductionOrderDetail createPODetail(ProductionOrderDetail d) { return podRepo.save(d); }
    @Transactional public ProductionOrderDetail updatePODetail(Long id, ProductionOrderDetail upd) {
        ProductionOrderDetail e = podRepo.findById(id).orElseThrow();
        e.setProductionOrder(upd.getProductionOrder()); e.setProduct(upd.getProduct()); e.setBom(upd.getBom());
        e.setBomVersion(upd.getBomVersion()); e.setQuantity(upd.getQuantity()); e.setUnit(upd.getUnit()); e.setNoteColor(upd.getNoteColor());
        return e;
    }
    public void deletePODetail(Long id) { podRepo.deleteById(id); }

    // Technical Sheet
    public TechnicalSheet findTechSheet(Long id) { return techRepo.findById(id).orElseThrow(); }
    @Transactional public TechnicalSheet createTechSheet(TechnicalSheet t) { return techRepo.save(t); }
    @Transactional public TechnicalSheet updateTechSheet(Long id, TechnicalSheet upd) {
        TechnicalSheet e = techRepo.findById(id).orElseThrow();
        e.setProductionOrder(upd.getProductionOrder()); e.setSheetNumber(upd.getSheetNumber());
        e.setYarnSpecifications(upd.getYarnSpecifications()); e.setMachineSettings(upd.getMachineSettings());
        e.setQualityStandards(upd.getQualityStandards()); e.setSpecialInstructions(upd.getSpecialInstructions());
        e.setCreatedBy(upd.getCreatedBy()); e.setApprovedBy(upd.getApprovedBy());
        return e;
    }
    public void deleteTechSheet(Long id) { techRepo.deleteById(id); }

    // Work Order
    public List<WorkOrder> findWOs(Long poId) { return woRepo.findByProductionOrderId(poId); }
    public WorkOrder findWO(Long id) { return woRepo.findById(id).orElseThrow(); }
    @Transactional public WorkOrder createWO(WorkOrder w) { return woRepo.save(w); }
    @Transactional public WorkOrder updateWO(Long id, WorkOrder upd) {
        WorkOrder e = woRepo.findById(id).orElseThrow();
        e.setProductionOrder(upd.getProductionOrder()); e.setWoNumber(upd.getWoNumber()); e.setDeadline(upd.getDeadline());
        e.setStatus(upd.getStatus()); e.setSendStatus(upd.getSendStatus()); e.setProduction(upd.getProduction());
        e.setCreatedBy(upd.getCreatedBy()); e.setApprovedBy(upd.getApprovedBy());
        return e;
    }
    public void deleteWO(Long id) { woRepo.deleteById(id); }

    // Work Order Detail
    public List<WorkOrderDetail> findWODetails(Long woId) { return wodRepo.findByWorkOrderId(woId); }
    public WorkOrderDetail findWODetail(Long id) { return wodRepo.findById(id).orElseThrow(); }
    @Transactional public WorkOrderDetail createWODetail(WorkOrderDetail d) { return wodRepo.save(d); }
    @Transactional public WorkOrderDetail updateWODetail(Long id, WorkOrderDetail upd) {
        WorkOrderDetail e = wodRepo.findById(id).orElseThrow();
        e.setWorkOrder(upd.getWorkOrder()); e.setProductionOrderDetail(upd.getProductionOrderDetail()); e.setStageSequence(upd.getStageSequence());
        e.setPlannedStartAt(upd.getPlannedStartAt()); e.setPlannedEndAt(upd.getPlannedEndAt()); e.setStartAt(upd.getStartAt()); e.setCompleteAt(upd.getCompleteAt());
        e.setWorkStatus(upd.getWorkStatus()); e.setNotes(upd.getNotes());
        return e;
    }
    public void deleteWODetail(Long id) { wodRepo.deleteById(id); }

    // Stage
    public List<ProductionStage> findStages(Long woDetailId) { return stageRepo.findByWorkOrderDetailIdOrderByStageSequenceAsc(woDetailId); }
    public ProductionStage findStage(Long id) { return stageRepo.findById(id).orElseThrow(); }
    @Transactional public ProductionStage createStage(ProductionStage s) { return stageRepo.save(s); }
    @Transactional public ProductionStage updateStage(Long id, ProductionStage upd) {
        ProductionStage e = stageRepo.findById(id).orElseThrow();
        e.setWorkOrderDetail(upd.getWorkOrderDetail()); e.setStageType(upd.getStageType()); e.setStageSequence(upd.getStageSequence());
        e.setMachine(upd.getMachine()); e.setAssignedTo(upd.getAssignedTo()); e.setAssignedLeader(upd.getAssignedLeader());
        e.setBatchNumber(upd.getBatchNumber()); e.setPlannedOutput(upd.getPlannedOutput()); e.setActualOutput(upd.getActualOutput());
        e.setStartAt(upd.getStartAt()); e.setCompleteAt(upd.getCompleteAt()); e.setStatus(upd.getStatus());
        e.setOutsourced(upd.getOutsourced()); e.setOutsourceVendor(upd.getOutsourceVendor()); e.setNotes(upd.getNotes());
        return e;
    }
    public void deleteStage(Long id) { stageRepo.deleteById(id); }

    // ===== GIAI ĐOẠN 4: PRODUCTION ORDER CREATION & APPROVAL =====
    
    // ===== GIAI ĐOẠN 4: PRODUCTION ORDER CREATION & APPROVAL (NEW WORKFLOW) =====
    
    /**
     * @deprecated Use ProductionPlanService.createPlanFromContract() instead
     * This method is kept for backward compatibility but will redirect to new workflow
     */
    @Deprecated
    @Transactional
    public ProductionOrder createFromContract(Long contractId, Long planningUserId, 
                                           LocalDate plannedStartDate, LocalDate plannedEndDate, String notes) {
        // Redirect to new Production Plan workflow
        throw new UnsupportedOperationException(
            "Direct Production Order creation from contract is deprecated. " +
            "Please use Production Plan workflow: " +
            "1. Create Production Plan via ProductionPlanService.createPlanFromContract() " +
            "2. Submit for approval " +
            "3. Approve to automatically create Production Order"
        );
    }
    
    /**
     * New method: Create Production Order from approved Production Plan
     * This method is called automatically by ProductionPlanService when plan is approved
     */
    @Transactional
    public ProductionOrder createFromApprovedPlan(Long planId) {
        // This method will be implemented to create PO from approved Production Plan
        // For now, delegate to ProductionPlanService
        return productionPlanService.createProductionOrderFromApprovedPlan(planId);
    }
    
    @Transactional
    public ProductionOrder approveProductionOrder(Long poId, Long directorId, String notes) {
        ProductionOrder po = poRepo.findById(poId)
            .orElseThrow(() -> new RuntimeException("Production Order not found"));
        
        User director = userRepository.findById(directorId)
            .orElseThrow(() -> new RuntimeException("Director not found"));
        
        po.setStatus("APPROVED");
        po.setApprovedBy(director);
        po.setApprovedAt(Instant.now());
        
        ProductionOrder savedPO = poRepo.save(po);
        
        // Send notification to Production Team
        notificationService.notifyProductionOrderApproved(savedPO);
        
        return savedPO;
    }
    
    @Transactional
    public ProductionOrder rejectProductionOrder(Long poId, Long directorId, String rejectionNotes) {
        ProductionOrder po = poRepo.findById(poId)
            .orElseThrow(() -> new RuntimeException("Production Order not found"));
        
        User director = userRepository.findById(directorId)
            .orElseThrow(() -> new RuntimeException("Director not found"));
        
        po.setStatus("REJECTED");
        po.setApprovedBy(director);
        po.setApprovedAt(Instant.now());
        po.setNotes(rejectionNotes);
        
        ProductionOrder savedPO = poRepo.save(po);
        
        // Send notification to Planning Department
        notificationService.notifyProductionOrderRejected(savedPO);
        
        return savedPO;
    }
    
    public List<ProductionOrder> getProductionOrdersPendingApproval() {
        return poRepo.findByStatus("PENDING_APPROVAL");
    }
    
    public List<ProductionOrder> getDirectorPendingProductionOrders() {
        return poRepo.findByStatus("PENDING_APPROVAL");
    }
    
    // ===== PRODUCTION PLAN INTEGRATION METHODS =====
    
    public List<tmmsystem.dto.production_plan.ProductionPlanDto> getProductionPlansForContract(Long contractId) {
        return productionPlanService.findPlansByContract(contractId);
    }
    
    public List<tmmsystem.dto.production_plan.ProductionPlanDto> getProductionPlansPendingApproval() {
        return productionPlanService.findPendingApprovalPlans();
    }
}


