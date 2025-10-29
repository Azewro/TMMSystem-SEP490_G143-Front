package tmmsystem.dto.sales;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CreateQuotationRequest {
    private Long rfqId;
    private Long planningUserId;
    private BigDecimal profitMargin = new BigDecimal("1.10"); // Mặc định 10%
    private String capacityCheckNotes;
}
