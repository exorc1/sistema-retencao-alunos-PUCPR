package com.example.demo.dto;

public class LoginResponse {
    private String token;
    private String tipo;
    private String role;
    private String nome;
    private String username;

    public LoginResponse(String token, String tipo, String role, String nome, String username) {
        this.token = token;
        this.tipo = tipo;
        this.role = role;
        this.nome = nome;
        this.username = username;
    }

    public String getToken() {
        return token;
    }

    public String getTipo() {
        return tipo;
    }

    public String getRole() {
        return role;
    }

    public String getNome() {
        return nome;
    }

    public String getUsername() {
        return username;
    }
}