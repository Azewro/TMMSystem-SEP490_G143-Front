package tmmsystem.dto.sales;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter @Setter
public class PaymentDto {
    private Long id;
    private Long contractId;
    private Long paymentTermId;
    private String paymentType;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String paymentMethod;
    private String paymentReference;
    private String status;
    private String invoiceNumber;
    private String receiptFilePath;
    private String notes;
    private Long createdById;
    private Long verifiedById;
    private Instant verifiedAt;
    private Instant createdAt;
    private Instant updatedAt;
}


