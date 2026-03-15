package com.example.demo.repository;

import com.example.demo.model.Atendimento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AtendimentoRepository extends JpaRepository<Atendimento, Long> {
    List<Atendimento> findAllByOrderByCriadoEmDesc();
    List<Atendimento> findByAtendenteUsernameOrderByCriadoEmDesc(String atendenteUsername);
}