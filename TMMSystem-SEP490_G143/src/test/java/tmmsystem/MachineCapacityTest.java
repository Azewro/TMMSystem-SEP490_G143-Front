package tmmsystem;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import tmmsystem.repository.MachineRepository;
import tmmsystem.entity.Machine;

import java.math.BigDecimal;
import java.util.List;

@SpringBootTest
@ActiveProfiles("test")
public class MachineCapacityTest {

    @Autowired
    private MachineRepository machineRepository;

    @Test
    public void testMachineCapacityFromDatabase() {
        System.out.println("=== KIỂM TRA CÔNG SUẤT MÁY TỪ DATABASE ===");
        
        // Lấy tất cả máy
        List<Machine> machines = machineRepository.findAll();
        System.out.println("Tổng số máy: " + machines.size());
        
        // Tính tổng công suất theo loại từ JSON specifications
        BigDecimal totalWarpingCapacity = machines.stream()
                .filter(m -> "WARPING".equals(m.getType()))
                .filter(m -> "AVAILABLE".equals(m.getStatus()))
                .map(this::extractCapacityFromSpecs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalWeavingCapacity = machines.stream()
                .filter(m -> "WEAVING".equals(m.getType()))
                .filter(m -> "AVAILABLE".equals(m.getStatus()))
                .map(this::extractCapacityFromSpecs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalSewingCapacity = machines.stream()
                .filter(m -> "SEWING".equals(m.getType()))
                .filter(m -> "AVAILABLE".equals(m.getStatus()))
                .map(this::extractCapacityFromSpecs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        System.out.println("Công suất cuồng mắc: " + totalWarpingCapacity + " kg/ngày");
        System.out.println("Công suất dệt: " + totalWeavingCapacity + " kg/ngày");
        System.out.println("Công suất may: " + totalSewingCapacity + " cái/ngày");
        
        // Hiển thị chi tiết từng máy
        System.out.println("\nChi tiết máy:");
        for (Machine machine : machines) {
            BigDecimal capacity = extractCapacityFromSpecs(machine);
            System.out.println("- " + machine.getCode() + " (" + machine.getType() + "): " + 
                capacity + "/ngày - Specs: " + machine.getSpecifications());
        }
    }
    
    private BigDecimal extractCapacityFromSpecs(Machine machine) {
        try {
            String specs = machine.getSpecifications();
            if (specs == null || specs.isEmpty()) {
                return BigDecimal.ZERO;
            }
            
            String capacityPattern = "\"capacityPerDay\":";
            int startIndex = specs.indexOf(capacityPattern);
            if (startIndex == -1) {
                return BigDecimal.ZERO;
            }
            
            startIndex += capacityPattern.length();
            int endIndex = specs.indexOf(",", startIndex);
            if (endIndex == -1) {
                endIndex = specs.indexOf("}", startIndex);
            }
            
            if (endIndex == -1) {
                return BigDecimal.ZERO;
            }
            
            String capacityStr = specs.substring(startIndex, endIndex).trim();
            return new BigDecimal(capacityStr);
            
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
