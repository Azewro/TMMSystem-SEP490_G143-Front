package tmmsystem.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tmmsystem.entity.*;
import tmmsystem.repository.*;

import java.util.List;

@Service
public class ExecutionService {
    private final StageTrackingRepository trackingRepo;
    private final StagePauseLogRepository pauseRepo;
    private final OutsourcingTaskRepository outsourcingRepo;
    private final ProductionLossRepository lossRepo;
    private final MaterialRequisitionRepository reqRepo;
    private final MaterialRequisitionDetailRepository reqDetailRepo;

    public ExecutionService(StageTrackingRepository trackingRepo,
                            StagePauseLogRepository pauseRepo,
                            OutsourcingTaskRepository outsourcingRepo,
                            ProductionLossRepository lossRepo,
                            MaterialRequisitionRepository reqRepo,
                            MaterialRequisitionDetailRepository reqDetailRepo) {
        this.trackingRepo = trackingRepo; this.pauseRepo = pauseRepo; this.outsourcingRepo = outsourcingRepo;
        this.lossRepo = lossRepo; this.reqRepo = reqRepo; this.reqDetailRepo = reqDetailRepo;
    }

    // Tracking
    public List<StageTracking> findTrackings(Long stageId) { return trackingRepo.findByProductionStageIdOrderByTimestampAsc(stageId); }
    public StageTracking findTracking(Long id) { return trackingRepo.findById(id).orElseThrow(); }
    @Transactional public StageTracking createTracking(StageTracking e) { return trackingRepo.save(e); }
    public void deleteTracking(Long id) { trackingRepo.deleteById(id); }

    // Pause
    public List<StagePauseLog> findPauses(Long stageId) { return pauseRepo.findByProductionStageIdOrderByPausedAtDesc(stageId); }
    public StagePauseLog findPause(Long id) { return pauseRepo.findById(id).orElseThrow(); }
    @Transactional public StagePauseLog createPause(StagePauseLog e) { return pauseRepo.save(e); }
    @Transactional public StagePauseLog updatePause(Long id, StagePauseLog upd) {
        StagePauseLog e = pauseRepo.findById(id).orElseThrow();
        e.setProductionStage(upd.getProductionStage()); e.setPausedBy(upd.getPausedBy()); e.setResumedBy(upd.getResumedBy());
        e.setPauseReason(upd.getPauseReason()); e.setPauseNotes(upd.getPauseNotes()); e.setPausedAt(upd.getPausedAt()); e.setResumedAt(upd.getResumedAt());
        e.setDurationMinutes(upd.getDurationMinutes());
        return e;
    }
    public void deletePause(Long id) { pauseRepo.deleteById(id); }

    // Outsourcing
    public List<OutsourcingTask> findOutsourcing(Long stageId) { return outsourcingRepo.findByProductionStageId(stageId); }
    public OutsourcingTask findOutsourcingOne(Long id) { return outsourcingRepo.findById(id).orElseThrow(); }
    @Transactional public OutsourcingTask createOutsourcing(OutsourcingTask e) { return outsourcingRepo.save(e); }
    @Transactional public OutsourcingTask updateOutsourcing(Long id, OutsourcingTask upd) {
        OutsourcingTask e = outsourcingRepo.findById(id).orElseThrow();
        e.setProductionStage(upd.getProductionStage()); e.setVendorName(upd.getVendorName()); e.setDeliveryNoteNumber(upd.getDeliveryNoteNumber());
        e.setWeightSent(upd.getWeightSent()); e.setWeightReturned(upd.getWeightReturned()); e.setShrinkageRate(upd.getShrinkageRate());
        e.setExpectedQuantity(upd.getExpectedQuantity()); e.setReturnedQuantity(upd.getReturnedQuantity());
        e.setUnitCost(upd.getUnitCost()); e.setTotalCost(upd.getTotalCost());
        e.setSentAt(upd.getSentAt()); e.setExpectedReturnDate(upd.getExpectedReturnDate()); e.setActualReturnDate(upd.getActualReturnDate());
        e.setStatus(upd.getStatus()); e.setNotes(upd.getNotes()); e.setCreatedBy(upd.getCreatedBy());
        return e;
    }
    public void deleteOutsourcing(Long id) { outsourcingRepo.deleteById(id); }

    // Loss
    public List<ProductionLoss> findLosses(Long poId) { return lossRepo.findByProductionOrderId(poId); }
    public ProductionLoss findLoss(Long id) { return lossRepo.findById(id).orElseThrow(); }
    @Transactional public ProductionLoss createLoss(ProductionLoss e) { return lossRepo.save(e); }
    @Transactional public ProductionLoss updateLoss(Long id, ProductionLoss upd) {
        ProductionLoss e = lossRepo.findById(id).orElseThrow();
        e.setProductionOrder(upd.getProductionOrder()); e.setMaterial(upd.getMaterial()); e.setQuantityLost(upd.getQuantityLost());
        e.setLossType(upd.getLossType()); e.setProductionStage(upd.getProductionStage()); e.setNotes(upd.getNotes()); e.setRecordedBy(upd.getRecordedBy());
        return e;
    }
    public void deleteLoss(Long id) { lossRepo.deleteById(id); }

    // Requisition
    public MaterialRequisition findReq(Long id) { return reqRepo.findById(id).orElseThrow(); }
    @Transactional public MaterialRequisition createReq(MaterialRequisition e) { return reqRepo.save(e); }
    @Transactional public MaterialRequisition updateReq(Long id, MaterialRequisition upd) {
        MaterialRequisition e = reqRepo.findById(id).orElseThrow();
        e.setRequisitionNumber(upd.getRequisitionNumber()); e.setProductionStage(upd.getProductionStage());
        e.setRequestedBy(upd.getRequestedBy()); e.setApprovedBy(upd.getApprovedBy()); e.setStatus(upd.getStatus());
        e.setApprovedAt(upd.getApprovedAt()); e.setIssuedAt(upd.getIssuedAt()); e.setNotes(upd.getNotes());
        return e;
    }
    public void deleteReq(Long id) { reqRepo.deleteById(id); }

    public List<MaterialRequisitionDetail> findReqDetails(Long reqId) { return reqDetailRepo.findByRequisitionId(reqId); }
    public MaterialRequisitionDetail findReqDetail(Long id) { return reqDetailRepo.findById(id).orElseThrow(); }
    @Transactional public MaterialRequisitionDetail createReqDetail(MaterialRequisitionDetail e) { return reqDetailRepo.save(e); }
    @Transactional public MaterialRequisitionDetail updateReqDetail(Long id, MaterialRequisitionDetail upd) {
        MaterialRequisitionDetail e = reqDetailRepo.findById(id).orElseThrow();
        e.setRequisition(upd.getRequisition()); e.setMaterial(upd.getMaterial());
        e.setQuantityRequested(upd.getQuantityRequested()); e.setQuantityApproved(upd.getQuantityApproved()); e.setQuantityIssued(upd.getQuantityIssued());
        e.setUnit(upd.getUnit()); e.setNotes(upd.getNotes());
        return e;
    }
    public void deleteReqDetail(Long id) { reqDetailRepo.deleteById(id); }
}


