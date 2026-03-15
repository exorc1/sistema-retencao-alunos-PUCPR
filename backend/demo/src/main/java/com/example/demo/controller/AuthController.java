package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.model.TokenBlacklist;
import com.example.demo.model.Usuario;
import com.example.demo.repository.TokenBlacklistRepository;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final TokenBlacklistRepository tokenBlacklistRepository;

    public AuthController(
            AuthenticationManager authenticationManager,
            UsuarioRepository usuarioRepository,
            JwtService jwtService,
            TokenBlacklistRepository tokenBlacklistRepository
    ) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
        this.tokenBlacklistRepository = tokenBlacklistRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getSenha())
        );

        Usuario u = usuarioRepository.findByUsername(request.getUsername()).orElseThrow();

        String token = jwtService.generateToken(
                u.getUsername(),
                u.getRole().name(),
                u.getNome()
        );

        return ResponseEntity.ok(
                new LoginResponse(token, "Bearer", u.getRole().name(), u.getNome(), u.getUsername())
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (!tokenBlacklistRepository.existsByToken(token)) {
                tokenBlacklistRepository.save(new TokenBlacklist(token));
            }
        }

        return ResponseEntity.ok(Map.of("message", "Logout realizado com sucesso."));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Não autenticado"));
        }

        Usuario u = usuarioRepository.findByUsername(authentication.getName()).orElseThrow();

        return ResponseEntity.ok(
                Map.of(
                        "nome", u.getNome(),
                        "username", u.getUsername(),
                        "role", u.getRole().name(),
                        "ativo", u.getAtivo()
                )
        );
    }
}