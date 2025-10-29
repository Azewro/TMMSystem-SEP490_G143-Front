package tmmsystem.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tmmsystem.entity.Customer;
import tmmsystem.entity.User;
import tmmsystem.repository.CustomerRepository;
import tmmsystem.repository.UserRepository;

import java.util.List;

@Service
public class CustomerService {
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final tmmsystem.util.JwtService jwtService;
    private final MailService mailService;
    private final String appBaseUrl;

    public CustomerService(CustomerRepository customerRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           tmmsystem.util.JwtService jwtService,
                           MailService mailService,
                           @Value("${app.base-url}") String appBaseUrl) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.appBaseUrl = appBaseUrl;
    }

    public List<Customer> findAll() { return customerRepository.findAll(); }
    public Customer findById(Long id) { return customerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Customer not found")); }
    public Customer findByEmailOrThrow(String email) { return customerRepository.findByEmail(email).orElseThrow(); }
    public boolean existsByEmail(String email) { return customerRepository.existsByEmail(email); }

    @Transactional
    public Customer create(Customer customer, Long createdByUserId) {
        if (createdByUserId != null) {
            User createdBy = userRepository.findById(createdByUserId).orElseThrow();
            customer.setCreatedBy(createdBy);
        }
        if (customer.getPassword() != null) {
            customer.setPassword(passwordEncoder.encode(customer.getPassword()));
        }
        return customerRepository.save(customer);
    }

    @Transactional
    public Customer update(Long id, Customer updated) {
        Customer existing = customerRepository.findById(id).orElseThrow();
        existing.setCompanyName(updated.getCompanyName());
        existing.setTaxCode(updated.getTaxCode());
        existing.setBusinessLicense(updated.getBusinessLicense());
        existing.setAddress(updated.getAddress());
        existing.setContactPerson(updated.getContactPerson());
        existing.setEmail(updated.getEmail());
        existing.setPhoneNumber(updated.getPhoneNumber());
        existing.setPosition(updated.getPosition());
        existing.setIndustry(updated.getIndustry());
        existing.setCustomerType(updated.getCustomerType());
        existing.setCreditLimit(updated.getCreditLimit());
        existing.setPaymentTerms(updated.getPaymentTerms());
        existing.setActive(updated.getActive());
        existing.setRegistrationType(updated.getRegistrationType());
        if (updated.getPassword() != null && !updated.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(updated.getPassword()));
        }
        return existing;
    }

    public void delete(Long id) { customerRepository.deleteById(id); }

    // ===== Customer portal auth =====
    public tmmsystem.dto.auth.CustomerLoginResponse authenticate(String email, String password) {
        return customerRepository.findByEmail(email)
                .filter(c -> Boolean.TRUE.equals(c.getActive()) && c.getPassword() != null && passwordEncoder.matches(password, c.getPassword()))
                .map(c -> {
                    String token = jwtService.generateToken(c.getEmail(), java.util.Map.of(
                            "cid", c.getId(),
                            "role", "CUSTOMER"
                    ));
                    long expiresIn = jwtService.getExpirationMillis();
                    return new tmmsystem.dto.auth.CustomerLoginResponse(
                            c.getContactPerson(),
                            c.getEmail(),
                            "CUSTOMER",
                            Boolean.TRUE.equals(c.getActive()),
                            token,
                            expiresIn,
                            c.getId(),
                            c.getCompanyName()
                    );
                })
                .orElse(null);
    }

    public Long getCustomerIdFromToken(String token) {
        try {
            io.jsonwebtoken.Claims claims = jwtService.parseToken(token);
            String email = claims.getSubject();
            return customerRepository.findByEmail(email)
                    .map(Customer::getId)
                    .orElseThrow(() -> new RuntimeException("Token không hợp lệ"));
        } catch (Exception ex) {
            throw new RuntimeException("Token không hợp lệ: " + ex.getMessage());
        }
    }

    public Customer getCustomerFromToken(String token) {
        try {
            io.jsonwebtoken.Claims claims = jwtService.parseToken(token);
            String email = claims.getSubject();
            return customerRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Customer not found for token"));
        } catch (Exception ex) {
            throw new RuntimeException("Token không hợp lệ: " + ex.getMessage());
        }
    }

    

    @Transactional
    public void requestPasswordReset(tmmsystem.dto.auth.ForgotPasswordRequest request) {
        Customer customer = customerRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!Boolean.TRUE.equals(customer.getActive())) {
            throw new RuntimeException("User is inactive");
        }
        String code = generateNumericCode(6);
        customer.setPasswordResetToken(code);
        customer.setPasswordResetExpiresAt(java.time.Instant.now().plus(java.time.Duration.ofMinutes(10)));
        customerRepository.save(customer);
        mailService.send(customer.getEmail(), "Password Reset Code", "Your verification code is: " + code + "\nThis code expires in 10 minutes.");
    }

    @Transactional
    public void verifyCodeAndResetPassword(tmmsystem.dto.auth.VerifyResetCodeRequest request) {
        Customer customer = customerRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (customer.getPasswordResetToken() == null || !customer.getPasswordResetToken().equals(request.code())) {
            throw new RuntimeException("Invalid or used code");
        }
        if (customer.getPasswordResetExpiresAt() == null || java.time.Instant.now().isAfter(customer.getPasswordResetExpiresAt())) {
            throw new RuntimeException("Reset code expired");
        }
        String newPasswordPlain = generateRandomPassword(10);
        customer.setPassword(passwordEncoder.encode(newPasswordPlain));
        customer.setPasswordResetToken(null);
        customer.setPasswordResetExpiresAt(null);
        customerRepository.save(customer);
        mailService.send(customer.getEmail(), "Your new password", "Your new password is: " + newPasswordPlain);
    }

    @Transactional
    public void changePassword(tmmsystem.dto.auth.ChangePasswordRequest request) {
        Customer customer = customerRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!Boolean.TRUE.equals(customer.getActive())) {
            throw new RuntimeException("User is inactive");
        }
        if (customer.getPassword() == null || !passwordEncoder.matches(request.currentPassword(), customer.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (request.newPassword() == null || request.newPassword().isBlank()) {
            throw new RuntimeException("New password must not be empty");
        }
        customer.setPassword(passwordEncoder.encode(request.newPassword()));
        customerRepository.save(customer);
    }

    private String generateNumericCode(int length) {
        java.security.SecureRandom random = new java.security.SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) { sb.append(random.nextInt(10)); }
        return sb.toString();
    }

    private String generateRandomPassword(int length) {
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%";
        java.security.SecureRandom random = new java.security.SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) { sb.append(chars.charAt(random.nextInt(chars.length()))); }
        return sb.toString();
    }
}


