package tmmsystem.dto.product;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class BomDetailDto {
    private Long id;
    private Long bomId;
    private Long materialId;
    private BigDecimal quantity;
    private String unit;
    private String stage;
    private Boolean isOptional;
    private String notes;
}


