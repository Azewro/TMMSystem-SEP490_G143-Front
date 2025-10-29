package tmmsystem.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tmmsystem.dto.ProductCategoryDto;
import tmmsystem.dto.product.ProductCategoryRequest;
import tmmsystem.mapper.ProductCategoryMapper;
import tmmsystem.service.ProductCategoryService;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/product-categories")
public class ProductCategoryController {
    private final ProductCategoryService service;
    private final ProductCategoryMapper mapper;
    public ProductCategoryController(ProductCategoryService service, ProductCategoryMapper mapper) { this.service = service; this.mapper = mapper; }

    @GetMapping
    public List<ProductCategoryDto> list() { return service.findAll().stream().map(mapper::toDto).collect(Collectors.toList()); }

    @GetMapping("/{id}")
    public ProductCategoryDto get(@PathVariable Long id) { return mapper.toDto(service.findById(id)); }

    @Operation(summary = "Tạo danh mục sản phẩm")
    @PostMapping
    public ProductCategoryDto create(
            @RequestBody(description = "Payload tạo danh mục", required = true,
                    content = @Content(schema = @Schema(implementation = ProductCategoryRequest.class)))
            @org.springframework.web.bind.annotation.RequestBody ProductCategoryRequest body) {
        tmmsystem.entity.ProductCategory pc = new tmmsystem.entity.ProductCategory();
        pc.setName(body.getName());
        pc.setDescription(body.getDescription());
        pc.setDisplayOrder(body.getDisplayOrder() != null ? body.getDisplayOrder() : 0);
        pc.setActive(body.getActive() != null ? body.getActive() : true);
        // parent sẽ set ở service nếu cần (id -> entity)
        return mapper.toDto(service.create(pc));
    }

    @Operation(summary = "Cập nhật danh mục sản phẩm")
    @PutMapping("/{id}")
    public ProductCategoryDto update(
            @PathVariable Long id,
            @RequestBody(description = "Payload cập nhật danh mục", required = true,
                    content = @Content(schema = @Schema(implementation = ProductCategoryRequest.class)))
            @org.springframework.web.bind.annotation.RequestBody ProductCategoryRequest body) {
        tmmsystem.entity.ProductCategory pc = new tmmsystem.entity.ProductCategory();
        pc.setName(body.getName());
        pc.setDescription(body.getDescription());
        pc.setDisplayOrder(body.getDisplayOrder());
        pc.setActive(body.getActive());
        return mapper.toDto(service.update(id, pc));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}


