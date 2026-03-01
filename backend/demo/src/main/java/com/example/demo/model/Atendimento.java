package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "atendimento")
public class Atendimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ===== Formulário Inicial =====
    private String tipoCurso;          // * Tipo do curso
    private String nomeCompletoAluno;  // * Nome completo do Aluno
    private String numeroMatricula;    // * Número de matrícula (pode ter zeros -> String)
    private String curso;              // * Curso
    private String periodo;            // Período (ex: "2°")

    // ===== Gravação / Nascimento =====
    private Boolean atendimentoGravado; // "Avise que o atendimento está sendo gravado"
    private LocalDate dataNascimento;
    private Integer idade;             // calculada no front ou back
    private Boolean menorDeIdade;      // calculada (idade < 18)
    private String responsavelProximo; // "Sim" / "Não" / "N/A"

    // ===== Diagnóstico Externo =====
    @Column(columnDefinition = "TEXT")
    private String diagnosticoExterno; // texto livre

    // ===== Tipo / Motivo =====
    private String tipoSolicitacao;    // Trancamento / Cancelamento / Tratativa
    private String motivoSolicitacao;  // Acadêmico / Financeiro / etc (dropdown)

    // ===== Diagnóstico Interno =====
    private Integer qtdTrancamentos;   // 0..4
    private String notas;              // Boas / Médias / Ruins
    private String bolsaOuFinanciamento; // Sim / Não
    private String podeTrancarSemPerderBeneficio; // Sim / Não / N/A

    // ===== Proposta / Solução =====
    @Column(columnDefinition = "TEXT")
    private String propostaSolucao;

    @Column(columnDefinition = "TEXT")
    private String outraArgumentacao;

    @Column(columnDefinition = "TEXT")
    private String decisaoSobreArgumentacoes;

    // ===== Etapa Final =====
    private String decisaoEstudanteOuResponsavel; // Trancamento / Cancelamento / Tratativa
    private String retornoProximoSemestre;        // Sim / Não
    private Boolean retorno3meses;
    private Boolean retorno6meses;
    private Boolean retorno9meses;

    // "Prazos de solicitação de trancamento" (radio)
    private String prazoTrancamentoSelecionado; // texto do item escolhido

    // "Etapa Final (Geral)" (checkboxes)
    private Boolean informarPrazo2DiasUteis;
    private Boolean solicitarDadosBancarios;
    private Boolean clicouGravarEEnviar; // opcional (marcar se finalizou o envio)

    // "Fim do Atendimento"
    private Boolean atendimentoFinalizado;

    // Auditoria
    private OffsetDateTime criadoEm;

    @PrePersist
    public void prePersist() {
        if (criadoEm == null) criadoEm = OffsetDateTime.now();
    }

    // ===== getters/setters =====

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipoCurso() { return tipoCurso; }
    public void setTipoCurso(String tipoCurso) { this.tipoCurso = tipoCurso; }

    public String getNomeCompletoAluno() { return nomeCompletoAluno; }
    public void setNomeCompletoAluno(String nomeCompletoAluno) { this.nomeCompletoAluno = nomeCompletoAluno; }

    public String getNumeroMatricula() { return numeroMatricula; }
    public void setNumeroMatricula(String numeroMatricula) { this.numeroMatricula = numeroMatricula; }

    public String getCurso() { return curso; }
    public void setCurso(String curso) { this.curso = curso; }

    public String getPeriodo() { return periodo; }
    public void setPeriodo(String periodo) { this.periodo = periodo; }

    public Boolean getAtendimentoGravado() { return atendimentoGravado; }
    public void setAtendimentoGravado(Boolean atendimentoGravado) { this.atendimentoGravado = atendimentoGravado; }

    public LocalDate getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }

    public Integer getIdade() { return idade; }
    public void setIdade(Integer idade) { this.idade = idade; }

    public Boolean getMenorDeIdade() { return menorDeIdade; }
    public void setMenorDeIdade(Boolean menorDeIdade) { this.menorDeIdade = menorDeIdade; }

    public String getResponsavelProximo() { return responsavelProximo; }
    public void setResponsavelProximo(String responsavelProximo) { this.responsavelProximo = responsavelProximo; }

    public String getDiagnosticoExterno() { return diagnosticoExterno; }
    public void setDiagnosticoExterno(String diagnosticoExterno) { this.diagnosticoExterno = diagnosticoExterno; }

    public String getTipoSolicitacao() { return tipoSolicitacao; }
    public void setTipoSolicitacao(String tipoSolicitacao) { this.tipoSolicitacao = tipoSolicitacao; }

    public String getMotivoSolicitacao() { return motivoSolicitacao; }
    public void setMotivoSolicitacao(String motivoSolicitacao) { this.motivoSolicitacao = motivoSolicitacao; }

    public Integer getQtdTrancamentos() { return qtdTrancamentos; }
    public void setQtdTrancamentos(Integer qtdTrancamentos) { this.qtdTrancamentos = qtdTrancamentos; }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }

    public String getBolsaOuFinanciamento() { return bolsaOuFinanciamento; }
    public void setBolsaOuFinanciamento(String bolsaOuFinanciamento) { this.bolsaOuFinanciamento = bolsaOuFinanciamento; }

    public String getPodeTrancarSemPerderBeneficio() { return podeTrancarSemPerderBeneficio; }
    public void setPodeTrancarSemPerderBeneficio(String podeTrancarSemPerderBeneficio) { this.podeTrancarSemPerderBeneficio = podeTrancarSemPerderBeneficio; }

    public String getPropostaSolucao() { return propostaSolucao; }
    public void setPropostaSolucao(String propostaSolucao) { this.propostaSolucao = propostaSolucao; }

    public String getOutraArgumentacao() { return outraArgumentacao; }
    public void setOutraArgumentacao(String outraArgumentacao) { this.outraArgumentacao = outraArgumentacao; }

    public String getDecisaoSobreArgumentacoes() { return decisaoSobreArgumentacoes; }
    public void setDecisaoSobreArgumentacoes(String decisaoSobreArgumentacoes) { this.decisaoSobreArgumentacoes = decisaoSobreArgumentacoes; }

    public String getDecisaoEstudanteOuResponsavel() { return decisaoEstudanteOuResponsavel; }
    public void setDecisaoEstudanteOuResponsavel(String decisaoEstudanteOuResponsavel) { this.decisaoEstudanteOuResponsavel = decisaoEstudanteOuResponsavel; }

    public String getRetornoProximoSemestre() { return retornoProximoSemestre; }
    public void setRetornoProximoSemestre(String retornoProximoSemestre) { this.retornoProximoSemestre = retornoProximoSemestre; }

    public Boolean getRetorno3meses() { return retorno3meses; }
    public void setRetorno3meses(Boolean retorno3meses) { this.retorno3meses = retorno3meses; }

    public Boolean getRetorno6meses() { return retorno6meses; }
    public void setRetorno6meses(Boolean retorno6meses) { this.retorno6meses = retorno6meses; }

    public Boolean getRetorno9meses() { return retorno9meses; }
    public void setRetorno9meses(Boolean retorno9meses) { this.retorno9meses = retorno9meses; }

    public String getPrazoTrancamentoSelecionado() { return prazoTrancamentoSelecionado; }
    public void setPrazoTrancamentoSelecionado(String prazoTrancamentoSelecionado) { this.prazoTrancamentoSelecionado = prazoTrancamentoSelecionado; }

    public Boolean getInformarPrazo2DiasUteis() { return informarPrazo2DiasUteis; }
    public void setInformarPrazo2DiasUteis(Boolean informarPrazo2DiasUteis) { this.informarPrazo2DiasUteis = informarPrazo2DiasUteis; }

    public Boolean getSolicitarDadosBancarios() { return solicitarDadosBancarios; }
    public void setSolicitarDadosBancarios(Boolean solicitarDadosBancarios) { this.solicitarDadosBancarios = solicitarDadosBancarios; }

    public Boolean getClicouGravarEEnviar() { return clicouGravarEEnviar; }
    public void setClicouGravarEEnviar(Boolean clicouGravarEEnviar) { this.clicouGravarEEnviar = clicouGravarEEnviar; }

    public Boolean getAtendimentoFinalizado() { return atendimentoFinalizado; }
    public void setAtendimentoFinalizado(Boolean atendimentoFinalizado) { this.atendimentoFinalizado = atendimentoFinalizado; }

    public OffsetDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(OffsetDateTime criadoEm) { this.criadoEm = criadoEm; }
}
