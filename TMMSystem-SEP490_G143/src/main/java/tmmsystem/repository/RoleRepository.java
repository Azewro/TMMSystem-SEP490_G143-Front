// repository/RoleRepository.java
package tmmsystem.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.Role;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
}
