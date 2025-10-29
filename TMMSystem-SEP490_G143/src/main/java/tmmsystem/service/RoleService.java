package tmmsystem.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tmmsystem.dto.RoleDto;
import tmmsystem.entity.Role;
import tmmsystem.mapper.RoleMapper;
import tmmsystem.repository.RoleRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RoleService {
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private RoleMapper roleMapper;
    
    public List<RoleDto> findAll() {
        List<Role> roles = roleRepository.findAll();
        return roles.stream()
                .map(roleMapper::toDto)
                .collect(Collectors.toList());
    }
    
    public Optional<RoleDto> findById(Long id) {
        return roleRepository.findById(id)
                .map(roleMapper::toDto);
    }
    
    public Optional<RoleDto> findByName(String name) {
        return roleRepository.findByName(name)
                .map(roleMapper::toDto);
    }
    
    public RoleDto save(RoleDto roleDto) {
        Role role = roleMapper.toEntity(roleDto);
        Role savedRole = roleRepository.save(role);
        return roleMapper.toDto(savedRole);
    }
    
    public Optional<RoleDto> update(Long id, RoleDto roleDto) {
        return roleRepository.findById(id)
                .map(existingRole -> {
                    existingRole.setName(roleDto.getName());
                    existingRole.setDescription(roleDto.getDescription());
                    Role updatedRole = roleRepository.save(existingRole);
                    return roleMapper.toDto(updatedRole);
                });
    }
    
    public boolean deleteById(Long id) {
        if (roleRepository.existsById(id)) {
            roleRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
