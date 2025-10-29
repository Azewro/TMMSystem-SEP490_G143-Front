package tmmsystem.dto.product;

import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter @Setter
public class MaterialDto {
    private Long id;
    private String code;
    private String name;
    private String type;
    private String unit;
    private BigDecimal reorderPoint;
    private BigDecimal standardCost;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}


