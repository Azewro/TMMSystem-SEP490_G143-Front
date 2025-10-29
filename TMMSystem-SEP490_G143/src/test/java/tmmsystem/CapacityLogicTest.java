package tmmsystem;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

@SpringBootTest
@ActiveProfiles("test")
public class CapacityLogicTest {

    @Test
    public void testCapacityCalculation() {
        System.out.println("=== KIỂM TRA LOGIC CÔNG SUẤT MÁY ===");
        
        // Công suất theo yêu cầu
        System.out.println("Công suất máy:");
        System.out.println("- Cuồng mắc: 2 máy × 200kg/ngày = 400kg/ngày");
        System.out.println("- Dệt: 10 máy × 50kg/ngày = 500kg/ngày");
        System.out.println("- May: 5 máy × [150/70/100] cái/giờ × 8 giờ = [6000/2800/4000] cái/ngày");
        
        // Ví dụ tính toán
        BigDecimal totalWeight = new BigDecimal("89"); // kg
        BigDecimal faceTowels = new BigDecimal("100"); // cái
        BigDecimal bathTowels = new BigDecimal("150"); // cái
        BigDecimal sportsTowels = new BigDecimal("200"); // cái
        
        System.out.println("\nVí dụ RFQ:");
        System.out.println("- Tổng khối lượng: " + totalWeight + " kg");
        System.out.println("- Khăn mặt: " + faceTowels + " cái");
        System.out.println("- Khăn tắm: " + bathTowels + " cái");
        System.out.println("- Khăn thể thao: " + sportsTowels + " cái");
        
        // Tính thời gian cần thiết
        BigDecimal warpingDays = totalWeight.divide(new BigDecimal("400"), 2, BigDecimal.ROUND_HALF_UP);
        BigDecimal weavingDays = totalWeight.divide(new BigDecimal("500"), 2, BigDecimal.ROUND_HALF_UP);
        
        // Tính may theo từng loại
        BigDecimal faceDays = faceTowels.divide(new BigDecimal("6000"), 2, BigDecimal.ROUND_HALF_UP);
        BigDecimal bathDays = bathTowels.divide(new BigDecimal("2800"), 2, BigDecimal.ROUND_HALF_UP);
        BigDecimal sportsDays = sportsTowels.divide(new BigDecimal("4000"), 2, BigDecimal.ROUND_HALF_UP);
        BigDecimal sewingDays = faceDays.max(bathDays).max(sportsDays);
        
        System.out.println("\nThời gian cần thiết:");
        System.out.println("- Cuồng mắc: " + warpingDays + " ngày");
        System.out.println("- Dệt: " + weavingDays + " ngày");
        System.out.println("- May (khăn mặt): " + faceDays + " ngày");
        System.out.println("- May (khăn tắm): " + bathDays + " ngày");
        System.out.println("- May (khăn thể thao): " + sportsDays + " ngày");
        System.out.println("- May (bottleneck): " + sewingDays + " ngày");
        
        // Xác định bottleneck
        BigDecimal bottleneck = warpingDays.max(weavingDays).max(sewingDays);
        String bottleneckType = "WARPING";
        if (weavingDays.compareTo(warpingDays) > 0 && weavingDays.compareTo(sewingDays) > 0) {
            bottleneckType = "WEAVING";
        } else if (sewingDays.compareTo(warpingDays) > 0 && sewingDays.compareTo(weavingDays) > 0) {
            bottleneckType = "SEWING";
        }
        
        System.out.println("\nBottleneck: " + bottleneckType + " (" + bottleneck + " ngày)");
        
        // Kiểm tra thời gian có sẵn
        BigDecimal availableDays = new BigDecimal("3");
        boolean sufficient = bottleneck.compareTo(availableDays) <= 0;
        
        System.out.println("Thời gian có sẵn: " + availableDays + " ngày");
        System.out.println("Kết quả: " + (sufficient ? "ĐỦ" : "THIẾU"));
    }
}
