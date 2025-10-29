package tmmsystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import tmmsystem.dto.product.*;
import tmmsystem.entity.*;
import tmmsystem.mapper.ProductMapper;
import tmmsystem.service.ProductService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/products")
@Validated
public class ProductController {
    private final ProductService service;
    private final ProductMapper mapper;

    public ProductController(ProductService service, ProductMapper mapper) { this.service = service; this.mapper = mapper; }

    // Products
    @GetMapping
    public List<ProductDto> listProducts() { return service.listProducts().stream().map(mapper::toDto).collect(Collectors.toList()); }
    @GetMapping("/{id}")
    public ProductDto getProduct(@PathVariable Long id) { return mapper.toDto(service.getProduct(id)); }
    @Operation(summary = "Tạo Product")
    @PostMapping
    public ProductDto createProduct(
            @RequestBody(description = "Payload tạo product", required = true,
                    content = @Content(schema = @Schema(implementation = ProductDto.class)))
            @Valid @org.springframework.web.bind.annotation.RequestBody ProductDto body) {
        Product e = new Product();
        e.setCode(body.getCode()); e.setName(body.getName()); e.setDescription(body.getDescription());
        if (body.getCategoryId() != null) { ProductCategory c = new ProductCategory(); c.setId(body.getCategoryId()); e.setCategory(c); }
        e.setUnit(body.getUnit()); e.setStandardWeight(body.getStandardWeight()); e.setStandardDimensions(body.getStandardDimensions());
        e.setBasePrice(body.getBasePrice()); e.setActive(body.getIsActive());
        return mapper.toDto(service.createProduct(e));
    }
    @PutMapping("/{id}")
    public ProductDto updateProduct(@PathVariable Long id, @Valid @RequestBody ProductDto body) {
        Product e = new Product();
        e.setCode(body.getCode()); e.setName(body.getName()); e.setDescription(body.getDescription());
        if (body.getCategoryId() != null) { ProductCategory c = new ProductCategory(); c.setId(body.getCategoryId()); e.setCategory(c); }
        e.setUnit(body.getUnit()); e.setStandardWeight(body.getStandardWeight()); e.setStandardDimensions(body.getStandardDimensions());
        e.setBasePrice(body.getBasePrice()); e.setActive(body.getIsActive());
        return mapper.toDto(service.updateProduct(id, e));
    }
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id) { service.deleteProduct(id); }

    // Materials
    @GetMapping("/materials")
    public List<MaterialDto> listMaterials() { return service.listMaterials().stream().map(mapper::toDto).collect(Collectors.toList()); }
    @GetMapping("/materials/{id}")
    public MaterialDto getMaterial(@PathVariable Long id) { return mapper.toDto(service.getMaterial(id)); }
    @Operation(summary = "Tạo Material")
    @PostMapping("/materials")
    public MaterialDto createMaterial(
            @RequestBody(description = "Payload tạo material", required = true,
                    content = @Content(schema = @Schema(implementation = MaterialDto.class)))
            @org.springframework.web.bind.annotation.RequestBody MaterialDto body) {
        Material e = new Material();
        e.setCode(body.getCode()); e.setName(body.getName()); e.setType(body.getType()); e.setUnit(body.getUnit());
        e.setReorderPoint(body.getReorderPoint()); e.setStandardCost(body.getStandardCost()); e.setActive(body.getIsActive());
        return mapper.toDto(service.createMaterial(e));
    }
    @PutMapping("/materials/{id}")
    public MaterialDto updateMaterial(@PathVariable Long id, @RequestBody MaterialDto body) {
        Material e = new Material();
        e.setCode(body.getCode()); e.setName(body.getName()); e.setType(body.getType()); e.setUnit(body.getUnit());
        e.setReorderPoint(body.getReorderPoint()); e.setStandardCost(body.getStandardCost()); e.setActive(body.getIsActive());
        return mapper.toDto(service.updateMaterial(id, e));
    }
    @DeleteMapping("/materials/{id}")
    public void deleteMaterial(@PathVariable Long id) { service.deleteMaterial(id); }

    // BOMs
    @GetMapping("/{productId}/boms")
    public List<BomDto> listBoms(@PathVariable Long productId) { return service.listBomsByProduct(productId).stream().map(mapper::toDto).collect(Collectors.toList()); }
    @GetMapping("/boms/{id}")
    public BomDto getBom(@PathVariable Long id) { return mapper.toDto(service.getBom(id)); }
    @Operation(summary = "Tạo BOM")
    @PostMapping("/boms")
    public BomDto createBom(
            @RequestBody(description = "Payload tạo BOM", required = true,
                    content = @Content(schema = @Schema(implementation = BomDto.class)))
            @org.springframework.web.bind.annotation.RequestBody BomDto body) {
        Bom e = new Bom();
        if (body.getProductId() != null) { Product p = new Product(); p.setId(body.getProductId()); e.setProduct(p); }
        e.setVersion(body.getVersion()); e.setVersionNotes(body.getVersionNotes()); e.setActive(body.getIsActive());
        e.setEffectiveDate(body.getEffectiveDate()); e.setObsoleteDate(body.getObsoleteDate());
        if (body.getCreatedById() != null) { User u = new User(); u.setId(body.getCreatedById()); e.setCreatedBy(u); }
        return mapper.toDto(service.createBom(e));
    }
    @PutMapping("/boms/{id}")
    public BomDto updateBom(@PathVariable Long id, @RequestBody BomDto body) {
        Bom e = new Bom();
        if (body.getProductId() != null) { Product p = new Product(); p.setId(body.getProductId()); e.setProduct(p); }
        e.setVersion(body.getVersion()); e.setVersionNotes(body.getVersionNotes()); e.setActive(body.getIsActive());
        e.setEffectiveDate(body.getEffectiveDate()); e.setObsoleteDate(body.getObsoleteDate());
        if (body.getCreatedById() != null) { User u = new User(); u.setId(body.getCreatedById()); e.setCreatedBy(u); }
        return mapper.toDto(service.updateBom(id, e));
    }
    @DeleteMapping("/boms/{id}")
    public void deleteBom(@PathVariable Long id) { service.deleteBom(id); }

    // BOM Details
    @GetMapping("/boms/{bomId}/details")
    public List<BomDetailDto> listBomDetails(@PathVariable Long bomId) { return service.listBomDetails(bomId).stream().map(mapper::toDto).collect(Collectors.toList()); }
    @GetMapping("/bom-details/{id}")
    public BomDetailDto getBomDetail(@PathVariable Long id) { return mapper.toDto(service.getBomDetail(id)); }
    @Operation(summary = "Thêm BOM Detail")
    @PostMapping("/bom-details")
    public BomDetailDto createBomDetail(
            @RequestBody(description = "Payload tạo BOM detail", required = true,
                    content = @Content(schema = @Schema(implementation = BomDetailDto.class)))
            @org.springframework.web.bind.annotation.RequestBody BomDetailDto body) {
        BomDetail e = new BomDetail();
        if (body.getBomId() != null) { Bom b = new Bom(); b.setId(body.getBomId()); e.setBom(b); }
        if (body.getMaterialId() != null) { Material m = new Material(); m.setId(body.getMaterialId()); e.setMaterial(m); }
        e.setQuantity(body.getQuantity()); e.setUnit(body.getUnit()); e.setStage(body.getStage()); e.setOptional(body.getIsOptional()); e.setNotes(body.getNotes());
        return mapper.toDto(service.createBomDetail(e));
    }
    @PutMapping("/bom-details/{id}")
    public BomDetailDto updateBomDetail(@PathVariable Long id, @RequestBody BomDetailDto body) {
        BomDetail e = new BomDetail();
        if (body.getBomId() != null) { Bom b = new Bom(); b.setId(body.getBomId()); e.setBom(b); }
        if (body.getMaterialId() != null) { Material m = new Material(); m.setId(body.getMaterialId()); e.setMaterial(m); }
        e.setQuantity(body.getQuantity()); e.setUnit(body.getUnit()); e.setStage(body.getStage()); e.setOptional(body.getIsOptional()); e.setNotes(body.getNotes());
        return mapper.toDto(service.updateBomDetail(id, e));
    }
    @DeleteMapping("/bom-details/{id}")
    public void deleteBomDetail(@PathVariable Long id) { service.deleteBomDetail(id); }
}


