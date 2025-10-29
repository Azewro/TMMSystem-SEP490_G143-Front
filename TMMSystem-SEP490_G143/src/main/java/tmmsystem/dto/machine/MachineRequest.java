package tmmsystem.dto.machine;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "MachineRequest")
public class MachineRequest {
    @NotBlank @Size(max = 50)
    @Schema(description = "Mã máy", example = "WEAVE-01", requiredMode = Schema.RequiredMode.REQUIRED)
    private String code;

    @NotBlank @Size(max = 255)
    @Schema(description = "Tên máy", example = "Weaving Machine #1", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @NotBlank @Size(max = 20)
    @Schema(description = "Loại", example = "WEAVING", requiredMode = Schema.RequiredMode.REQUIRED)
    private String type;

    @Size(max = 20)
    @Schema(description = "Trạng thái", example = "AVAILABLE")
    private String status;

    @Size(max = 100)
    @Schema(description = "Vị trí", example = "A1")
    private String location;

    @Schema(description = "Thông số (JSON)", example = "{\"speed\":120}")
    private String specifications;

    @Schema(description = "Ngày bảo trì gần nhất")
    private java.time.Instant lastMaintenanceAt;

    @Schema(description = "Ngày bảo trì kế tiếp")
    private java.time.Instant nextMaintenanceAt;

    @Schema(description = "Chu kỳ bảo trì (ngày)", example = "90")
    private Integer maintenanceIntervalDays;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getSpecifications() { return specifications; }
    public void setSpecifications(String specifications) { this.specifications = specifications; }
    public java.time.Instant getLastMaintenanceAt() { return lastMaintenanceAt; }
    public void setLastMaintenanceAt(java.time.Instant lastMaintenanceAt) { this.lastMaintenanceAt = lastMaintenanceAt; }
    public java.time.Instant getNextMaintenanceAt() { return nextMaintenanceAt; }
    public void setNextMaintenanceAt(java.time.Instant nextMaintenanceAt) { this.nextMaintenanceAt = nextMaintenanceAt; }
    public Integer getMaintenanceIntervalDays() { return maintenanceIntervalDays; }
    public void setMaintenanceIntervalDays(Integer maintenanceIntervalDays) { this.maintenanceIntervalDays = maintenanceIntervalDays; }
}


