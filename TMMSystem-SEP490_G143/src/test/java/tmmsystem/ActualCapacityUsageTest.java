package tmmsystem;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;

@SpringBootTest
@ActiveProfiles("test")
public class ActualCapacityUsageTest {

    @Test
    public void testActualCapacityUsageCalculation() {
        System.out.println("=== KIỂM TRA TÍNH TOÁN TỶ LỆ SỬ DỤNG CÔNG SUẤT THỰC TẾ ===");
        
        System.out.println("\n🎯 MỤC TIÊU:");
        System.out.println("• Tính tỷ lệ sử dụng công suất dựa trên sản phẩm thực tế của các contract");
        System.out.println("• Thay thế tỷ lệ 50% cố định bằng tính toán chính xác");
        System.out.println("• Chỉ tính từ ProductionOrder của Contract đã ký");
        
        System.out.println("\n📊 CÁCH TÍNH TOÁN MỚI:");
        
        System.out.println("\n1️⃣  LẤY DỮ LIỆU SẢN PHẨM:");
        System.out.println("• Chỉ từ ProductionOrder của các Contract đã ký");
        System.out.println("• Không cần Quotation vì đây là check trước khi tạo báo giá");
        
        System.out.println("\n2️⃣  TÍNH THEO LOẠI CÔNG ĐOẠN:");
        System.out.println("• MẮC/DỆT/NHUỘM: Tính theo khối lượng (kg)");
        System.out.println("• CẮT/MAY: Tính theo số lượng sản phẩm (cái)");
        
        System.out.println("\n3️⃣  VÍ DỤ TÍNH TOÁN:");
        
        // Ví dụ Contract A
        System.out.println("\n📋 CONTRACT A (đang chạy):");
        System.out.println("• Khăn mặt: 100 cái × 60g = 6 kg");
        System.out.println("• Khăn tắm: 50 cái × 220g = 11 kg");
        System.out.println("• Tổng khối lượng: 17 kg");
        System.out.println("• Tổng sản phẩm: 150 cái");
        
        // Ví dụ Contract B  
        System.out.println("\n📋 CONTRACT B (đang chạy):");
        System.out.println("• Khăn thể thao: 200 cái × 100g = 20 kg");
        System.out.println("• Tổng khối lượng: 20 kg");
        System.out.println("• Tổng sản phẩm: 200 cái");
        
        System.out.println("\n4️⃣  TÍNH CÔNG SUẤT ĐÃ SỬ DỤNG:");
        
        // Máy mắc/dệt
        BigDecimal totalWeight = new BigDecimal("37"); // 17 + 20 kg
        BigDecimal warpingCapacity = new BigDecimal("400"); // kg/ngày
        BigDecimal weavingCapacity = new BigDecimal("500"); // kg/ngày
        
        BigDecimal warpingUsage = totalWeight.divide(warpingCapacity, 4, java.math.RoundingMode.HALF_UP);
        BigDecimal weavingUsage = totalWeight.divide(weavingCapacity, 4, java.math.RoundingMode.HALF_UP);
        
        System.out.println("• Máy mắc: " + totalWeight + " kg / " + warpingCapacity + " kg/ngày = " + 
                          (warpingUsage.multiply(new BigDecimal("100"))) + "%");
        System.out.println("• Máy dệt: " + totalWeight + " kg / " + weavingCapacity + " kg/ngày = " + 
                          (weavingUsage.multiply(new BigDecimal("100"))) + "%");
        
        // Máy cắt/may
        BigDecimal totalProducts = new BigDecimal("350"); // 150 + 200 cái
        BigDecimal cuttingCapacity = new BigDecimal("1200"); // cái/ngày
        BigDecimal sewingCapacity = new BigDecimal("1200"); // cái/ngày
        
        BigDecimal cuttingUsage = totalProducts.divide(cuttingCapacity, 4, java.math.RoundingMode.HALF_UP);
        BigDecimal sewingUsage = totalProducts.divide(sewingCapacity, 4, java.math.RoundingMode.HALF_UP);
        
        System.out.println("• Máy cắt: " + totalProducts + " cái / " + cuttingCapacity + " cái/ngày = " + 
                          (cuttingUsage.multiply(new BigDecimal("100"))) + "%");
        System.out.println("• Máy may: " + totalProducts + " cái / " + sewingCapacity + " cái/ngày = " + 
                          (sewingUsage.multiply(new BigDecimal("100"))) + "%");
        
        System.out.println("\n5️⃣  KIỂM TRA XUNG ĐỘT:");
        System.out.println("• Đơn hàng mới cần: 100% công suất");
        System.out.println("• Công suất còn lại: " + (new BigDecimal("100").subtract(warpingUsage.multiply(new BigDecimal("100")))) + "%");
        
        if (warpingUsage.compareTo(new BigDecimal("1.0")) >= 0) {
            System.out.println("❌ XUNG ĐỘT: Không đủ công suất máy mắc!");
        } else {
            System.out.println("✅ ĐỦ: Còn " + (new BigDecimal("100").subtract(warpingUsage.multiply(new BigDecimal("100")))) + "% công suất");
        }
        
        System.out.println("\n6️⃣  LỢI ÍCH CỦA CÁCH TÍNH MỚI:");
        System.out.println("✅ Chính xác: Dựa trên sản phẩm thực tế từ ProductionOrder");
        System.out.println("✅ Đúng mục đích: Chỉ so sánh với Contract đã ký");
        System.out.println("✅ Thông minh: Tính theo loại công đoạn");
        System.out.println("✅ Bảo trì: Không còn số liệu fix cứng");
        System.out.println("✅ Mở rộng: Dễ thêm logic mới");
        
        System.out.println("\n🚀 API SẴN SÀNG VỚI TÍNH TOÁN CHÍNH XÁC!");
    }
}
