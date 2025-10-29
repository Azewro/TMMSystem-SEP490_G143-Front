// dto/auth/ChangePasswordRequest.java
package tmmsystem.dto.auth;

public record ChangePasswordRequest(String email, String currentPassword, String newPassword) {}


