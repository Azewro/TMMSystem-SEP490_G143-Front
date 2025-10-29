package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.Machine;

public interface MachineRepository extends JpaRepository<Machine, Long> {
    boolean existsByCode(String code);
}


