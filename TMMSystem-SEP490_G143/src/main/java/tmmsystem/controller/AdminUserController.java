// controller/AdminUserController.java
package tmmsystem.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tmmsystem.entity.User;
import tmmsystem.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/v1/admin/users")
public class AdminUserController {
    private final UserService userService;
    public AdminUserController(UserService s){ this.userService = s; }

    @GetMapping public List<User> all(){ return userService.findAll(); }

    @PatchMapping("/{id}/active")
    public ResponseEntity<?> setActive(@PathVariable Long id, @RequestParam boolean value){
        userService.setActive(id, value);
        return ResponseEntity.ok().build();
    }
}
