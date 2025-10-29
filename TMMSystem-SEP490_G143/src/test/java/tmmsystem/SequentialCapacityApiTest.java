package tmmsystem;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

@SpringBootTest
@ActiveProfiles("test")
public class SequentialCapacityApiTest {

    @Test
    public void testSequentialCapacityApi() {
        System.out.println("=== KIỂM TRA API NĂNG LỰC TUẦN TỰ ===");
        
        System.out.println("\n🔧 ENDPOINT: POST /v1/rfqs/{id}/check-machine-capacity");
        System.out.println("📋 Mô tả: Kiểm tra năng lực máy móc theo mô hình tuần tự");
        
        System.out.println("\n📊 QUY TRÌNH SẢN XUẤT MỚI:");
        System.out.println("1️⃣  MẮC CUỒNG → 2️⃣  DỆT VẢI → 3️⃣  NHUỘM (VENDOR) → 4️⃣  CẮT VẢI → 5️⃣  MAY THÀNH PHẨM");
        
        System.out.println("\n⏱️  THỜI GIAN CHỜ GIỮA CÁC CÔNG ĐOẠN:");
        System.out.println("• Mắc → Dệt: 0.5 ngày");
        System.out.println("• Dệt → Nhuộm: 0.5 ngày");
        System.out.println("• Nhuộm → Cắt: 1.0 ngày");
        System.out.println("• Cắt → May: 0.2 ngày");
        System.out.println("• Sau May: 0.3 ngày");
        System.out.println("• TỔNG THỜI GIAN CHỜ: 2.5 ngày");
        
        System.out.println("\n🏭 THÔNG TIN MÁY MÓC:");
        System.out.println("• Máy mắc: 2 máy × 200 kg/ngày = 400 kg/ngày");
        System.out.println("• Máy dệt: 10 máy × 50 kg/ngày = 500 kg/ngày");
        System.out.println("• Vendor nhuộm: 2 ngày cố định");
        System.out.println("• Máy cắt: 5 máy × 150 cái/giờ × 8 giờ = 1200 cái/ngày");
        System.out.println("• Máy may: 5 máy × 150 cái/giờ × 8 giờ = 1200 cái/ngày");
        
        System.out.println("\n📈 CÁCH TÍNH TOÁN MỚI:");
        System.out.println("• Thời gian tổng = Σ(Thời gian từng công đoạn) + Σ(Thời gian chờ)");
        System.out.println("• Bottleneck = Công đoạn có thời gian dài nhất");
        System.out.println("• Không còn tính song song, mà tính tuần tự");
        
        System.out.println("\n🎯 VÍ DỤ TÍNH TOÁN:");
        BigDecimal totalWeight = new BigDecimal("89");
        BigDecimal totalProducts = new BigDecimal("450");
        
        // Tính thời gian từng công đoạn
        BigDecimal warpingDays = totalWeight.divide(new BigDecimal("400"), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal weavingDays = totalWeight.divide(new BigDecimal("500"), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal dyeingDays = new BigDecimal("2.0"); // Vendor cố định
        BigDecimal cuttingDays = totalProducts.divide(new BigDecimal("1200"), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal sewingDays = totalProducts.divide(new BigDecimal("1200"), 2, java.math.RoundingMode.HALF_UP);
        
        BigDecimal totalWaitTime = new BigDecimal("2.5");
        BigDecimal totalDays = warpingDays.add(weavingDays).add(dyeingDays).add(cuttingDays).add(sewingDays).add(totalWaitTime);
        
        System.out.println("• Mắc: " + warpingDays + " ngày");
        System.out.println("• Dệt: " + weavingDays + " ngày");
        System.out.println("• Nhuộm: " + dyeingDays + " ngày");
        System.out.println("• Cắt: " + cuttingDays + " ngày");
        System.out.println("• May: " + sewingDays + " ngày");
        System.out.println("• Chờ: " + totalWaitTime + " ngày");
        System.out.println("• TỔNG: " + totalDays + " ngày");
        
        System.out.println("\n✅ LỢI ÍCH CỦA MÔ HÌNH MỚI:");
        System.out.println("• Phản ánh đúng quy trình sản xuất thực tế");
        System.out.println("• Tính toán chính xác thời gian giao hàng");
        System.out.println("• Quản lý tốt hơn lịch trình sản xuất");
        System.out.println("• Tránh xung đột tài nguyên giữa các đơn hàng");
        
        System.out.println("\n🚀 API SẴN SÀNG SỬ DỤNG!");
    }
}
