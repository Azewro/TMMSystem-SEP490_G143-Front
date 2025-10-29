package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tmmsystem.entity.ProductionPlanDetail;

import java.time.LocalDate;
import java.util.List;

public interface ProductionPlanDetailRepository extends JpaRepository<ProductionPlanDetail, Long> {
    
    // Tìm chi tiết theo kế hoạch
    List<ProductionPlanDetail> findByProductionPlanId(Long planId);
    
    // Tìm chi tiết theo sản phẩm
    List<ProductionPlanDetail> findByProductId(Long productId);
    
    // Tìm chi tiết theo máy/dây chuyền
    List<ProductionPlanDetail> findByWorkCenterId(Long workCenterId);
    
    // Tìm chi tiết theo ngày giao hàng
    List<ProductionPlanDetail> findByRequiredDeliveryDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Tìm chi tiết theo ngày giao hàng sắp tới
    @Query("SELECT ppd FROM ProductionPlanDetail ppd WHERE ppd.requiredDeliveryDate BETWEEN :startDate AND :endDate ORDER BY ppd.requiredDeliveryDate ASC")
    List<ProductionPlanDetail> findUpcomingDeliveries(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Kiểm tra xung đột máy móc
    @Query("SELECT ppd FROM ProductionPlanDetail ppd WHERE ppd.workCenter.id = :machineId " +
           "AND ((ppd.proposedStartDate BETWEEN :startDate AND :endDate) OR " +
           "(ppd.proposedEndDate BETWEEN :startDate AND :endDate) OR " +
           "(ppd.proposedStartDate <= :startDate AND ppd.proposedEndDate >= :endDate))")
    List<ProductionPlanDetail> findConflictingMachineSchedule(@Param("machineId") Long machineId, 
                                                               @Param("startDate") LocalDate startDate, 
                                                               @Param("endDate") LocalDate endDate);
}
