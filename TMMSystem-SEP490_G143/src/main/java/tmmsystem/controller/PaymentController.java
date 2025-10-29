package tmmsystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.springframework.web.bind.annotation.*;
import tmmsystem.dto.sales.PaymentDto;
import tmmsystem.dto.sales.PaymentTermDto;
import tmmsystem.entity.*;
import tmmsystem.mapper.PaymentMapper;
import tmmsystem.service.PaymentService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/payments")
public class PaymentController {
    private final PaymentService service;
    private final PaymentMapper mapper;

    public PaymentController(PaymentService service, PaymentMapper mapper) { this.service = service; this.mapper = mapper; }

    // Terms
    @GetMapping("/contracts/{contractId}/terms")
    public List<PaymentTermDto> listTerms(@PathVariable Long contractId) {
        return service.findTermsByContract(contractId).stream().map(mapper::toDto).collect(Collectors.toList());
    }

    @GetMapping("/terms/{id}")
    public PaymentTermDto getTerm(@PathVariable Long id) { return mapper.toDto(service.findTerm(id)); }

    @Operation(summary = "Tạo điều khoản thanh toán")
    @PostMapping("/terms")
    public PaymentTermDto createTerm(
            @RequestBody(description = "Payload tạo điều khoản", required = true,
                    content = @Content(schema = @Schema(implementation = PaymentTermDto.class)))
            @org.springframework.web.bind.annotation.RequestBody PaymentTermDto body) {
        PaymentTerm t = new PaymentTerm();
        if (body.getContractId() != null) { Contract c = new Contract(); c.setId(body.getContractId()); t.setContract(c); }
        t.setTermSequence(body.getTermSequence());
        t.setTermName(body.getTermName());
        t.setPercentage(body.getPercentage());
        t.setAmount(body.getAmount());
        t.setDueDate(body.getDueDate());
        t.setDescription(body.getDescription());
        return mapper.toDto(service.createTerm(t));
    }

    @Operation(summary = "Cập nhật điều khoản thanh toán")
    @PutMapping("/terms/{id}")
    public PaymentTermDto updateTerm(
            @PathVariable Long id,
            @RequestBody(description = "Payload cập nhật điều khoản", required = true,
                    content = @Content(schema = @Schema(implementation = PaymentTermDto.class)))
            @org.springframework.web.bind.annotation.RequestBody PaymentTermDto body) {
        PaymentTerm t = new PaymentTerm();
        if (body.getContractId() != null) { Contract c = new Contract(); c.setId(body.getContractId()); t.setContract(c); }
        t.setTermSequence(body.getTermSequence());
        t.setTermName(body.getTermName());
        t.setPercentage(body.getPercentage());
        t.setAmount(body.getAmount());
        t.setDueDate(body.getDueDate());
        t.setDescription(body.getDescription());
        return mapper.toDto(service.updateTerm(id, t));
    }

    @DeleteMapping("/terms/{id}")
    public void deleteTerm(@PathVariable Long id) { service.deleteTerm(id); }

    // Payments
    @GetMapping("/contracts/{contractId}")
    public List<PaymentDto> listPayments(@PathVariable Long contractId) {
        return service.findPaymentsByContract(contractId).stream().map(mapper::toDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public PaymentDto getPayment(@PathVariable Long id) { return mapper.toDto(service.findPayment(id)); }

    @Operation(summary = "Ghi nhận thanh toán")
    @PostMapping
    public PaymentDto createPayment(
            @RequestBody(description = "Payload tạo thanh toán", required = true,
                    content = @Content(schema = @Schema(implementation = PaymentDto.class)))
            @org.springframework.web.bind.annotation.RequestBody PaymentDto body) {
        Payment p = new Payment();
        if (body.getContractId() != null) { Contract c = new Contract(); c.setId(body.getContractId()); p.setContract(c); }
        if (body.getPaymentTermId() != null) { PaymentTerm t = new PaymentTerm(); t.setId(body.getPaymentTermId()); p.setPaymentTerm(t); }
        p.setPaymentType(body.getPaymentType());
        p.setAmount(body.getAmount());
        p.setPaymentDate(body.getPaymentDate());
        p.setPaymentMethod(body.getPaymentMethod());
        p.setPaymentReference(body.getPaymentReference());
        p.setStatus(body.getStatus());
        p.setInvoiceNumber(body.getInvoiceNumber());
        p.setReceiptFilePath(body.getReceiptFilePath());
        p.setNotes(body.getNotes());
        return mapper.toDto(service.createPayment(p));
    }

    @Operation(summary = "Cập nhật thanh toán")
    @PutMapping("/{id}")
    public PaymentDto updatePayment(
            @PathVariable Long id,
            @RequestBody(description = "Payload cập nhật thanh toán", required = true,
                    content = @Content(schema = @Schema(implementation = PaymentDto.class)))
            @org.springframework.web.bind.annotation.RequestBody PaymentDto body) {
        Payment p = new Payment();
        if (body.getContractId() != null) { Contract c = new Contract(); c.setId(body.getContractId()); p.setContract(c); }
        if (body.getPaymentTermId() != null) { PaymentTerm t = new PaymentTerm(); t.setId(body.getPaymentTermId()); p.setPaymentTerm(t); }
        p.setPaymentType(body.getPaymentType());
        p.setAmount(body.getAmount());
        p.setPaymentDate(body.getPaymentDate());
        p.setPaymentMethod(body.getPaymentMethod());
        p.setPaymentReference(body.getPaymentReference());
        p.setStatus(body.getStatus());
        p.setInvoiceNumber(body.getInvoiceNumber());
        p.setReceiptFilePath(body.getReceiptFilePath());
        p.setNotes(body.getNotes());
        return mapper.toDto(service.updatePayment(id, p));
    }

    @DeleteMapping("/{id}")
    public void deletePayment(@PathVariable Long id) { service.deletePayment(id); }
}


