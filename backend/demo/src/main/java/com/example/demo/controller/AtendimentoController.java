package com.example.demo.controller;

import com.example.demo.model.Atendimento;
import com.example.demo.repository.AtendimentoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/atendimentos")
@CrossOrigin(origins = "*")
public class AtendimentoController {

    private final AtendimentoRepository repository;

    public AtendimentoController(AtendimentoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Atendimento> listar() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Atendimento> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Atendimento criar(@RequestBody Atendimento atendimento) {
        return repository.save(atendimento);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Atendimento> atualizar(@PathVariable Long id, @RequestBody Atendimento dados) {
        return repository.findById(id)
                .map(existente -> {
                    existente.setTipoCurso(dados.getTipoCurso());
                    existente.setNomeCompletoAluno(dados.getNomeCompletoAluno());
                    existente.setNumeroMatricula(dados.getNumeroMatricula());
                    existente.setCurso(dados.getCurso());
                    existente.setPeriodo(dados.getPeriodo());

                    existente.setAtendimentoGravado(dados.getAtendimentoGravado());
                    existente.setDataNascimento(dados.getDataNascimento());
                    existente.setIdade(dados.getIdade());
                    existente.setMenorDeIdade(dados.getMenorDeIdade());
                    existente.setResponsavelProximo(dados.getResponsavelProximo());
                    existente.setRetornoResponsavelEm(dados.getRetornoResponsavelEm());

                    existente.setDiagnosticoExterno(dados.getDiagnosticoExterno());
                    existente.setTipoSolicitacao(dados.getTipoSolicitacao());
                    existente.setMotivoSolicitacao(dados.getMotivoSolicitacao());
                    existente.setDiagnosticoInterno(dados.getDiagnosticoInterno());
                    existente.setRelacaoCurso(dados.getRelacaoCurso());

                    existente.setNotas(dados.getNotas());
                    existente.setRjo(dados.getRjo());
                    existente.setRjoDetalhes(dados.getRjoDetalhes());
                    existente.setFrequencia(dados.getFrequencia());
                    existente.setSituacaoAcademica(dados.getSituacaoAcademica());

                    existente.setQtdTrancamentos(dados.getQtdTrancamentos());
                    existente.setUltimoTrancamento(dados.getUltimoTrancamento());
                    existente.setTrancarSemPerderBeneficio(dados.getTrancarSemPerderBeneficio());

                    existente.setProposta(dados.getProposta());
                    existente.setPrazoTrancamento(dados.getPrazoTrancamento());
                    existente.setPrazoCancelamento(dados.getPrazoCancelamento());

                    existente.setFechamento(dados.getFechamento());

                    return ResponseEntity.ok(repository.save(existente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        return repository.findById(id)
                .map(existente -> {
                    repository.delete(existente);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}