package tmmsystem.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

@Schema(name = "UpdateUserRequest")
public class UpdateUserRequest {
    @Schema(description = "Tên hiển thị", example = "User Name")
    private String name;

    @Schema(description = "SĐT", example = "0123456789")
    private String phoneNumber;

    @Schema(description = "Ảnh đại diện URL", example = "https://...")
    private String avatar;

    @Schema(description = "Trạng thái kích hoạt")
    private Boolean active;

    @Schema(description = "Trạng thái xác minh")
    private Boolean verified;

    @Size(min = 0, max = 100)
    @Schema(description = "Mật khẩu mới (tùy chọn)", example = "NewPass1")
    private String password;

    @Schema(description = "Role ID mới (tùy chọn)", example = "2")
    private Long roleId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Boolean getVerified() { return verified; }
    public void setVerified(Boolean verified) { this.verified = verified; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Long getRoleId() { return roleId; }
    public void setRoleId(Long roleId) { this.roleId = roleId; }
}


