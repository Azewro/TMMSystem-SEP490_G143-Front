package tmmsystem;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

@SpringBootTest
@ActiveProfiles("test")
public class MaterialPriceCalculationTest {

    @Test
    public void testMaterialPriceCalculation() {
        // Ví dụ tính giá trung bình
        // Batch 1: 500,000 kg × 71,400 VND/kg (68,000 × 1.05)
        // Batch 2: 499,999 kg × 64,600 VND/kg (68,000 × 0.95)
        
        BigDecimal batch1Quantity = new BigDecimal("500000");
        BigDecimal batch1Price = new BigDecimal("71400"); // 68,000 × 1.05
        BigDecimal batch1Value = batch1Quantity.multiply(batch1Price);
        
        BigDecimal batch2Quantity = new BigDecimal("499999");
        BigDecimal batch2Price = new BigDecimal("64600"); // 68,000 × 0.95
        BigDecimal batch2Value = batch2Quantity.multiply(batch2Price);
        
        BigDecimal totalQuantity = batch1Quantity.add(batch2Quantity);
        BigDecimal totalValue = batch1Value.add(batch2Value);
        BigDecimal averagePrice = totalValue.divide(totalQuantity, 2, BigDecimal.ROUND_HALF_UP);
        
        System.out.println("Batch 1: " + batch1Quantity + " kg × " + batch1Price + " = " + batch1Value);
        System.out.println("Batch 2: " + batch2Quantity + " kg × " + batch2Price + " = " + batch2Value);
        System.out.println("Total: " + totalQuantity + " kg, Total Value: " + totalValue);
        System.out.println("Average Price: " + averagePrice + " VND/kg");
        
        // Kết quả mong đợi: (35,700,000,000 + 32,299,935,400) / 999,999 ≈ 68,000 VND/kg
    }
}
