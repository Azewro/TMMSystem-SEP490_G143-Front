package tmmsystem.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tmmsystem.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByCode(String code);
}


