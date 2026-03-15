package com.example.demo.controller;

import com.example.demo.model.Atendimento;
import com.example.demo.repository.AtendimentoRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/relatorios/atendimentos")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
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
        sb.append('\uFEFF');
        sb.append("ID;Tipo de curso;Nome do aluno;Número de matrícula;Curso;Período;Gravação;Data de nascimento;Idade;Menor de idade;Responsável próximo;Retorno responsável em;Diagnóstico externo;Tipo da solicitação;Motivo da solicitação;Diagnóstico interno;Relação com o curso;Notas;Frequência;Observações acadêmicas;Continuar com o curso;Situação acadêmica;Qtd trancamentos;Último trancamento;Trancar sem perder benefício;Proposta;Prazo trancamento;Prazo cancelamento;Fechamento;Criado em\n");

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

    @GetMapping("/exportar.xlsx")
    public ResponseEntity<byte[]> exportarXlsx() throws Exception {
        List<Atendimento> lista = repository.findAll();

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Atendimentos");

            String[] headers = {
                    "ID",
                    "Tipo de curso",
                    "Nome do aluno",
                    "Número de matrícula",
                    "Curso",
                    "Período",
                    "Gravação",
                    "Data de nascimento",
                    "Idade",
                    "Menor de idade",
                    "Responsável próximo",
                    "Retorno responsável em",
                    "Diagnóstico externo",
                    "Tipo da solicitação",
                    "Motivo da solicitação",
                    "Diagnóstico interno",
                    "Relação com o curso",
                    "Notas",
                    "Frequência",
                    "Observações acadêmicas",
                    "Continuar com o curso",
                    "Situação acadêmica",
                    "Qtd trancamentos",
                    "Último trancamento",
                    "Trancar sem perder benefício",
                    "Proposta",
                    "Prazo trancamento",
                    "Prazo cancelamento",
                    "Fechamento",
                    "Criado em"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            int rowIdx = 1;
            for (Atendimento a : lista) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(valor(a.getId()));
                row.createCell(1).setCellValue(valor(a.getTipoCurso()));
                row.createCell(2).setCellValue(valor(a.getNomeCompletoAluno()));
                row.createCell(3).setCellValue(valor(a.getNumeroMatricula()));
                row.createCell(4).setCellValue(valor(a.getCurso()));
                row.createCell(5).setCellValue(valor(a.getPeriodo()));
                row.createCell(6).setCellValue(valor(a.getAtendimentoGravado()));
                row.createCell(7).setCellValue(valor(a.getDataNascimento()));
                row.createCell(8).setCellValue(valor(a.getIdade()));
                row.createCell(9).setCellValue(valor(a.getMenorDeIdade()));
                row.createCell(10).setCellValue(valor(a.getResponsavelProximo()));
                row.createCell(11).setCellValue(valor(a.getRetornoResponsavelEm()));
                row.createCell(12).setCellValue(valor(a.getDiagnosticoExterno()));
                row.createCell(13).setCellValue(valor(a.getTipoSolicitacao()));
                row.createCell(14).setCellValue(valor(a.getMotivoSolicitacao()));
                row.createCell(15).setCellValue(valor(a.getDiagnosticoInterno()));
                row.createCell(16).setCellValue(valor(a.getRelacaoCurso()));
                row.createCell(17).setCellValue(valor(a.getNotas()));
                row.createCell(18).setCellValue(valor(a.getRjo()));
                row.createCell(19).setCellValue(valor(a.getRjoDetalhes()));
                row.createCell(20).setCellValue(valor(a.getFrequencia()));
                row.createCell(21).setCellValue(valor(a.getSituacaoAcademica()));
                row.createCell(22).setCellValue(valor(a.getQtdTrancamentos()));
                row.createCell(23).setCellValue(valor(a.getUltimoTrancamento()));
                row.createCell(24).setCellValue(valor(a.getTrancarSemPerderBeneficio()));
                row.createCell(25).setCellValue(valor(a.getProposta()));
                row.createCell(26).setCellValue(valor(a.getPrazoTrancamento()));
                row.createCell(27).setCellValue(valor(a.getPrazoCancelamento()));
                row.createCell(28).setCellValue(valor(a.getFechamento()));
                row.createCell(29).setCellValue(valor(a.getCriadoEm()));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-atendimentos.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        }
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

    private String valor(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}