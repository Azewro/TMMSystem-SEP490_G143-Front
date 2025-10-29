package tmmsystem.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tmmsystem.entity.ProductCategory;
import tmmsystem.repository.ProductCategoryRepository;

import java.util.List;

@Service
public class ProductCategoryService {
    private final ProductCategoryRepository repository;

    public ProductCategoryService(ProductCategoryRepository repository) {
        this.repository = repository;
    }

    public List<ProductCategory> findAll() { return repository.findAll(); }
    public ProductCategory findById(Long id) { return repository.findById(id).orElseThrow(); }

    @Transactional
    public ProductCategory create(ProductCategory pc) {
        return repository.save(pc);
    }

    @Transactional
    public ProductCategory update(Long id, ProductCategory updated) {
        ProductCategory existing = repository.findById(id).orElseThrow();
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        return existing;
    }

    public void delete(Long id) { repository.deleteById(id); }
}


