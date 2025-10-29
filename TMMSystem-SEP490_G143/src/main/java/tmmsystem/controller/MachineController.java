package tmmsystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import tmmsystem.dto.MachineDto;
import tmmsystem.dto.machine.MachineRequest;
import tmmsystem.mapper.MachineMapper;
import tmmsystem.service.MachineService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/machines")
@Validated
public class MachineController {
    private final MachineService service;
    private final MachineMapper mapper;
    public MachineController(MachineService service, MachineMapper mapper) { this.service = service; this.mapper = mapper; }

    @GetMapping
    public List<MachineDto> list() { return service.findAll().stream().map(mapper::toDto).collect(Collectors.toList()); }

    @GetMapping("/{id}")
    public MachineDto get(@PathVariable Long id) { return mapper.toDto(service.findById(id)); }

    @Operation(summary = "Tạo máy")
    @PostMapping
    public MachineDto create(
            @RequestBody(description = "Payload tạo máy", required = true,
                    content = @Content(schema = @Schema(implementation = MachineRequest.class)))
            @Valid @org.springframework.web.bind.annotation.RequestBody MachineRequest body) {
        tmmsystem.entity.Machine e = new tmmsystem.entity.Machine();
        e.setCode(body.getCode());
        e.setName(body.getName());
        e.setType(body.getType());
        e.setStatus(body.getStatus() != null ? body.getStatus() : "AVAILABLE");
        e.setLocation(body.getLocation());
        e.setSpecifications(body.getSpecifications());
        e.setLastMaintenanceAt(body.getLastMaintenanceAt());
        e.setNextMaintenanceAt(body.getNextMaintenanceAt());
        e.setMaintenanceIntervalDays(body.getMaintenanceIntervalDays() != null ? body.getMaintenanceIntervalDays() : 90);
        return mapper.toDto(service.create(e));
    }

    @Operation(summary = "Cập nhật máy")
    @PutMapping("/{id}")
    public MachineDto update(
            @PathVariable Long id,
            @RequestBody(description = "Payload cập nhật máy", required = true,
                    content = @Content(schema = @Schema(implementation = MachineRequest.class)))
            @Valid @org.springframework.web.bind.annotation.RequestBody MachineRequest body) {
        tmmsystem.entity.Machine e = new tmmsystem.entity.Machine();
        e.setCode(body.getCode());
        e.setName(body.getName());
        e.setType(body.getType());
        e.setStatus(body.getStatus());
        e.setLocation(body.getLocation());
        e.setSpecifications(body.getSpecifications());
        e.setLastMaintenanceAt(body.getLastMaintenanceAt());
        e.setNextMaintenanceAt(body.getNextMaintenanceAt());
        e.setMaintenanceIntervalDays(body.getMaintenanceIntervalDays());
        return mapper.toDto(service.update(id, e));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}


