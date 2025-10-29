package tmmsystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import tmmsystem.dto.inventory.*;
import tmmsystem.entity.*;
import tmmsystem.mapper.InventoryMapper;
import tmmsystem.service.InventoryService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/inventory")
@Validated
public class InventoryController {
    private final InventoryService service;
    private final InventoryMapper mapper;

    public InventoryController(InventoryService service, InventoryMapper mapper) { this.service = service; this.mapper = mapper; }

    // Material Stock
    @GetMapping("/materials/{materialId}/stock")
    public List<MaterialStockDto> listMaterialStock(@PathVariable Long materialId) { return service.listMaterialStock(materialId).stream().map(mapper::toDto).collect(Collectors.toList()); }
    @GetMapping("/material-stock/{id}")
    public MaterialStockDto getMaterialStock(@PathVariable Long id) { return mapper.toDto(service.getMaterialStock(id)); }
    @Operation(summary = "Upsert material stock")
    @PostMapping("/material-stock")
    public MaterialStockDto upsertMaterialStock(
            @RequestBody(description = "Payload stock", required = true,
                    content = @Content(schema = @Schema(implementation = MaterialStockDto.class)))
            @Valid @org.springframework.web.bind.annotation.RequestBody MaterialStockDto body) {
        MaterialStock s = new MaterialStock();
        if (body.getMaterialId() != null) { Material m = new Material(); m.setId(body.getMaterialId()); s.setMaterial(m); }
        s.setQuantity(body.getQuantity()); s.setUnit(body.getUnit()); s.setLocation(body.getLocation()); s.setBatchNumber(body.getBatchNumber()); s.setReceivedDate(body.getReceivedDate()); s.setExpiryDate(body.getExpiryDate());
        return mapper.toDto(service.upsertMaterialStock(s));
    }
    @DeleteMapping("/material-stock/{id}")
    public void deleteMaterialStock(@PathVariable Long id) { service.deleteMaterialStock(id); }

    // Material Transactions
    @GetMapping("/materials/{materialId}/transactions")
    public List<MaterialTransactionDto> listMaterialTxns(@PathVariable Long materialId) { return service.listMaterialTxns(materialId).stream().map(mapper::toDto).collect(Collectors.toList()); }
    @GetMapping("/material-transactions/{id}")
    public MaterialTransactionDto getMaterialTxn(@PathVariable Long id) { return mapper.toDto(service.getMaterialTxn(id)); }
    @Operation(summary = "Create material transaction")
    @PostMapping("/material-transactions")
    public MaterialTransactionDto createMaterialTxn(
            @RequestBody(description = "Payload transaction", required = true,
                    content = @Content(schema = @Schema(implementation = MaterialTransactionDto.class)))
            @Valid @org.springframework.web.bind.annotation.RequestBody MaterialTransactionDto body) {
        MaterialTransaction t = new MaterialTransaction();
        if (body.getMaterialId() != null) { Material m = new Material(); m.setId(body.getMaterialId()); t.setMaterial(m); }
        t.setTransactionType(body.getTransactionType()); t.setQuantity(body.getQuantity()); t.setUnit(body.getUnit());
        t.setReferenceType(body.getReferenceType()); t.setReferenceId(body.getReferenceId()); t.setBatchNumber(body.getBatchNumber()); t.setLocation(body.getLocation()); t.setNotes(body.getNotes());
        if (body.getCreatedById() != null) { User u = new User(); u.setId(body.getCreatedById()); t.setCreatedBy(u); }
        return mapper.toDto(service.createMaterialTxn(t));
    }

    // Finished Goods Stock
    @GetMapping("/products/{productId}/stock")
    public List<FinishedGoodsStockDto> listFgStock(@PathVariable Long productId) { return service.listFgStock(productId).stream().map(mapper::toDto).collect(Collectors.toList()); }
    @GetMapping("/fg-stock/{id}")
    public FinishedGoodsStockDto getFgStock(@PathVariable Long id) { return mapper.toDto(service.getFgStock(id)); }
    @Operation(summary = "Upsert FG stock")
    @PostMapping("/fg-stock")
    public FinishedGoodsStockDto upsertFgStock(
            @RequestBody(description = "Payload FG stock", required = true,
                    content = @Content(schema = @Schema(implementation = FinishedGoodsStockDto.class)))
            @org.springframework.web.bind.annotation.RequestBody FinishedGoodsStockDto body) {
        FinishedGoodsStock s = new FinishedGoodsStock();
        if (body.getProductId() != null) { Product p = new Product(); p.setId(body.getProductId()); s.setProduct(p); }
        s.setQuantity(body.getQuantity()); s.setUnit(body.getUnit()); s.setLocation(body.getLocation()); s.setBatchNumber(body.getBatchNumber()); s.setProductionDate(body.getProductionDate()); s.setQualityGrade(body.getQualityGrade());
        if (body.getQcInspectionId() != null) { QcInspection qc = new QcInspection(); qc.setId(body.getQcInspectionId()); s.setQcInspection(qc); }
        return mapper.toDto(service.upsertFgStock(s));
    }
    @DeleteMapping("/fg-stock/{id}")
    public void deleteFgStock(@PathVariable Long id) { service.deleteFgStock(id); }

    // Finished Goods Transactions
    @GetMapping("/products/{productId}/transactions")
    public List<FinishedGoodsTransactionDto> listFgTxns(@PathVariable Long productId) { return service.listFgTxns(productId).stream().map(mapper::toDto).collect(Collectors.toList()); }
    @GetMapping("/fg-transactions/{id}")
    public FinishedGoodsTransactionDto getFgTxn(@PathVariable Long id) { return mapper.toDto(service.getFgTxn(id)); }
    @Operation(summary = "Create FG transaction")
    @PostMapping("/fg-transactions")
    public FinishedGoodsTransactionDto createFgTxn(
            @RequestBody(description = "Payload FG txn", required = true,
                    content = @Content(schema = @Schema(implementation = FinishedGoodsTransactionDto.class)))
            @org.springframework.web.bind.annotation.RequestBody FinishedGoodsTransactionDto body) {
        FinishedGoodsTransaction t = new FinishedGoodsTransaction();
        if (body.getProductId() != null) { Product p = new Product(); p.setId(body.getProductId()); t.setProduct(p); }
        t.setTransactionType(body.getTransactionType()); t.setQuantity(body.getQuantity()); t.setUnit(body.getUnit());
        t.setReferenceType(body.getReferenceType()); t.setReferenceId(body.getReferenceId()); t.setBatchNumber(body.getBatchNumber()); t.setLocation(body.getLocation()); t.setQualityGrade(body.getQualityGrade()); t.setNotes(body.getNotes());
        if (body.getCreatedById() != null) { User u = new User(); u.setId(body.getCreatedById()); t.setCreatedBy(u); }
        return mapper.toDto(service.createFgTxn(t));
    }
}


