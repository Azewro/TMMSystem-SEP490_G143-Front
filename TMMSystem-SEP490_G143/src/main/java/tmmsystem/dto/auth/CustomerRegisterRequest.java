package tmmsystem.dto.auth;

import jakarta.validation.constraints.*;

public record CustomerRegisterRequest(
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        @Size(max = 150, message = "Email không được quá 150 ký tự")
        String email,
        
        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6-100 ký tự")
        @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{6,100}$", 
                 message = "Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số")
        String password
) {}


