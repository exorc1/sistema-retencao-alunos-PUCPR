package com.example.demo.dto;

import com.example.demo.model.Usuario;

public class UsuarioResponse {
    private Long id;
    private String nome;
    private String username;
    private String role;
    private Boolean ativo;

    public UsuarioResponse(Usuario usuario) {
        this.id = usuario.getId();
        this.nome = usuario.getNome();
        this.username = usuario.getUsername();
        this.role = usuario.getRole().name();
        this.ativo = usuario.getAtivo();
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public Boolean getAtivo() {
        return ativo;
    }
}