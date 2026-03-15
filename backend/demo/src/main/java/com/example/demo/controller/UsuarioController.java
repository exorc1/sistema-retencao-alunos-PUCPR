package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.model.*;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll()
                .stream()
                .map(UsuarioResponse::new)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody UsuarioRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username é obrigatório."));
        }
        if (request.getSenha() == null || request.getSenha().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Senha é obrigatória."));
        }
        if (request.getRole() == null || request.getRole().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Role é obrigatória."));
        }
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username já existe."));
        }

        Usuario u = new Usuario();
        u.setNome(request.getNome());
        u.setUsername(request.getUsername());
        u.setSenha(passwordEncoder.encode(request.getSenha()));
        u.setRole(Role.valueOf(request.getRole().toUpperCase()));
        u.setAtivo(request.getAtivo() == null ? true : request.getAtivo());

        return ResponseEntity.ok(new UsuarioResponse(usuarioRepository.save(u)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody UsuarioRequest request, Principal principal) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    if (request.getUsername() != null
                            && !request.getUsername().equalsIgnoreCase(u.getUsername())
                            && usuarioRepository.existsByUsername(request.getUsername())) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Username já existe."));
                    }

                    if (request.getNome() != null) {
                        u.setNome(request.getNome());
                    }
                    if (request.getUsername() != null && !request.getUsername().isBlank()) {
                        u.setUsername(request.getUsername());
                    }
                    if (request.getRole() != null && !request.getRole().isBlank()) {
                        u.setRole(Role.valueOf(request.getRole().toUpperCase()));
                    }
                    if (request.getAtivo() != null) {
                        if (principal != null && principal.getName().equals(u.getUsername()) && !request.getAtivo()) {
                            return ResponseEntity.badRequest().body(Map.of("message", "Você não pode desativar o próprio usuário."));
                        }
                        u.setAtivo(request.getAtivo());
                    }

                    return ResponseEntity.ok(new UsuarioResponse(usuarioRepository.save(u)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/senha")
    public ResponseEntity<?> trocarSenha(@PathVariable Long id, @RequestBody SenhaRequest request) {
        if (request.getNovaSenha() == null || request.getNovaSenha().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nova senha é obrigatória."));
        }

        return usuarioRepository.findById(id)
                .map(u -> {
                    u.setSenha(passwordEncoder.encode(request.getNovaSenha()));
                    usuarioRepository.save(u);
                    return ResponseEntity.ok(Map.of("message", "Senha atualizada com sucesso."));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long id, Principal principal) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    if (principal != null && principal.getName().equals(u.getUsername())) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Você não pode excluir o próprio usuário."));
                    }

                    usuarioRepository.delete(u);
                    return ResponseEntity.ok(Map.of("message", "Usuário removido."));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}