package tmmsystem.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tmmsystem.entity.Payment;
import tmmsystem.entity.PaymentTerm;
import tmmsystem.repository.PaymentRepository;
import tmmsystem.repository.PaymentTermRepository;

import java.util.List;

@Service
public class PaymentService {
    private final PaymentTermRepository termRepository;
    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentTermRepository termRepository, PaymentRepository paymentRepository) {
        this.termRepository = termRepository;
        this.paymentRepository = paymentRepository;
    }

    // Terms
    public List<PaymentTerm> findTermsByContract(Long contractId) { return termRepository.findByContractIdOrderByTermSequenceAsc(contractId); }
    public PaymentTerm findTerm(Long id) { return termRepository.findById(id).orElseThrow(); }

    @Transactional
    public PaymentTerm createTerm(PaymentTerm t) { return termRepository.save(t); }

    @Transactional
    public PaymentTerm updateTerm(Long id, PaymentTerm updated) {
        PaymentTerm existing = termRepository.findById(id).orElseThrow();
        existing.setContract(updated.getContract());
        existing.setTermSequence(updated.getTermSequence());
        existing.setTermName(updated.getTermName());
        existing.setPercentage(updated.getPercentage());
        existing.setAmount(updated.getAmount());
        existing.setDueDate(updated.getDueDate());
        existing.setDescription(updated.getDescription());
        return existing;
    }

    public void deleteTerm(Long id) { termRepository.deleteById(id); }

    // Payments
    public List<Payment> findPaymentsByContract(Long contractId) { return paymentRepository.findByContractIdOrderByPaymentDateAsc(contractId); }
    public Payment findPayment(Long id) { return paymentRepository.findById(id).orElseThrow(); }

    @Transactional
    public Payment createPayment(Payment p) { return paymentRepository.save(p); }

    @Transactional
    public Payment updatePayment(Long id, Payment updated) {
        Payment existing = paymentRepository.findById(id).orElseThrow();
        existing.setContract(updated.getContract());
        existing.setPaymentTerm(updated.getPaymentTerm());
        existing.setPaymentType(updated.getPaymentType());
        existing.setAmount(updated.getAmount());
        existing.setPaymentDate(updated.getPaymentDate());
        existing.setPaymentMethod(updated.getPaymentMethod());
        existing.setPaymentReference(updated.getPaymentReference());
        existing.setStatus(updated.getStatus());
        existing.setInvoiceNumber(updated.getInvoiceNumber());
        existing.setReceiptFilePath(updated.getReceiptFilePath());
        existing.setNotes(updated.getNotes());
        existing.setCreatedBy(updated.getCreatedBy());
        existing.setVerifiedBy(updated.getVerifiedBy());
        existing.setVerifiedAt(updated.getVerifiedAt());
        return existing;
    }

    public void deletePayment(Long id) { paymentRepository.deleteById(id); }
}


