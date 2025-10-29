// repository/UserRepository.java
package tmmsystem.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.User;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRoleName(String roleName);
}
