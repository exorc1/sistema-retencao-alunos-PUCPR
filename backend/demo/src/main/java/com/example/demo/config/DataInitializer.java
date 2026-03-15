package com.example.demo.config;

import com.example.demo.model.Role;
import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initAdmin(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!usuarioRepository.existsByUsername("admin")) {
                Usuario admin = new Usuario();
                admin.setNome("Administrador");
                admin.setUsername("admin");
                admin.setSenha(passwordEncoder.encode("admin123"));
                admin.setRole(Role.ADMIN);
                admin.setAtivo(true);
                usuarioRepository.save(admin);
            }
        };
    }
}