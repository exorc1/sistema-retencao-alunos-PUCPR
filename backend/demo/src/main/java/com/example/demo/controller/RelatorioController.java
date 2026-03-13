package com.example.demo.controller;

import com.example.demo.model.Atendimento;
import com.example.demo.repository.AtendimentoRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/relatorios/atendimentos")
@CrossOrigin(origins = "*")
public class RelatorioController {

    private final AtendimentoRepository repository;

    public RelatorioController(AtendimentoRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/resumo")
    public Map<String, Object> resumo() {
        List<Atendimento> lista = repository.findAll();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalAtendimentos", lista.size());
        out.put("totalMenores", lista.stream().filter(a -> Boolean.TRUE.equals(a.getMenorDeIdade())).count());
        out.put("totalComRetornoAgendado", lista.stream().filter(a -> a.getRetornoResponsavelEm() != null).count());
        out.put("totalRetornosVencidos", lista.stream()
                .filter(a -> a.getRetornoResponsavelEm() != null)
                .filter(a -> a.getRetornoResponsavelEm().isBefore(LocalDateTime.now()))
                .count());

        out.put("porTipoCurso", agrupar(lista, Atendimento::getTipoCurso));
        out.put("porTipoSolicitacao", agrupar(lista, Atendimento::getTipoSolicitacao));
        out.put("porMotivoSolicitacao", agrupar(lista, Atendimento::getMotivoSolicitacao));
        out.put("porCurso", agrupar(lista, Atendimento::getCurso));
        out.put("porNotas", agrupar(lista, Atendimento::getNotas));
        out.put("porFrequencia", agrupar(lista, Atendimento::getRjo));

        Map<String, Long> preenchimento = new LinkedHashMap<>();
        preenchimento.put("diagnosticoExterno", contarPreenchidos(lista, Atendimento::getDiagnosticoExterno));
        preenchimento.put("diagnosticoInterno", contarPreenchidos(lista, Atendimento::getDiagnosticoInterno));
        preenchimento.put("relacaoCurso", contarPreenchidos(lista, Atendimento::getRelacaoCurso));
        preenchimento.put("proposta", contarPreenchidos(lista, Atendimento::getProposta));
        preenchimento.put("fechamento", contarPreenchidos(lista, Atendimento::getFechamento));
        preenchimento.put("retornoResponsavelEm", (long) lista.stream().filter(a -> a.getRetornoResponsavelEm() != null).count());
        preenchimento.put("rjoDetalhes", contarPreenchidos(lista, Atendimento::getRjoDetalhes));
        preenchimento.put("situacaoAcademica", contarPreenchidos(lista, Atendimento::getSituacaoAcademica));
        out.put("camposPreenchidos", preenchimento);

        return out;
    }

    @GetMapping(value = "/exportar.csv", produces = "text/csv; charset=UTF-8")
    public ResponseEntity<byte[]> exportarCsv() {
        List<Atendimento> lista = repository.findAll();

        StringBuilder sb = new StringBuilder();
        sb.append('\uFEFF'); // BOM para Excel
        sb.append("id;tipoCurso;nomeCompletoAluno;numeroMatricula;curso;periodo;atendimentoGravado;dataNascimento;idade;menorDeIdade;responsavelProximo;retornoResponsavelEm;diagnosticoExterno;tipoSolicitacao;motivoSolicitacao;diagnosticoInterno;relacaoCurso;notas;rjo;rjoDetalhes;frequencia;situacaoAcademica;qtdTrancamentos;ultimoTrancamento;trancarSemPerderBeneficio;proposta;prazoTrancamento;prazoCancelamento;fechamento;criadoEm\n");

        for (Atendimento a : lista) {
            sb.append(csv(a.getId())).append(';')
              .append(csv(a.getTipoCurso())).append(';')
              .append(csv(a.getNomeCompletoAluno())).append(';')
              .append(csv(a.getNumeroMatricula())).append(';')
              .append(csv(a.getCurso())).append(';')
              .append(csv(a.getPeriodo())).append(';')
              .append(csv(a.getAtendimentoGravado())).append(';')
              .append(csv(a.getDataNascimento())).append(';')
              .append(csv(a.getIdade())).append(';')
              .append(csv(a.getMenorDeIdade())).append(';')
              .append(csv(a.getResponsavelProximo())).append(';')
              .append(csv(a.getRetornoResponsavelEm())).append(';')
              .append(csv(a.getDiagnosticoExterno())).append(';')
              .append(csv(a.getTipoSolicitacao())).append(';')
              .append(csv(a.getMotivoSolicitacao())).append(';')
              .append(csv(a.getDiagnosticoInterno())).append(';')
              .append(csv(a.getRelacaoCurso())).append(';')
              .append(csv(a.getNotas())).append(';')
              .append(csv(a.getRjo())).append(';')
              .append(csv(a.getRjoDetalhes())).append(';')
              .append(csv(a.getFrequencia())).append(';')
              .append(csv(a.getSituacaoAcademica())).append(';')
              .append(csv(a.getQtdTrancamentos())).append(';')
              .append(csv(a.getUltimoTrancamento())).append(';')
              .append(csv(a.getTrancarSemPerderBeneficio())).append(';')
              .append(csv(a.getProposta())).append(';')
              .append(csv(a.getPrazoTrancamento())).append(';')
              .append(csv(a.getPrazoCancelamento())).append(';')
              .append(csv(a.getFechamento())).append(';')
              .append(csv(a.getCriadoEm()))
              .append('\n');
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-atendimentos.csv")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    private Map<String, Long> agrupar(List<Atendimento> lista, Function<Atendimento, String> getter) {
        return lista.stream()
                .map(getter)
                .map(this::normalizarChave)
                .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()));
    }

    private long contarPreenchidos(List<Atendimento> lista, Function<Atendimento, String> getter) {
        return lista.stream()
                .map(getter)
                .filter(this::textoPreenchido)
                .count();
    }

    private boolean textoPreenchido(String s) {
        return s != null && !s.trim().isEmpty() && !"Selecione".equalsIgnoreCase(s.trim());
    }

    private String normalizarChave(String s) {
        if (s == null || s.trim().isEmpty()) return "Não informado";
        if ("Selecione".equalsIgnoreCase(s.trim())) return "Não informado";
        return s.trim();
    }

    private String csv(Object value) {
        if (value == null) return "";
        String s = String.valueOf(value);
        s = s.replace("\"", "\"\"");
        return "\"" + s + "\"";
    }
}