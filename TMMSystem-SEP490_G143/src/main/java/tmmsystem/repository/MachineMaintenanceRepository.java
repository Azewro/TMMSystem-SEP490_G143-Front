package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.MachineMaintenance;

import java.util.List;

public interface MachineMaintenanceRepository extends JpaRepository<MachineMaintenance, Long> {
    List<MachineMaintenance> findByMachineIdOrderByReportedAtDesc(Long machineId);
}


