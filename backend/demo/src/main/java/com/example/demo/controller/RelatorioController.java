package com.example.demo.controller;

import com.example.demo.model.Atendimento;
import com.example.demo.repository.AtendimentoRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.*;
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
        out.put("porRjo", agrupar(lista, Atendimento::getRjo));
        out.put("porAtendente", agrupar(lista, Atendimento::getAtendenteNome));

        return out;
    }

    @GetMapping(value = "/exportar.csv", produces = "text/csv; charset=UTF-8")
    public ResponseEntity<byte[]> exportarCsv() {
        List<Atendimento> lista = repository.findAllByOrderByCriadoEmDesc();

        StringBuilder sb = new StringBuilder();
        sb.append('\uFEFF');
        sb.append("ID;Atendente;Username atendente;Tipo de curso;Nome do aluno;Número de matrícula;Curso;Período;Gravação;Data de nascimento;Idade;Menor de idade;Responsável próximo;Retorno responsável em;Diagnóstico externo;Tipo da solicitação;Motivo da solicitação;Diagnóstico interno;Relação com o curso;Notas;RJO;Detalhes RJO;Frequência;Situação acadêmica;Qtd trancamentos;Último trancamento;Trancar sem perder benefício;Proposta;Prazo trancamento;Prazo cancelamento;Fechamento;Criado em\n");

        for (Atendimento a : lista) {
            sb.append(csv(a.getId())).append(';')
              .append(csv(a.getAtendenteNome())).append(';')
              .append(csv(a.getAtendenteUsername())).append(';')
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
    public ResponseEntity<byte[]> exportarXlsx() {
        List<Atendimento> lista = repository.findAllByOrderByCriadoEmDesc();

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Atendimentos");

            String[] headers = {
                    "ID", "Atendente", "Username atendente", "Tipo de curso", "Nome do aluno", "Número de matrícula", "Curso",
                    "Período", "Gravação", "Data de nascimento", "Idade", "Menor de idade", "Responsável próximo",
                    "Retorno responsável em", "Diagnóstico externo", "Tipo da solicitação", "Motivo da solicitação",
                    "Diagnóstico interno", "Relação com o curso", "Notas", "RJO", "Detalhes RJO", "Frequência",
                    "Situação acadêmica", "Qtd trancamentos", "Último trancamento", "Trancar sem perder benefício",
                    "Proposta", "Prazo trancamento", "Prazo cancelamento", "Fechamento", "Criado em"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            int rowIndex = 1;
            for (Atendimento a : lista) {
                Row row = sheet.createRow(rowIndex++);
                int c = 0;
                row.createCell(c++).setCellValue(valor(a.getId()));
                row.createCell(c++).setCellValue(valor(a.getAtendenteNome()));
                row.createCell(c++).setCellValue(valor(a.getAtendenteUsername()));
                row.createCell(c++).setCellValue(valor(a.getTipoCurso()));
                row.createCell(c++).setCellValue(valor(a.getNomeCompletoAluno()));
                row.createCell(c++).setCellValue(valor(a.getNumeroMatricula()));
                row.createCell(c++).setCellValue(valor(a.getCurso()));
                row.createCell(c++).setCellValue(valor(a.getPeriodo()));
                row.createCell(c++).setCellValue(valor(a.getAtendimentoGravado()));
                row.createCell(c++).setCellValue(valor(a.getDataNascimento()));
                row.createCell(c++).setCellValue(valor(a.getIdade()));
                row.createCell(c++).setCellValue(valor(a.getMenorDeIdade()));
                row.createCell(c++).setCellValue(valor(a.getResponsavelProximo()));
                row.createCell(c++).setCellValue(valor(a.getRetornoResponsavelEm()));
                row.createCell(c++).setCellValue(valor(a.getDiagnosticoExterno()));
                row.createCell(c++).setCellValue(valor(a.getTipoSolicitacao()));
                row.createCell(c++).setCellValue(valor(a.getMotivoSolicitacao()));
                row.createCell(c++).setCellValue(valor(a.getDiagnosticoInterno()));
                row.createCell(c++).setCellValue(valor(a.getRelacaoCurso()));
                row.createCell(c++).setCellValue(valor(a.getNotas()));
                row.createCell(c++).setCellValue(valor(a.getRjo()));
                row.createCell(c++).setCellValue(valor(a.getRjoDetalhes()));
                row.createCell(c++).setCellValue(valor(a.getFrequencia()));
                row.createCell(c++).setCellValue(valor(a.getSituacaoAcademica()));
                row.createCell(c++).setCellValue(valor(a.getQtdTrancamentos()));
                row.createCell(c++).setCellValue(valor(a.getUltimoTrancamento()));
                row.createCell(c++).setCellValue(valor(a.getTrancarSemPerderBeneficio()));
                row.createCell(c++).setCellValue(valor(a.getProposta()));
                row.createCell(c++).setCellValue(valor(a.getPrazoTrancamento()));
                row.createCell(c++).setCellValue(valor(a.getPrazoCancelamento()));
                row.createCell(c++).setCellValue(valor(a.getFechamento()));
                row.createCell(c++).setCellValue(valor(a.getCriadoEm()));
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=relatorio-atendimentos.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private Map<String, Long> agrupar(List<Atendimento> lista, Function<Atendimento, String> fn) {
        return lista.stream()
                .map(fn)
                .map(v -> (v == null || v.isBlank()) ? "Não informado" : v)
                .collect(Collectors.groupingBy(v -> v, LinkedHashMap::new, Collectors.counting()));
    }

    private String csv(Object valor) {
        if (valor == null) return "";
        return String.valueOf(valor).replace(";", ",").replace("\n", " ").replace("\r", " ");
    }

    private String valor(Object valor) {
        return valor == null ? "" : String.valueOf(valor);
    }
}