package tmmsystem.dto.sales;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class RfqDetailDto {
    private Long id;
    private Long productId;
    private BigDecimal quantity;
    private String unit;
    private String noteColor;
    private String notes;
}


