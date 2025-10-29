package tmmsystem;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import tmmsystem.entity.Role;
import tmmsystem.repository.RoleRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
public class IdResetTest {

    @Autowired
    private RoleRepository roleRepository;

    @Test
    public void testIdReset() {
        System.out.println("=== KIỂM TRA RESET ID ===");
        
        // Kiểm tra ID của role đầu tiên
        Role firstRole = roleRepository.findAll().get(0);
        System.out.println("ID của role đầu tiên: " + firstRole.getId());
        
        // ID phải bắt đầu từ 1
        assertEquals(1L, firstRole.getId(), "ID phải bắt đầu từ 1");
        
        System.out.println("✅ ID reset thành công!");
    }
}
