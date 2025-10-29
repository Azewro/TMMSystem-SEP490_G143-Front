package tmmsystem.mapper;

import org.springframework.stereotype.Component;
import tmmsystem.dto.MachineDto;
import tmmsystem.entity.Machine;

@Component
public class MachineMapper {
    public MachineDto toDto(Machine e) {
        if (e == null) return null;
        MachineDto dto = new MachineDto();
        dto.setId(e.getId());
        dto.setCode(e.getCode());
        dto.setName(e.getName());
        dto.setType(e.getType());
        dto.setStatus(e.getStatus());
        dto.setLocation(e.getLocation());
        dto.setSpecifications(e.getSpecifications());
        dto.setLastMaintenanceAt(e.getLastMaintenanceAt());
        dto.setNextMaintenanceAt(e.getNextMaintenanceAt());
        dto.setMaintenanceIntervalDays(e.getMaintenanceIntervalDays());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }

    public Machine toEntity(MachineDto dto) {
        if (dto == null) return null;
        Machine e = new Machine();
        e.setId(dto.getId());
        e.setCode(dto.getCode());
        e.setName(dto.getName());
        e.setType(dto.getType());
        e.setStatus(dto.getStatus());
        e.setLocation(dto.getLocation());
        e.setSpecifications(dto.getSpecifications());
        e.setLastMaintenanceAt(dto.getLastMaintenanceAt());
        e.setNextMaintenanceAt(dto.getNextMaintenanceAt());
        e.setMaintenanceIntervalDays(dto.getMaintenanceIntervalDays());
        return e;
    }
}


