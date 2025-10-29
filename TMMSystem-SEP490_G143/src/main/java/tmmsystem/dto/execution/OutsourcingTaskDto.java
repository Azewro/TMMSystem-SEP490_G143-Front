package tmmsystem.dto.execution;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter @Setter
public class OutsourcingTaskDto {
    private Long id;
    private Long productionStageId;
    private String vendorName;
    private String deliveryNoteNumber;
    private BigDecimal weightSent;
    private BigDecimal weightReturned;
    private BigDecimal shrinkageRate;
    private BigDecimal expectedQuantity;
    private BigDecimal returnedQuantity;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private Instant sentAt;
    private LocalDate expectedReturnDate;
    private LocalDate actualReturnDate;
    private String status;
    private String notes;
    private Long createdById;
    private Instant createdAt;
    private Instant updatedAt;
}


