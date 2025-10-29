package tmmsystem.dto.inventory;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter @Setter
public class FinishedGoodsStockDto {
    private Long id;
    private Long productId;
    private BigDecimal quantity;
    private String unit;
    private String location;
    private String batchNumber;
    private LocalDate productionDate;
    private String qualityGrade;
    private Long qcInspectionId;
    private Instant lastUpdatedAt;
}


