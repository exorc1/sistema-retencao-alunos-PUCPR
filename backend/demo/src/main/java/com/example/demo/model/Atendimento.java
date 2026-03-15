package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "atendimentos")
public class Atendimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipoCurso;
    private String nomeCompletoAluno;
    private String numeroMatricula;
    private String curso;
    private String periodo;

    private Boolean atendimentoGravado;
    private LocalDate dataNascimento;
    private Integer idade;
    private Boolean menorDeIdade;
    private String responsavelProximo;
    private LocalDateTime retornoResponsavelEm;

    @Column(columnDefinition = "TEXT")
    private String diagnosticoExterno;

    private String tipoSolicitacao;
    private String motivoSolicitacao;

    @Column(columnDefinition = "TEXT")
    private String diagnosticoInterno;

    @Column(columnDefinition = "TEXT")
    private String relacaoCurso;

    private String notas;
    private String rjo;

    @Column(columnDefinition = "TEXT")
    private String rjoDetalhes;

    private String frequencia;
    private String situacaoAcademica;

    private Integer qtdTrancamentos;
    private String ultimoTrancamento;
    private String trancarSemPerderBeneficio;

    @Column(columnDefinition = "TEXT")
    private String proposta;
    private String prazoTrancamento;
    private String prazoCancelamento;

    @Column(columnDefinition = "TEXT")
    private String fechamento;

    private LocalDateTime criadoEm;

    @PrePersist
    public void prePersist() {
        if (this.criadoEm == null) {
            this.criadoEm = LocalDateTime.now();
        }
    }

    public Atendimento() {
    }

    public Long getId() {
        return id;
    }

    public String getTipoCurso() {
        return tipoCurso;
    }

    public void setTipoCurso(String tipoCurso) {
        this.tipoCurso = tipoCurso;
    }

    public String getNomeCompletoAluno() {
        return nomeCompletoAluno;
    }

    public void setNomeCompletoAluno(String nomeCompletoAluno) {
        this.nomeCompletoAluno = nomeCompletoAluno;
    }

    public String getNumeroMatricula() {
        return numeroMatricula;
    }

    public void setNumeroMatricula(String numeroMatricula) {
        this.numeroMatricula = numeroMatricula;
    }

    public String getCurso() {
        return curso;
    }

    public void setCurso(String curso) {
        this.curso = curso;
    }

    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
    }

    public Boolean getAtendimentoGravado() {
        return atendimentoGravado;
    }

    public void setAtendimentoGravado(Boolean atendimentoGravado) {
        this.atendimentoGravado = atendimentoGravado;
    }

    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    public void setDataNascimento(LocalDate dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

    public Integer getIdade() {
        return idade;
    }

    public void setIdade(Integer idade) {
        this.idade = idade;
    }

    public Boolean getMenorDeIdade() {
        return menorDeIdade;
    }

    public void setMenorDeIdade(Boolean menorDeIdade) {
        this.menorDeIdade = menorDeIdade;
    }

    public String getResponsavelProximo() {
        return responsavelProximo;
    }

    public void setResponsavelProximo(String responsavelProximo) {
        this.responsavelProximo = responsavelProximo;
    }

    public LocalDateTime getRetornoResponsavelEm() {
        return retornoResponsavelEm;
    }

    public void setRetornoResponsavelEm(LocalDateTime retornoResponsavelEm) {
        this.retornoResponsavelEm = retornoResponsavelEm;
    }

    public String getDiagnosticoExterno() {
        return diagnosticoExterno;
    }

    public void setDiagnosticoExterno(String diagnosticoExterno) {
        this.diagnosticoExterno = diagnosticoExterno;
    }

    public String getTipoSolicitacao() {
        return tipoSolicitacao;
    }

    public void setTipoSolicitacao(String tipoSolicitacao) {
        this.tipoSolicitacao = tipoSolicitacao;
    }

    public String getMotivoSolicitacao() {
        return motivoSolicitacao;
    }

    public void setMotivoSolicitacao(String motivoSolicitacao) {
        this.motivoSolicitacao = motivoSolicitacao;
    }

    public String getDiagnosticoInterno() {
        return diagnosticoInterno;
    }

    public void setDiagnosticoInterno(String diagnosticoInterno) {
        this.diagnosticoInterno = diagnosticoInterno;
    }

    public String getRelacaoCurso() {
        return relacaoCurso;
    }

    public void setRelacaoCurso(String relacaoCurso) {
        this.relacaoCurso = relacaoCurso;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public String getRjo() {
        return rjo;
    }

    public void setRjo(String rjo) {
        this.rjo = rjo;
    }

    public String getRjoDetalhes() {
        return rjoDetalhes;
    }

    public void setRjoDetalhes(String rjoDetalhes) {
        this.rjoDetalhes = rjoDetalhes;
    }

    public String getFrequencia() {
        return frequencia;
    }

    public void setFrequencia(String frequencia) {
        this.frequencia = frequencia;
    }

    public String getSituacaoAcademica() {
        return situacaoAcademica;
    }

    public void setSituacaoAcademica(String situacaoAcademica) {
        this.situacaoAcademica = situacaoAcademica;
    }

    public Integer getQtdTrancamentos() {
        return qtdTrancamentos;
    }

    public void setQtdTrancamentos(Integer qtdTrancamentos) {
        this.qtdTrancamentos = qtdTrancamentos;
    }

    public String getUltimoTrancamento() {
        return ultimoTrancamento;
    }

    public void setUltimoTrancamento(String ultimoTrancamento) {
        this.ultimoTrancamento = ultimoTrancamento;
    }

    public String getTrancarSemPerderBeneficio() {
        return trancarSemPerderBeneficio;
    }

    public void setTrancarSemPerderBeneficio(String trancarSemPerderBeneficio) {
        this.trancarSemPerderBeneficio = trancarSemPerderBeneficio;
    }

    public String getProposta() {
        return proposta;
    }

    public void setProposta(String proposta) {
        this.proposta = proposta;
    }

    public String getPrazoTrancamento() {
        return prazoTrancamento;
    }

    public void setPrazoTrancamento(String prazoTrancamento) {
        this.prazoTrancamento = prazoTrancamento;
    }

    public String getPrazoCancelamento() {
        return prazoCancelamento;
    }

    public void setPrazoCancelamento(String prazoCancelamento) {
        this.prazoCancelamento = prazoCancelamento;
    }

    public String getFechamento() {
        return fechamento;
    }

    public void setFechamento(String fechamento) {
        this.fechamento = fechamento;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }
}