package tmmsystem.dto;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String email;
    private String name;
    private String phoneNumber;
    private String avatar;
    private Boolean isActive;
    private Boolean isVerified;
    private String roleName;
}
