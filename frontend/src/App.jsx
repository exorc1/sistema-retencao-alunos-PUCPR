import React, { useEffect, useMemo, useState } from "react";

/**
 * ✅ Render: defina VITE_API_URL = https://SEU-BACKEND.onrender.com
 * ✅ Local: cai em http://localhost:8081
 */
const API_BASE_RAW = import.meta.env.VITE_API_URL || "http://localhost:8081";
const API_BASE = String(API_BASE_RAW).replace(/\/+$/, "");
const API_URL = `${API_BASE}/api/atendimentos`;
const RELATORIO_RESUMO_URL = `${API_BASE}/api/relatorios/atendimentos/resumo`;
const RELATORIO_CSV_URL = `${API_BASE}/api/relatorios/atendimentos/exportar.csv`;
const RELATORIO_XLSX_URL = `${API_BASE}/api/relatorios/atendimentos/exportar.xlsx`;

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
  { id: "relatorios", label: "Relatórios" },
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

  notas: "Selecione",
  rjo: "Selecione",
  rjoDetalhes: "",
  frequencia: "Selecione",
  situacaoAcademica: "",

  qtdTrancamentos: "Selecione",
  ultimoTrancamento: "",
  trancarSemPerderBeneficio: "",

  proposta: "",
  prazoTrancamento: "",
  prazoCancelamento: "",

  fechamento: "",
};

function Label({ children }) {
  return <label className="text-sm font-semibold text-slate-700">{children}</label>;
}

function Input({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={
        "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 " +
        className
      }
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={
        "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 " +
        className
      }
    >
      {children}
    </select>
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={
        "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 " +
        className
      }
    />
  );
}

function Card({ title, subtitle, children, right }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {right ? <div className="pt-1">{right}</div> : null}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

function Button({ variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-[#7a0026] text-white hover:brightness-110 focus:ring-4 focus:ring-[#7a0026]/15",
    subtle: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-4 focus:ring-slate-200",
    danger: "bg-rose-600 text-white hover:brightness-110 focus:ring-4 focus:ring-rose-200",
    outline:
      "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 focus:ring-4 focus:ring-slate-100",
  };
  return <button {...props} className={`${base} ${styles[variant]} ${className}`} />;
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value ?? 0}</div>
    </div>
  );
}

function SimpleTable({ title, data }) {
  const entries = Object.entries(data || {});
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      </div>
      <div className="max-h-72 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Qtd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={2}>
                  Sem dados.
                </td>
              </tr>
            ) : (
              entries.map(([k, v]) => (
                <tr key={k}>
                  <td className="px-4 py-3">{k}</td>
                  <td className="px-4 py-3 font-semibold">{v}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const [activeStep, setActiveStep] = useState("inicial");
  const [form, setForm] = useState(initialForm);

  const [medicinaPrimeiroPeriodo, setMedicinaPrimeiroPeriodo] = useState("Selecione");

  const [atendimentos, setAtendimentos] = useState([]);
  const [relatorio, setRelatorio] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);
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

  const menorMsg = useMemo(() => {
    if (!form.menorDeIdade) return "—";
    return form.menorDeIdade === "Sim"
      ? "Menor de idade: solicitar responsável no atendimento."
      : "Maior de idade.";
  }, [form.menorDeIdade]);

  async function carregarAtendimentos() {
    try {
      const r = await fetch(API_URL);
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`Erro ao carregar (${r.status}): ${t}`);
      }
      const data = await r.json();
      setAtendimentos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setAtendimentos([]);
      setToast(e?.message || "Falha ao carregar atendimentos.");
      setTimeout(() => setToast(""), 3000);
    }
  }

  async function carregarRelatorio() {
    try {
      setLoadingRelatorio(true);
      const r = await fetch(RELATORIO_RESUMO_URL);
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`Erro ao carregar relatório (${r.status}): ${t}`);
      }
      const data = await r.json();
      setRelatorio(data);
    } catch (e) {
      console.error(e);
      setRelatorio(null);
      setToast(e?.message || "Falha ao carregar relatório.");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setLoadingRelatorio(false);
    }
  }

  function exportarCsv() {
    window.open(RELATORIO_CSV_URL, "_blank");
  }

  function exportarExcel() {
    window.open(RELATORIO_XLSX_URL, "_blank");
  }

  useEffect(() => {
    carregarAtendimentos();
    carregarRelatorio();
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
      await carregarRelatorio();
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
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`Falha ao remover (${r.status}): ${t}`);
      }
      setToast("Removido com sucesso.");
      await carregarAtendimentos();
      await carregarRelatorio();
    } catch (e) {
      console.error(e);
      setToast(e?.message || "Erro ao remover.");
    } finally {
      setTimeout(() => setToast(""), 2500);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7a0026] text-white shadow-sm">
              <span className="text-sm font-black">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight">Sistema de Retenção de Alunos</h1>
                <Pill>Modelo institucional</Pill>
              </div>
              <p className="text-xs text-slate-600">Atendimento / Retenção — formulário + histórico</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={carregarRelatorio} disabled={loadingRelatorio}>
              {loadingRelatorio ? "Atualizando..." : "Atualizar Relatório"}
            </Button>
            <Button variant="outline" onClick={exportarExcel}>
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={exportarCsv}>
              CSV
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20 lg:h-[calc(100vh-120px)] lg:overflow-auto">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Etapas</p>
            <p className="mt-1 text-sm text-slate-700">Navegue por seções.</p>
          </div>

          <nav className="space-y-1">
            {steps.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => scrollTo(it.id)}
                className={[
                  "w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                  activeStep === it.id ? "bg-[#7a0026]/10 text-[#7a0026]" : "text-slate-700 hover:bg-slate-100",
                ].join(" ")}
              >
                {it.label}
              </button>
            ))}
          </nav>

          <div className="mt-5 rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-bold text-slate-700">Status</p>
            <p className="mt-1 text-xs text-slate-600">{editingId ? `Editando atendimento #${editingId}` : "Novo atendimento"}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={resetForm} disabled={loading}>
                Limpar
              </Button>
              <Button className="flex-1" onClick={salvar} disabled={loading}>
                {loading ? "Salvando..." : editingId ? "Atualizar" : "Gravar e Enviar"}
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold text-slate-700">Aviso</p>
            <p className="mt-1 text-xs text-slate-600">{menorMsg}</p>
          </div>
        </aside>

        <main className="space-y-5">
          {toast ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm">
              {toast}
            </div>
          ) : null}

          <section id="inicial">
            <Card title="Formulário Inicial" subtitle="Dados básicos do aluno e do curso.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Tipo de curso *</Label>
                  <Select value={form.tipoCurso} onChange={(e) => setForm((p) => ({ ...p, tipoCurso: e.target.value }))}>
                    {SELECT_TIPO_CURSO.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </div>

                <div>
                  <Label>Número de matrícula *</Label>
                  <Input
                    placeholder="Ex: 40107530"
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
                    placeholder="Ex: Psicologia, Direito, Medicina"
                    value={form.curso}
                    onChange={(e) => setForm((p) => ({ ...p, curso: e.target.value }))}
                  />
                </div>

                {isMed && (
                  <div>
                    <Label>É 1º período? (somente Medicina)</Label>
                    <Select value={medicinaPrimeiroPeriodo} onChange={(e) => setMedicinaPrimeiroPeriodo(e.target.value)}>
                      {SELECT_SIM_NAO.map((o) => <option key={o} value={o}>{o}</option>)}
                    </Select>

                    {bloqueiaTrancamento && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <b>⚠ Atenção:</b> Medicina no <b>1º período</b> não pode <b>Trancar</b>.
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label>Período</Label>
                  <Input
                    placeholder="Ex: 1º, 2º, 3"
                    value={form.periodo}
                    onChange={(e) => setForm((p) => ({ ...p, periodo: e.target.value }))}
                  />
                </div>
              </div>
            </Card>
          </section>

          <section id="gravacao">
            <Card title="Gravação / Nascimento" subtitle="Registro da gravação e dados de idade." right={<Pill>{menorMsg}</Pill>}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Gravação da conversa</Label>
                  <Select
                    value={form.atendimentoGravado === true ? "Sim" : form.atendimentoGravado === false ? "Não" : "Selecione"}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        atendimentoGravado: e.target.value === "Sim" ? true : e.target.value === "Não" ? false : null,
                      }))
                    }
                  >
                    {SELECT_SIM_NAO.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </div>

                <div>
                  <Label>Data de nascimento</Label>
                  <Input type="date" value={form.dataNascimento} onChange={(e) => setForm((p) => ({ ...p, dataNascimento: e.target.value }))} />
                </div>

                <div>
                  <Label>Idade</Label>
                  <Input value={form.idade} readOnly className="bg-slate-50" />
                </div>

                <div>
                  <Label>Responsável próximo? (se menor)</Label>
                  <Select value={form.responsavelProximo} onChange={(e) => setForm((p) => ({ ...p, responsavelProximo: e.target.value }))}>
                    {SELECT_RESPONSAVEL.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </div>

                {form.menorDeIdade === "Sim" && form.responsavelProximo !== "Sim" && (
                  <div className="md:col-span-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                    <b>⚠ Menor de idade:</b> chame o responsável para prosseguir.
                    <div className="mt-3">
                      <Label>Data/Hora para retorno (responsável)</Label>
                      <Input
                        type="datetime-local"
                        value={form.retornoResponsavelEm}
                        onChange={(e) => setForm((p) => ({ ...p, retornoResponsavelEm: e.target.value }))}
                      />
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
                rows={5}
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
                      return <option key={o} value={o} disabled={disabled}>{o}</option>;
                    })}
                  </Select>
                </div>

                <div>
                  <Label>Motivo da Solicitação</Label>
                  <Select value={form.motivoSolicitacao} onChange={(e) => setForm((p) => ({ ...p, motivoSolicitacao: e.target.value }))}>
                    {SELECT_MOTIVO.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </div>
              </div>
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
                    {SELECT_NOTAS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                  {sugestaoContinuar ? <p className="mt-2 text-xs text-slate-500">{sugestaoContinuar}</p> : null}
                </div>

                <div>
                  <Label>Frequência (Sim/Não)</Label>
                  <Select value={form.rjo} onChange={(e) => setForm((p) => ({ ...p, rjo: e.target.value }))}>
                    {SELECT_SIM_NAO.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </div>

                <div>
                  <Label>Com notas boas, deveria continuar com o curso?</Label>
                  <Select value={form.frequencia} onChange={(e) => setForm((p) => ({ ...p, frequencia: e.target.value }))}>
                    {SELECT_SIM_NAO.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
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
                  <Label>Observações</Label>
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
                    {SELECT_QTD_TRANC.map((o) => <option key={o} value={o}>{o}</option>)}
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
                    placeholder="Ex: Sim, via bolsa / Não"
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
                  <Select value={form.prazoTrancamento} onChange={(e) => setForm((p) => ({ ...p, prazoTrancamento: e.target.value }))}>
                    <option value="">Selecione</option>
                    {PRAZOS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </div>

                <div>
                  <Label>Prazos (Cancelamento)</Label>
                  <Select value={form.prazoCancelamento} onChange={(e) => setForm((p) => ({ ...p, prazoCancelamento: e.target.value }))}>
                    <option value="">Selecione</option>
                    {PRAZOS.map((p) => <option key={p} value={p}>{p}</option>)}
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
            <Card
              title="Atendimentos Salvos"
              subtitle="Lista de registros salvos no sistema."
              right={
                <Button variant="subtle" onClick={carregarAtendimentos} disabled={loading}>
                  Atualizar
                </Button>
              }
            >
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full bg-white">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Matrícula</th>
                      <th className="px-4 py-3">Curso</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Motivo</th>
                      <th className="px-4 py-3">Retorno em</th>
                      <th className="px-4 py-3">Criado em</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {atendimentos.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-center text-sm text-slate-600" colSpan={9}>
                          Nenhum atendimento salvo ainda.
                        </td>
                      </tr>
                    ) : (
                      atendimentos.map((a) => (
                        <tr key={a.id} className="text-sm text-slate-800">
                          <td className="px-4 py-3 font-semibold">{a.id}</td>
                          <td className="px-4 py-3">{a.nomeCompletoAluno ?? "-"}</td>
                          <td className="px-4 py-3">{a.numeroMatricula ?? "-"}</td>
                          <td className="px-4 py-3">{a.curso || "-"}</td>
                          <td className="px-4 py-3">{a.tipoSolicitacao || "-"}</td>
                          <td className="px-4 py-3">{a.motivoSolicitacao || "-"}</td>
                          <td className="px-4 py-3">{a.retornoResponsavelEm ? formatDateTimeBR(a.retornoResponsavelEm) : "-"}</td>
                          <td className="px-4 py-3">{formatDateTimeBR(a.criadoEm)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  preencherParaEdicao(a);
                                  scrollTo("inicial");
                                }}
                              >
                                Editar
                              </Button>
                              <Button variant="danger" onClick={() => remover(a.id)}>
                                Remover
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          <section id="relatorios">
            <Card
              title="Relatórios"
              subtitle="Resumo geral dos atendimentos e exportação completa."
              right={
                <div className="flex gap-2">
                  <Button variant="outline" onClick={carregarRelatorio} disabled={loadingRelatorio}>
                    {loadingRelatorio ? "Atualizando..." : "Atualizar"}
                  </Button>
                  <Button onClick={exportarExcel}>Exportar Excel</Button>
                  <Button variant="outline" onClick={exportarCsv}>CSV</Button>
                </div>
              }
            >
              {!relatorio ? (
                <div className="text-sm text-slate-500">Relatório indisponível no momento.</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <StatCard label="Total de atendimentos" value={relatorio.totalAtendimentos} />
                    <StatCard label="Menores de idade" value={relatorio.totalMenores} />
                    <StatCard label="Com retorno agendado" value={relatorio.totalComRetornoAgendado} />
                    <StatCard label="Retornos vencidos" value={relatorio.totalRetornosVencidos} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <SimpleTable title="Por tipo de curso" data={relatorio.porTipoCurso} />
                    <SimpleTable title="Por tipo de solicitação" data={relatorio.porTipoSolicitacao} />
                    <SimpleTable title="Por motivo" data={relatorio.porMotivoSolicitacao} />
                    <SimpleTable title="Por curso" data={relatorio.porCurso} />
                    <SimpleTable title="Por notas" data={relatorio.porNotas} />
                    <SimpleTable title="Por frequência" data={relatorio.porFrequencia} />
                    <SimpleTable title="Campos preenchidos" data={relatorio.camposPreenchidos} />
                  </div>
                </div>
              )}
            </Card>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs text-slate-600">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} • Sistema de Retenção de Alunos</span>
              <span className="text-slate-500">PUCPR</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}