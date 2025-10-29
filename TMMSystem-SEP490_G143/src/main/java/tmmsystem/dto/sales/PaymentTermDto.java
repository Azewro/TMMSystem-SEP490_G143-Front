package tmmsystem.dto.sales;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter @Setter
public class PaymentTermDto {
    private Long id;
    private Long contractId;
    private Integer termSequence;
    private String termName;
    private BigDecimal percentage;
    private BigDecimal amount;
    private LocalDate dueDate;
    private String description;
    private Instant createdAt;
}


