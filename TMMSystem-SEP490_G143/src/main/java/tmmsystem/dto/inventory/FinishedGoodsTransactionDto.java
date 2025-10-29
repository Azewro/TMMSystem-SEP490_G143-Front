package tmmsystem.dto.inventory;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter @Setter
public class FinishedGoodsTransactionDto {
    private Long id;
    private Long productId;
    private String transactionType;
    private BigDecimal quantity;
    private String unit;
    private String referenceType;
    private Long referenceId;
    private String batchNumber;
    private String location;
    private String qualityGrade;
    private String notes;
    private Long createdById;
    private Instant createdAt;
}


