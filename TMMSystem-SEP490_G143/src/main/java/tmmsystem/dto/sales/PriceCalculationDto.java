package tmmsystem.dto.sales;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Schema(description = "Thông tin tính giá báo giá")
public class PriceCalculationDto {
    
    @Schema(description = "Tổng giá nguyên vật liệu")
    private BigDecimal totalMaterialCost;
    
    @Schema(description = "Tổng chi phí công đoạn")
    private BigDecimal totalProcessCost;
    
    @Schema(description = "Tổng chi phí cơ bản (nguyên liệu + công đoạn)")
    private BigDecimal totalBaseCost;
    
    @Schema(description = "Lợi nhuận mong muốn (%)")
    private BigDecimal profitMargin;
    
    @Schema(description = "Tổng giá cuối cùng (có lợi nhuận)")
    private BigDecimal finalTotalPrice;
    
    @Schema(description = "Chi tiết tính giá theo từng sản phẩm")
    private List<ProductPriceDetailDto> productDetails;
    
    @Data
    @Schema(description = "Chi tiết giá theo sản phẩm")
    public static class ProductPriceDetailDto {
        @Schema(description = "ID sản phẩm")
        private Long productId;
        
        @Schema(description = "Tên sản phẩm")
        private String productName;
        
        @Schema(description = "Số lượng")
        private BigDecimal quantity;
        
        @Schema(description = "Trọng lượng đơn vị (kg)")
        private BigDecimal unitWeight;
        
        @Schema(description = "Giá nguyên liệu cho 1 đơn vị")
        private BigDecimal materialCostPerUnit;
        
        @Schema(description = "Chi phí công đoạn cho 1 đơn vị")
        private BigDecimal processCostPerUnit;
        
        @Schema(description = "Tổng chi phí cơ bản cho 1 đơn vị")
        private BigDecimal baseCostPerUnit;
        
        @Schema(description = "Giá bán cho 1 đơn vị (có lợi nhuận)")
        private BigDecimal unitPrice;
        
        @Schema(description = "Tổng giá cho sản phẩm này")
        private BigDecimal totalPrice;
    }
}
