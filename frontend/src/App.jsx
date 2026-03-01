import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:8081";
const API_URL = import.meta.env.VITE_API_URL || `${API_BASE}/api/atendimentos`;

function calcularIdade(dataISO) {
  if (!dataISO) return "";
  const hoje = new Date();
  const nasc = new Date(dataISO);

  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;

  return idade;
}

function extrairNumeroPeriodo(valor) {
  if (!valor) return null;
  const m = String(valor).match(/\d+/);
  return m ? Number(m[0]) : null;
}

function normalizarTexto(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cursoEhMedicina(curso) {
  return normalizarTexto(curso) === "medicina";
}

function formatDateTimeBR(isoOrDateLike) {
  if (!isoOrDateLike) return "-";
  const d = new Date(isoOrDateLike);
  if (Number.isNaN(d.getTime())) return String(isoOrDateLike);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

const steps = [
  { id: "inicial", label: "Formulário Inicial" },
  { id: "gravacao", label: "Gravação / Nascimento" },
  { id: "diagnosticoExterno", label: "Diagnóstico Externo" },
  { id: "tipoMotivo", label: "Tipo / Motivo" },
  { id: "diagnosticoInterno", label: "Diagnóstico Interno" },
  { id: "relacaoComCurso", label: "Relação com o Curso" },
  { id: "informacoesAcademicas", label: "Informações Acadêmicas" },
  { id: "historico", label: "Histórico / Trancamentos" },
  { id: "proposta", label: "Proposta / Solução" },
  { id: "etapaFinal", label: "Etapa Final" },
  { id: "salvos", label: "Atendimentos Salvos" },
];

const SELECT_SIM_NAO = ["Selecione", "Sim", "Não"];
const SELECT_TIPO_CURSO = ["Selecione", "Graduação", "Pós-Graduação"];
const SELECT_TIPO_SOLICITACAO = ["Selecione", "Trancamento", "Cancelamento", "Tratativa"];
const SELECT_MOTIVO = [
  "Selecione",
  "Bolsa/Financiamento",
  "Curso",
  "Distância",
  "Escolaridade",
  "Financeiro",
  "Outras IES",
  "Trabalho",
  "Universidade",
  "Pessoal",
  "Exército",
  "Intercâmbio",
  "Novo Vestibular",
  "Insatisfação",
  "Saúde",
  "Falecimento",
  "Outro",
];

const SELECT_NOTAS = ["Selecione", "Boas", "Médias", "Ruins"];
const SELECT_QTD_TRANC = ["Selecione", "0", "1", "2", "3", "4"];
const SELECT_RESPONSAVEL = ["Selecione", "Sim", "Não", "N/A"];

const PRAZOS = [
  "ATÉ 06/03/2026 - Final do período para solicitação de trancamento de matrícula para o 2º semestre de 2025",
  "ATÉ 06/03/2026 - Final do período para solicitação de reabertura de matrícula (todos os cursos)",
  "A PARTIR DE 18/05 - Início do período para solicitação de reabertura de matrícula (todos os cursos), referente ao 2º semestre de 2026",
];

// IMPORTANTE: Mantive os nomes dos campos do backend (rjo, frequencia, etc)
// Só mudamos o que aparece na tela.
const initialForm = {
  tipoCurso: "Selecione",
  nomeCompletoAluno: "",
  numeroMatricula: "",
  curso: "",
  periodo: "",

  atendimentoGravado: null,
  dataNascimento: "",
  idade: "",
  menorDeIdade: "",
  responsavelProximo: "Selecione",
  retornoResponsavelEm: "",

  diagnosticoExterno: "",

  tipoSolicitacao: "Selecione",
  motivoSolicitacao: "Selecione",

  diagnosticoInterno: "",

  relacaoCurso: "",

  // Informações acadêmicas
  notas: "Selecione",
  // rjo agora será usado como "Frequência (Sim/Não)"
  rjo: "Selecione",
  rjoDetalhes: "",
  // frequencia agora será usado como "Com notas boas deveria continuar?"
  frequencia: "Selecione",
  situacaoAcademica: "",

  // Histórico / trancamentos
  qtdTrancamentos: "Selecione",
  ultimoTrancamento: "",
  trancarSemPerderBeneficio: "",

  // Proposta / solução
  proposta: "",
  prazoTrancamento: "",
  prazoCancelamento: "",

  // Etapa final
  fechamento: "",
};

function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <label className="text-sm font-medium text-slate-700">{children}</label>;
}

function Input(props) {
  return (
    <input
      {...props}
      className={
        "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none " +
        (props.className || "")
      }
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={
        "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-600 focus:outline-none " +
        (props.className || "")
      }
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={
        "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-red-600 focus:outline-none " +
        (props.className || "")
      }
    />
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-3 py-1 text-xs font-medium transition " +
        (active
          ? "bg-red-700 text-white"
          : "bg-white text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50")
      }
    >
      {children}
    </button>
  );
}

export default function App() {
  const [activeStep, setActiveStep] = useState("inicial");
  const [form, setForm] = useState(initialForm);

  const [medicinaPrimeiroPeriodo, setMedicinaPrimeiroPeriodo] = useState("Selecione");

  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");

  const periodoNumero = useMemo(() => extrairNumeroPeriodo(form.periodo), [form.periodo]);
  const isMed = useMemo(() => cursoEhMedicina(form.curso), [form.curso]);

  const isPrimeiroPeriodoMedicina = useMemo(() => {
    if (!isMed) return false;

    if (medicinaPrimeiroPeriodo === "Sim") return true;
    if (medicinaPrimeiroPeriodo === "Não") return false;

    return periodoNumero === 1;
  }, [isMed, medicinaPrimeiroPeriodo, periodoNumero]);

  const bloqueiaTrancamento = isMed && isPrimeiroPeriodoMedicina;

  const sugestaoContinuar = useMemo(() => {
    if (form.notas === "Boas") return "Sugestão: com notas boas, estimular permanência e reforçar plano de continuidade.";
    if (form.notas === "Médias") return "Sugestão: avaliar dificuldades e propor apoio/ajustes para permanência.";
    if (form.notas === "Ruins") return "Sugestão: investigar causa (didática, saúde, financeiro) e propor plano de recuperação.";
    return "";
  }, [form.notas]);

  async function carregarAtendimentos() {
    try {
      const r = await fetch(API_URL);
      const data = await r.json();
      setAtendimentos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setAtendimentos([]);
    }
  }

  useEffect(() => {
    carregarAtendimentos();
  }, []);

  useEffect(() => {
    if (bloqueiaTrancamento && form.tipoSolicitacao === "Trancamento") {
      setForm((p) => ({ ...p, tipoSolicitacao: "Cancelamento" }));
      setToast("Medicina no 1º período não permite Trancamento. Ajustei para Cancelamento.");
      setTimeout(() => setToast(""), 3500);
    }
  }, [bloqueiaTrancamento, form.tipoSolicitacao]);

  useEffect(() => {
    if (!isMed && medicinaPrimeiroPeriodo !== "Selecione") {
      setMedicinaPrimeiroPeriodo("Selecione");
    }
  }, [isMed, medicinaPrimeiroPeriodo]);

  useEffect(() => {
    const idade = calcularIdade(form.dataNascimento);
    setForm((p) => ({ ...p, idade: idade === "" ? "" : String(idade) }));
  }, [form.dataNascimento]);

  useEffect(() => {
    const n = Number(form.idade);
    if (!Number.isFinite(n)) return;
    setForm((p) => ({ ...p, menorDeIdade: n < 18 ? "Sim" : "Não" }));
  }, [form.idade]);

  function resetForm() {
    setForm(initialForm);
    setMedicinaPrimeiroPeriodo("Selecione");
    setEditingId(null);
  }

  function scrollTo(stepId) {
    setActiveStep(stepId);
    const el = document.getElementById(stepId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function salvar() {
    try {
      // REGRA: menor sem responsável exige retorno
      if (form.menorDeIdade === "Sim" && form.responsavelProximo !== "Sim") {
        if (!form.retornoResponsavelEm) {
          setToast("Menor de idade sem responsável: informe a data/hora de retorno.");
          setTimeout(() => setToast(""), 3000);
          scrollTo("gravacao");
          return;
        }
      }

      setLoading(true);

      const payload = {
        ...form,
        qtdTrancamentos: form.qtdTrancamentos === "Selecione" ? null : Number(form.qtdTrancamentos),
        idade: form.idade === "" ? null : Number(form.idade),
        menorDeIdade: form.menorDeIdade === "" ? null : form.menorDeIdade === "Sim",
        dataNascimento: form.dataNascimento || null,
        atendimentoGravado: form.atendimentoGravado,
        retornoResponsavelEm: form.retornoResponsavelEm || null,
      };

      const isEdit = !!editingId;
      const url = isEdit ? `${API_URL}/${editingId}` : API_URL;
      const method = isEdit ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`Erro ao salvar (${r.status}): ${t}`);
      }

      setToast(isEdit ? "Atendimento atualizado com sucesso." : "Atendimento salvo com sucesso.");
      resetForm();
      await carregarAtendimentos();
      scrollTo("salvos");
    } catch (e) {
      console.error(e);
      setToast(e?.message || "Erro ao salvar (veja o console).");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(""), 2500);
    }
  }

  function preencherParaEdicao(a) {
    setEditingId(a.id);
    setForm({
      ...initialForm,

      tipoCurso: a.tipoCurso ?? "Selecione",
      nomeCompletoAluno: a.nomeCompletoAluno ?? "",
      numeroMatricula: a.numeroMatricula ?? "",
      curso: a.curso ?? "",
      periodo: a.periodo ?? "",

      atendimentoGravado: a.atendimentoGravado,
      dataNascimento: a.dataNascimento ?? "",
      idade: a.idade ?? "",
      menorDeIdade: a.menorDeIdade === true ? "Sim" : a.menorDeIdade === false ? "Não" : "",
      responsavelProximo: a.responsavelProximo ?? "Selecione",
      retornoResponsavelEm: a.retornoResponsavelEm ?? "",

      diagnosticoExterno: a.diagnosticoExterno ?? "",

      tipoSolicitacao: a.tipoSolicitacao ?? "Selecione",
      motivoSolicitacao: a.motivoSolicitacao ?? "Selecione",

      diagnosticoInterno: a.diagnosticoInterno ?? "",

      relacaoCurso: a.relacaoCurso ?? "",

      notas: a.notas ?? "Selecione",
      frequencia: a.frequencia ?? "Selecione",
      situacaoAcademica: a.situacaoAcademica ?? "",
      rjo: a.rjo ?? "Selecione",
      rjoDetalhes: a.rjoDetalhes ?? "",

      qtdTrancamentos:
        a.qtdTrancamentos === null || a.qtdTrancamentos === undefined ? "Selecione" : String(a.qtdTrancamentos),
      ultimoTrancamento: a.ultimoTrancamento ?? "",
      trancarSemPerderBeneficio: a.trancarSemPerderBeneficio ?? "",

      proposta: a.proposta ?? "",
      prazoTrancamento: a.prazoTrancamento ?? "",
      prazoCancelamento: a.prazoCancelamento ?? "",

      fechamento: a.fechamento ?? "",
    });

    const pnum = extrairNumeroPeriodo(a.periodo);
    if (cursoEhMedicina(a.curso) && pnum === 1) setMedicinaPrimeiroPeriodo("Sim");
    else if (cursoEhMedicina(a.curso) && pnum != null) setMedicinaPrimeiroPeriodo("Não");
    else setMedicinaPrimeiroPeriodo("Selecione");
  }

  async function remover(id) {
    if (!window.confirm("Tem certeza que deseja remover?")) return;
    try {
      const r = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Falha ao remover");
      setToast("Removido com sucesso.");
      await carregarAtendimentos();
    } catch (e) {
      console.error(e);
      setToast("Erro ao remover.");
    } finally {
      setTimeout(() => setToast(""), 2500);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-red-800 bg-red-700">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-semibold text-white">Sistema de Retenção de Alunos</h1>
            <p className="text-xs text-white/80">Atendimento / Retenção — formulário + histórico</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={salvar}
              disabled={loading}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-60"
            >
              {loading ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl bg-red-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-900"
            >
              Limpar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {steps.map((s) => (
            <Pill key={s.id} active={activeStep === s.id} onClick={() => scrollTo(s.id)}>
              {s.label}
            </Pill>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-6">
          <section id="inicial">
            <Card title="Formulário Inicial" subtitle="Dados básicos do aluno e do curso.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Tipo de curso *</Label>
                  <Select value={form.tipoCurso} onChange={(e) => setForm((p) => ({ ...p, tipoCurso: e.target.value }))}>
                    {SELECT_TIPO_CURSO.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Número de matrícula *</Label>
                  <Input
                    placeholder="Matrícula"
                    value={form.numeroMatricula}
                    onChange={(e) => setForm((p) => ({ ...p, numeroMatricula: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Nome completo do aluno *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={form.nomeCompletoAluno}
                    onChange={(e) => setForm((p) => ({ ...p, nomeCompletoAluno: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Curso *</Label>
                  <Input
                    placeholder="Ex: Medicina, Direito, Pós em Gestão..."
                    value={form.curso}
                    onChange={(e) => setForm((p) => ({ ...p, curso: e.target.value }))}
                  />
                  <p className="mt-1 text-xs text-slate-600">
                    Curso é livre (Pós pode mudar de nome). Se for Medicina, o sistema aplica regra do 1º período.
                  </p>
                </div>

                {isMed && (
                  <div>
                    <Label>É 1º período? (somente Medicina)</Label>
                    <Select value={medicinaPrimeiroPeriodo} onChange={(e) => setMedicinaPrimeiroPeriodo(e.target.value)}>
                      {SELECT_SIM_NAO.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>

                    {bloqueiaTrancamento && (
                      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <b>⚠ Atenção:</b> Medicina no <b>1º período</b> não pode <b>Trancar</b>.
                        <div className="mt-1">
                          Orientação: <b>não é possível</b>. Se for do interesse do aluno, seguir com{" "}
                          <b>Cancelamento</b>.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label>Período</Label>
                  <Input
                    placeholder="Ex: 1, 1º, 2, 3..."
                    value={form.periodo}
                    onChange={(e) => setForm((p) => ({ ...p, periodo: e.target.value }))}
                  />
                </div>
              </div>
            </Card>
          </section>

          <section id="gravacao">
            <Card title="Gravação / Nascimento" subtitle="Registro da gravação e dados de idade.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Gravação da conversa</Label>
                  <Select
                    value={
                      form.atendimentoGravado === true
                        ? "Sim"
                        : form.atendimentoGravado === false
                        ? "Não"
                        : "Selecione"
                    }
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        atendimentoGravado:
                          e.target.value === "Sim" ? true : e.target.value === "Não" ? false : null,
                      }))
                    }
                  >
                    {SELECT_SIM_NAO.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Data de nascimento</Label>
                  <Input type="date" value={form.dataNascimento} onChange={(e) => setForm((p) => ({ ...p, dataNascimento: e.target.value }))} />
                </div>

                <div>
                  <Label>Idade</Label>
                  <Input value={form.idade} readOnly />
                  <p className="mt-1 text-xs text-slate-600">
                    {form.menorDeIdade === "Sim"
                      ? "Menor de idade: solicitar responsável no atendimento."
                      : form.menorDeIdade === "Não"
                      ? "Maior de idade."
                      : "—"}
                  </p>
                </div>

                <div>
                  <Label>Responsável próximo? (se menor)</Label>
                  <Select value={form.responsavelProximo} onChange={(e) => setForm((p) => ({ ...p, responsavelProximo: e.target.value }))}>
                    {SELECT_RESPONSAVEL.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </div>

                {form.menorDeIdade === "Sim" && form.responsavelProximo !== "Sim" && (
                  <div className="md:col-span-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                    <b>⚠ Menor de idade:</b> chame o responsável para prosseguir. Caso não esteja próximo, marque retorno.
                    <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <Label>Data/Hora para retorno (responsável)</Label>
                        <Input
                          type="datetime-local"
                          value={form.retornoResponsavelEm}
                          onChange={(e) => setForm((p) => ({ ...p, retornoResponsavelEm: e.target.value }))}
                        />
                        <p className="mt-1 text-xs text-red-900/70">Obrigatório quando o responsável não está próximo.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </section>

          <section id="diagnosticoExterno">
            <Card title="Diagnóstico Externo" subtitle="Informações iniciais do caso.">
              <Label>Diagnóstico externo</Label>
              <Textarea
                rows={4}
                placeholder="Descreva o cenário informado pelo aluno..."
                value={form.diagnosticoExterno}
                onChange={(e) => setForm((p) => ({ ...p, diagnosticoExterno: e.target.value }))}
              />
            </Card>
          </section>

          <section id="tipoMotivo">
            <Card title="Tipo / Motivo" subtitle="Classificação da demanda.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Tipo da Solicitação</Label>
                  <Select value={form.tipoSolicitacao} onChange={(e) => setForm((p) => ({ ...p, tipoSolicitacao: e.target.value }))}>
                    {SELECT_TIPO_SOLICITACAO.map((o) => {
                      const disabled = o === "Trancamento" && bloqueiaTrancamento;
                      return (
                        <option key={o} value={o} disabled={disabled}>
                          {o}
                          {disabled ? " (indisponível no 1º período de Medicina)" : ""}
                        </option>
                      );
                    })}
                  </Select>
                </div>

                <div>
                  <Label>Motivo da Solicitação</Label>
                  <Select value={form.motivoSolicitacao} onChange={(e) => setForm((p) => ({ ...p, motivoSolicitacao: e.target.value }))}>
                    {SELECT_MOTIVO.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {bloqueiaTrancamento && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <b>Fluxo sugerido:</b> informar que não é possível trancar no 1º período de Medicina e, se o aluno desejar, seguir com{" "}
                  <b>Cancelamento</b>.
                </div>
              )}
            </Card>
          </section>

          <section id="diagnosticoInterno">
            <Card title="Diagnóstico Interno" subtitle="Análise do atendente.">
              <Label>Diagnóstico interno</Label>
              <Textarea
                rows={4}
                placeholder="Análise interna / histórico / contexto..."
                value={form.diagnosticoInterno}
                onChange={(e) => setForm((p) => ({ ...p, diagnosticoInterno: e.target.value }))}
              />
            </Card>
          </section>

          <section id="relacaoComCurso">
            <Card title="Relação com o Curso" subtitle="O aluno está alinhado com o curso?">
              <Label>Relação com o curso</Label>
              <Textarea
                rows={3}
                placeholder="Descreva a relação do aluno com o curso..."
                value={form.relacaoCurso}
                onChange={(e) => setForm((p) => ({ ...p, relacaoCurso: e.target.value }))}
              />
            </Card>
          </section>

          <section id="informacoesAcademicas">
            <Card title="Informações Acadêmicas" subtitle="Resumo do desempenho e recomendação.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Notas</Label>
                  <Select value={form.notas} onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}>
                    {SELECT_NOTAS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>

                  {sugestaoContinuar ? (
                    <p className="mt-2 text-xs text-slate-600">{sugestaoContinuar}</p>
                  ) : null}
                </div>

                {/* RJO virou frequência (Sim/Não) */}
                <div>
                  <Label>Frequência (Sim/Não)</Label>
                  <Select value={form.rjo} onChange={(e) => setForm((p) => ({ ...p, rjo: e.target.value }))}>
                    {SELECT_SIM_NAO.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1 text-xs text-slate-600">Use este campo para indicar se o aluno possui frequência adequada.</p>
                </div>

                {/* No lugar da frequência antiga */}
                <div>
                  <Label>Com notas boas, deveria continuar com o curso?</Label>
                  <Select value={form.frequencia} onChange={(e) => setForm((p) => ({ ...p, frequencia: e.target.value }))}>
                    {SELECT_SIM_NAO.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1 text-xs text-slate-600">
                    Campo de recomendação (usado para orientar a tratativa). Com “Notas = Boas”, geralmente é <b>Sim</b>.
                  </p>
                </div>

                <div>
                  <Label>Situação acadêmica</Label>
                  <Input
                    placeholder="Ex: Regular"
                    value={form.situacaoAcademica}
                    onChange={(e) => setForm((p) => ({ ...p, situacaoAcademica: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Observações (frequência / notas / contexto)</Label>
                  <Textarea
                    rows={2}
                    placeholder="Detalhes relevantes..."
                    value={form.rjoDetalhes}
                    onChange={(e) => setForm((p) => ({ ...p, rjoDetalhes: e.target.value }))}
                  />
                </div>
              </div>
            </Card>
          </section>

          <section id="historico">
            <Card title="Histórico / Trancamentos" subtitle="Histórico do aluno e trancamentos anteriores.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Qtd. trancamentos</Label>
                  <Select value={form.qtdTrancamentos} onChange={(e) => setForm((p) => ({ ...p, qtdTrancamentos: e.target.value }))}>
                    {SELECT_QTD_TRANC.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Último trancamento</Label>
                  <Input
                    placeholder="Ex: 2024/2"
                    value={form.ultimoTrancamento}
                    onChange={(e) => setForm((p) => ({ ...p, ultimoTrancamento: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Trancar sem perder benefício</Label>
                  <Input
                    placeholder="Descreva"
                    value={form.trancarSemPerderBeneficio}
                    onChange={(e) => setForm((p) => ({ ...p, trancarSemPerderBeneficio: e.target.value }))}
                  />
                </div>
              </div>
            </Card>
          </section>

          <section id="proposta">
            <Card title="Proposta / Solução" subtitle="Alternativas e proposta final.">
              <Label>Proposta</Label>
              <Textarea
                rows={3}
                placeholder="Descreva a proposta/sugestão..."
                value={form.proposta}
                onChange={(e) => setForm((p) => ({ ...p, proposta: e.target.value }))}
              />

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Prazos (Trancamento)</Label>
                  <Select
                    value={form.prazoTrancamento}
                    onChange={(e) => setForm((p) => ({ ...p, prazoTrancamento: e.target.value }))}
                    disabled={bloqueiaTrancamento}
                  >
                    <option value="">Selecione</option>
                    {PRAZOS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                  {bloqueiaTrancamento && (
                    <p className="mt-1 text-xs text-slate-600">Campo desabilitado porque Trancamento não é permitido neste caso.</p>
                  )}
                </div>

                <div>
                  <Label>Prazos (Cancelamento)</Label>
                  <Select value={form.prazoCancelamento} onChange={(e) => setForm((p) => ({ ...p, prazoCancelamento: e.target.value }))}>
                    <option value="">Selecione</option>
                    {PRAZOS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Card>
          </section>

          <section id="etapaFinal">
            <Card title="Etapa Final" subtitle="Fechamento e observações finais.">
              <Label>Fechamento</Label>
              <Textarea
                rows={3}
                placeholder="Conclusão do atendimento..."
                value={form.fechamento}
                onChange={(e) => setForm((p) => ({ ...p, fechamento: e.target.value }))}
              />
            </Card>
          </section>

          <section id="salvos">
            <Card title="Atendimentos Salvos" subtitle="Lista de registros salvos no sistema.">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full bg-white">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Matrícula</th>
                      <th className="px-4 py-3">Tipo curso</th>
                      <th className="px-4 py-3">Curso</th>
                      <th className="px-4 py-3">Período</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Motivo</th>
                      <th className="px-4 py-3">Criado em</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atendimentos.map((a) => (
                      <tr key={a.id} className="border-t border-slate-200 text-sm">
                        <td className="px-4 py-3">{a.id}</td>
                        <td className="px-4 py-3">{a.nomeCompletoAluno}</td>
                        <td className="px-4 py-3">{a.numeroMatricula}</td>
                        <td className="px-4 py-3">{a.tipoCurso || "-"}</td>
                        <td className="px-4 py-3">{a.curso || "-"}</td>
                        <td className="px-4 py-3">{a.periodo || "-"}</td>
                        <td className="px-4 py-3">{a.tipoSolicitacao || "-"}</td>
                        <td className="px-4 py-3">{a.motivoSolicitacao || "-"}</td>
                        <td className="px-4 py-3">{formatDateTimeBR(a.criadoEm)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                preencherParaEdicao(a);
                                scrollTo("inicial");
                              }}
                              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => remover(a.id)}
                              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {atendimentos.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={10}>
                          Nenhum atendimento salvo ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </div>
      </main>

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-red-700 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}