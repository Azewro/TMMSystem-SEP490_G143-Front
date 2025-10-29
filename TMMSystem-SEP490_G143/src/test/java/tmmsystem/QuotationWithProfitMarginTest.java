package tmmsystem;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

@SpringBootTest
@ActiveProfiles("test")
public class QuotationWithProfitMarginTest {

    @Test
    public void testProfitMarginCalculation() {
        // Ví dụ tính giá với lợi nhuận khác nhau
        
        // Giá cơ bản (nguyên liệu + công)
        BigDecimal basePrice = new BigDecimal("100000"); // 100,000 VND
        
        // Lợi nhuận 10% (mặc định)
        BigDecimal profit10 = new BigDecimal("1.10");
        BigDecimal priceWith10Profit = basePrice.multiply(profit10);
        System.out.println("Giá với 10% lợi nhuận: " + priceWith10Profit + " VND");
        
        // Lợi nhuận 15%
        BigDecimal profit15 = new BigDecimal("1.15");
        BigDecimal priceWith15Profit = basePrice.multiply(profit15);
        System.out.println("Giá với 15% lợi nhuận: " + priceWith15Profit + " VND");
        
        // Lợi nhuận 5%
        BigDecimal profit5 = new BigDecimal("1.05");
        BigDecimal priceWith5Profit = basePrice.multiply(profit5);
        System.out.println("Giá với 5% lợi nhuận: " + priceWith5Profit + " VND");
        
        // Lợi nhuận 20%
        BigDecimal profit20 = new BigDecimal("1.20");
        BigDecimal priceWith20Profit = basePrice.multiply(profit20);
        System.out.println("Giá với 20% lợi nhuận: " + priceWith20Profit + " VND");
    }
}
