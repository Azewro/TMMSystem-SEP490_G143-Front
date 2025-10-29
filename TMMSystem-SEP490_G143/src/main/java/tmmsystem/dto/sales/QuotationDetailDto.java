package tmmsystem.dto.sales;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class QuotationDetailDto {
    private Long id;
    private Long productId;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String noteColor;
    private BigDecimal discountPercentage;
}


