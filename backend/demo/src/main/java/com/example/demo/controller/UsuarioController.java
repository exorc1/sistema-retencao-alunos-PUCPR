package com.example.demo.controller;

import com.example.demo.dto.UsuarioRequest;
import com.example.demo.model.Role;
import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    public List<Usuario> listar() {
        return usuarioRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody UsuarioRequest request) {
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username já existe."));
        }

        Usuario u = new Usuario();
        u.setNome(request.getNome());
        u.setUsername(request.getUsername());
        u.setSenha(passwordEncoder.encode(request.getSenha()));
        u.setRole(Role.valueOf(request.getRole().toUpperCase()));
        u.setAtivo(request.getAtivo() == null ? true : request.getAtivo());

        return ResponseEntity.ok(usuarioRepository.save(u));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody UsuarioRequest request) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    u.setNome(request.getNome());
                    u.setUsername(request.getUsername());
                    u.setRole(Role.valueOf(request.getRole().toUpperCase()));
                    u.setAtivo(request.getAtivo() == null ? u.getAtivo() : request.getAtivo());

                    if (request.getSenha() != null && !request.getSenha().isBlank()) {
                        u.setSenha(passwordEncoder.encode(request.getSenha()));
                    }

                    return ResponseEntity.ok(usuarioRepository.save(u));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    usuarioRepository.delete(u);
                    return ResponseEntity.ok(Map.of("message", "Usuário removido."));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}