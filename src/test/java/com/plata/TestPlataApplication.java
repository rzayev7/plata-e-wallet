package com.plata;

import org.springframework.boot.SpringApplication;

public class TestPlataApplication {

    public static void main(String[] args) {
        SpringApplication.from(PlataApplication::main).with(TestcontainersConfiguration.class).run(args);
    }

}
