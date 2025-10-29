package tmmsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableAsync;


@EnableAsync
@SpringBootApplication
@ComponentScan(basePackages = "tmmsystem")
public class TmmSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(TmmSystemApplication.class, args);
    }

}
