package tmmsystem.dto.sales;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter
public class QuotationDto {
    private Long id;
    private String quotationNumber;
    private Long rfqId;
    private Long customerId;
    private LocalDate validUntil;
    private BigDecimal totalAmount;
    private String status;
    private Boolean isAccepted;
    private Boolean isCanceled;
    private Long capacityCheckedById;
    private Instant capacityCheckedAt;
    private String capacityCheckNotes;
    private Long createdById;
    private Long approvedById;
    private Instant createdAt;
    private Instant updatedAt;
    private List<QuotationDetailDto> details;
}


