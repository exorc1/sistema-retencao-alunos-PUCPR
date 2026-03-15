package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tokens_blacklist")
public class TokenBlacklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 2000, nullable = false, unique = true)
    private String token;

    private LocalDateTime revogadoEm;

    public TokenBlacklist() {
    }

    public TokenBlacklist(String token) {
        this.token = token;
        this.revogadoEm = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public LocalDateTime getRevogadoEm() {
        return revogadoEm;
    }

    public void setRevogadoEm(LocalDateTime revogadoEm) {
        this.revogadoEm = revogadoEm;
    }
}