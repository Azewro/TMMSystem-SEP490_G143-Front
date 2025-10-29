package tmmsystem;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

@SpringBootTest
@ActiveProfiles("test")
public class CapacityCheckTest {

    @Test
    public void testSequentialCapacityCalculation() {
        // Ví dụ tính toán năng lực theo mô hình tuần tự
        System.out.println("=== KIỂM TRA NĂNG LỰC SẢN XUẤT TUẦN TỰ ===");
        
        // Dữ liệu từ RFQ
        BigDecimal totalWeight = new BigDecimal("89"); // kg
        BigDecimal faceTowels = new BigDecimal("100"); // cái
        BigDecimal bathTowels = new BigDecimal("150"); // cái
        BigDecimal sportsTowels = new BigDecimal("200"); // cái
        
        // Công suất máy
        BigDecimal warpingCapacity = new BigDecimal("400"); // kg/ngày (2 máy × 200)
        BigDecimal weavingCapacity = new BigDecimal("500"); // kg/ngày (10 máy × 50)
        BigDecimal cuttingCapacity = new BigDecimal("1200"); // cái/ngày (5 máy × 150 × 8 giờ)
        BigDecimal sewingCapacity = new BigDecimal("1200"); // cái/ngày (5 máy × 150 × 8 giờ)
        
        // Thời gian chờ giữa các công đoạn
        BigDecimal warpingWait = new BigDecimal("0.5");
        BigDecimal weavingWait = new BigDecimal("0.5");
        BigDecimal dyeingWait = new BigDecimal("1.0");
        BigDecimal cuttingWait = new BigDecimal("0.2");
        BigDecimal sewingWait = new BigDecimal("0.3");
        BigDecimal vendorDyeingTime = new BigDecimal("2.0"); // Vendor nhuộm mất 2 ngày
        
        // Tính thời gian cần thiết cho từng công đoạn
        BigDecimal warpingDays = totalWeight.divide(warpingCapacity, 2, java.math.RoundingMode.HALF_UP);
        BigDecimal weavingDays = totalWeight.divide(weavingCapacity, 2, java.math.RoundingMode.HALF_UP);
        BigDecimal dyeingDays = vendorDyeingTime; // Vendor nhuộm cố định 2 ngày
        BigDecimal cuttingDays = faceTowels.add(bathTowels).add(sportsTowels).divide(cuttingCapacity, 2, java.math.RoundingMode.HALF_UP);
        BigDecimal sewingDays = faceTowels.add(bathTowels).add(sportsTowels).divide(sewingCapacity, 2, java.math.RoundingMode.HALF_UP);
        
        // Tính tổng thời gian tuần tự
        BigDecimal totalSequentialDays = warpingDays.add(weavingDays).add(dyeingDays).add(cuttingDays).add(sewingDays);
        
        // Thêm thời gian chờ
        BigDecimal totalWaitTime = warpingWait.add(weavingWait).add(dyeingWait).add(cuttingWait).add(sewingWait);
        BigDecimal totalDays = totalSequentialDays.add(totalWaitTime);
        
        System.out.println("Tổng khối lượng: " + totalWeight + " kg");
        System.out.println("Tổng sản phẩm: " + faceTowels.add(bathTowels).add(sportsTowels) + " cái");
        System.out.println();
        System.out.println("=== QUY TRÌNH TUẦN TỰ ===");
        System.out.println("1. MẮC CUỒNG: " + warpingDays + " ngày + " + warpingWait + " ngày chờ");
        System.out.println("2. DỆT VẢI: " + weavingDays + " ngày + " + weavingWait + " ngày chờ");
        System.out.println("3. NHUỘM VẢI: " + dyeingDays + " ngày (vendor) + " + dyeingWait + " ngày chờ");
        System.out.println("4. CẮT VẢI: " + cuttingDays + " ngày + " + cuttingWait + " ngày chờ");
        System.out.println("5. MAY THÀNH PHẨM: " + sewingDays + " ngày + " + sewingWait + " ngày chờ");
        System.out.println();
        System.out.println("Tổng thời gian sản xuất: " + totalSequentialDays + " ngày");
        System.out.println("Tổng thời gian chờ: " + totalWaitTime + " ngày");
        System.out.println("TỔNG CỘNG: " + totalDays + " ngày");
        
        // Xác định bottleneck (công đoạn mất nhiều thời gian nhất)
        BigDecimal maxProcessTime = warpingDays.max(weavingDays).max(dyeingDays).max(cuttingDays).max(sewingDays);
        String bottleneckType = "WARPING";
        if (weavingDays.compareTo(maxProcessTime) == 0) {
            bottleneckType = "WEAVING";
        } else if (dyeingDays.compareTo(maxProcessTime) == 0) {
            bottleneckType = "DYEING";
        } else if (cuttingDays.compareTo(maxProcessTime) == 0) {
            bottleneckType = "CUTTING";
        } else if (sewingDays.compareTo(maxProcessTime) == 0) {
            bottleneckType = "SEWING";
        }
        
        System.out.println();
        System.out.println("Bottleneck: " + bottleneckType + " (" + maxProcessTime + " ngày)");
        
        // Kiểm tra thời gian có sẵn
        BigDecimal availableDays = new BigDecimal("10"); // Giả sử có 10 ngày
        boolean sufficient = totalDays.compareTo(availableDays) <= 0;
        
        System.out.println("Thời gian có sẵn: " + availableDays + " ngày");
        System.out.println("Kết quả: " + (sufficient ? "ĐỦ" : "THIẾU"));
        
        if (!sufficient) {
            BigDecimal shortage = totalDays.subtract(availableDays);
            System.out.println("Thiếu: " + shortage + " ngày");
        }
    }
}
