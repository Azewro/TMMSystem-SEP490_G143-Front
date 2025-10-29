package tmmsystem.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tmmsystem.entity.Machine;
import tmmsystem.repository.MachineRepository;

import java.util.List;

@Service
public class MachineService {
    private final MachineRepository repository;

    public MachineService(MachineRepository repository) { this.repository = repository; }

    public List<Machine> findAll() { return repository.findAll(); }
    public Machine findById(Long id) { return repository.findById(id).orElseThrow(); }

    @Transactional
    public Machine create(Machine m) { return repository.save(m); }

    @Transactional
    public Machine update(Long id, Machine updated) {
        Machine existing = repository.findById(id).orElseThrow();
        existing.setCode(updated.getCode());
        existing.setName(updated.getName());
        existing.setType(updated.getType());
        existing.setStatus(updated.getStatus());
        existing.setSpecifications(updated.getSpecifications());
        existing.setLastMaintenanceAt(updated.getLastMaintenanceAt());
        existing.setNextMaintenanceAt(updated.getNextMaintenanceAt());
        return existing;
    }

    public void delete(Long id) { repository.deleteById(id); }
}


