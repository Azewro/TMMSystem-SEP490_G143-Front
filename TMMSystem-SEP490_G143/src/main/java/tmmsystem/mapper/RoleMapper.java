package tmmsystem.mapper;

import org.springframework.stereotype.Component;
import tmmsystem.dto.RoleDto;
import tmmsystem.entity.Role;

@Component
public class RoleMapper {
    
    public RoleDto toDto(Role role) {
        if (role == null) {
            return null;
        }
        
        RoleDto dto = new RoleDto();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setDescription(role.getDescription());
        return dto;
    }
    
    public Role toEntity(RoleDto dto) {
        if (dto == null) {
            return null;
        }
        
        Role role = new Role();
        role.setId(dto.getId());
        role.setName(dto.getName());
        role.setDescription(dto.getDescription());
        return role;
    }
}
