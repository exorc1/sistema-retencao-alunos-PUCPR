package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/atendimentos")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN','ATENDENTE')")
public class AtendimentoController {

    private final AtendimentoRepository atendimentoRepository;
    private final UsuarioRepository usuarioRepository;

    public AtendimentoController(AtendimentoRepository atendimentoRepository, UsuarioRepository usuarioRepository) {
        this.atendimentoRepository = atendimentoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    public List<Atendimento> listar(Principal principal) {
        Usuario usuario = usuarioLogado(principal);
        if (usuario.getRole() == Role.ADMIN) {
            return atendimentoRepository.findAllByOrderByCriadoEmDesc();
        }
        return atendimentoRepository.findByAtendenteUsernameOrderByCriadoEmDesc(usuario.getUsername());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Atendimento> buscarPorId(@PathVariable Long id, Principal principal) {
        Usuario usuario = usuarioLogado(principal);

        return atendimentoRepository.findById(id)
                .filter(atendimento -> podeAcessar(usuario, atendimento))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Atendimento criar(@RequestBody Atendimento atendimento, Principal principal) {
        Usuario usuario = usuarioLogado(principal);

        atendimento.setAtendenteUsername(usuario.getUsername());
        atendimento.setAtendenteNome(usuario.getNome());

        return atendimentoRepository.save(atendimento);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Atendimento> atualizar(@PathVariable Long id, @RequestBody Atendimento dados, Principal principal) {
        Usuario usuario = usuarioLogado(principal);

        return atendimentoRepository.findById(id)
                .filter(atendimento -> podeEditar(usuario, atendimento))
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

                    return ResponseEntity.ok(atendimentoRepository.save(existente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        return atendimentoRepository.findById(id)
                .map(existente -> {
                    atendimentoRepository.delete(existente);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private Usuario usuarioLogado(Principal principal) {
        return usuarioRepository.findByUsername(principal.getName()).orElseThrow();
    }

    private boolean podeAcessar(Usuario usuario, Atendimento atendimento) {
        return usuario.getRole() == Role.ADMIN
                || usuario.getUsername().equals(atendimento.getAtendenteUsername());
    }

    private boolean podeEditar(Usuario usuario, Atendimento atendimento) {
        return podeAcessar(usuario, atendimento);
    }
}