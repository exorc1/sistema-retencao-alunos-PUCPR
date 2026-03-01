package com.example.demo.controller;

import com.example.demo.model.Atendimento;
import com.example.demo.repository.AtendimentoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@RestController
@RequestMapping("/api/atendimentos")
public class AtendimentoController {

    private final AtendimentoRepository repo;

    public AtendimentoController(AtendimentoRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Atendimento> listar() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Atendimento> buscarPorId(@PathVariable Long id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Atendimento criar(@RequestBody Atendimento a) {
        recalcularIdadeEMenor(a);
        return repo.save(a);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Atendimento> atualizar(@PathVariable Long id, @RequestBody Atendimento dados) {
        return repo.findById(id).map(existente -> {

            // ===== Formulário Inicial =====
            existente.setTipoCurso(dados.getTipoCurso());
            existente.setNomeCompletoAluno(dados.getNomeCompletoAluno());
            existente.setNumeroMatricula(dados.getNumeroMatricula());
            existente.setCurso(dados.getCurso());
            existente.setPeriodo(dados.getPeriodo());

            // ===== Gravação / Nascimento =====
            existente.setAtendimentoGravado(dados.getAtendimentoGravado());
            existente.setDataNascimento(dados.getDataNascimento());
            existente.setResponsavelProximo(dados.getResponsavelProximo());

            // ===== Diagnóstico Externo =====
            existente.setDiagnosticoExterno(dados.getDiagnosticoExterno());

            // ===== Tipo / Motivo =====
            existente.setTipoSolicitacao(dados.getTipoSolicitacao());
            existente.setMotivoSolicitacao(dados.getMotivoSolicitacao());

            // ===== Diagnóstico Interno =====
            existente.setQtdTrancamentos(dados.getQtdTrancamentos());
            existente.setNotas(dados.getNotas());
            existente.setBolsaOuFinanciamento(dados.getBolsaOuFinanciamento());
            existente.setPodeTrancarSemPerderBeneficio(dados.getPodeTrancarSemPerderBeneficio());

            // ===== Proposta / Solução =====
            existente.setPropostaSolucao(dados.getPropostaSolucao());
            existente.setOutraArgumentacao(dados.getOutraArgumentacao());
            existente.setDecisaoSobreArgumentacoes(dados.getDecisaoSobreArgumentacoes());

            // ===== Etapa Final =====
            existente.setDecisaoEstudanteOuResponsavel(dados.getDecisaoEstudanteOuResponsavel());
            existente.setRetornoProximoSemestre(dados.getRetornoProximoSemestre());
            existente.setRetorno3meses(dados.getRetorno3meses());
            existente.setRetorno6meses(dados.getRetorno6meses());
            existente.setRetorno9meses(dados.getRetorno9meses());

            // ===== Prazos =====
            existente.setPrazoTrancamentoSelecionado(dados.getPrazoTrancamentoSelecionado());

            // ===== Etapa Final (Geral) =====
            existente.setInformarPrazo2DiasUteis(dados.getInformarPrazo2DiasUteis());
            existente.setSolicitarDadosBancarios(dados.getSolicitarDadosBancarios());
            existente.setClicouGravarEEnviar(dados.getClicouGravarEEnviar());

            // ===== Fim =====
            existente.setAtendimentoFinalizado(dados.getAtendimentoFinalizado());

            // Segurança: recalcula idade e menor
            recalcularIdadeEMenor(existente);

            Atendimento salvo = repo.save(existente);
            return ResponseEntity.ok(salvo);

        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void recalcularIdadeEMenor(Atendimento a) {
        if (a.getDataNascimento() != null) {
            int idade = Period.between(a.getDataNascimento(), LocalDate.now()).getYears();
            a.setIdade(idade);
            a.setMenorDeIdade(idade < 18);
        } else {
            a.setIdade(null);
            a.setMenorDeIdade(null);
        }
    }
}
