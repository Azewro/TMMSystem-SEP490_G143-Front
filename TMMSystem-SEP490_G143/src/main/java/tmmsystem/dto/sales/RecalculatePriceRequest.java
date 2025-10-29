package tmmsystem.dto.sales;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;

@Data
@Schema(description = "Request tính lại giá khi thay đổi profit margin")
public class RecalculatePriceRequest {
    
    @NotNull(message = "RFQ ID is required")
    @Schema(description = "ID của RFQ", example = "123")
    private Long rfqId;
    
    @NotNull(message = "Profit margin is required")
    @DecimalMin(value = "1.0", message = "Profit margin must be at least 1.0 (0% profit)")
    @Schema(description = "Lợi nhuận mong muốn (1.0 = 0%, 1.1 = 10%, 1.15 = 15%)", example = "1.15")
    private BigDecimal profitMargin;
}
