package com.example.demo.config;

import com.example.demo.model.Role;
import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Value("${app.bootstrap.admin.username:admin}")
    private String adminUsername;

    @Value("${app.bootstrap.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.bootstrap.admin.nome:Administrador}")
    private String adminNome;

    @Bean
    CommandLineRunner initAdmin(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!usuarioRepository.existsByUsername(adminUsername)) {
                Usuario admin = new Usuario();
                admin.setNome(adminNome);
                admin.setUsername(adminUsername);
                admin.setSenha(passwordEncoder.encode(adminPassword));
                admin.setRole(Role.ADMIN);
                admin.setAtivo(true);
                usuarioRepository.save(admin);
            }
        };
    }
}