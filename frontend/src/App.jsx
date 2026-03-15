import React, { useEffect, useMemo, useState } from "react";

/**
 * Render:
 * VITE_API_URL=https://SEU-BACKEND.onrender.com
 *
 * Local:
 * cai em http://localhost:8081
 */
const API_BASE_RAW = import.meta.env.VITE_API_URL || "http://localhost:8081";
const API_BASE = String(API_BASE_RAW).replace(/\/+$/, "");

const API_URL = `${API_BASE}/api/atendimentos`;
const RELATORIO_RESUMO_URL = `${API_BASE}/api/relatorios/atendimentos/resumo`;
const RELATORIO_CSV_URL = `${API_BASE}/api/relatorios/atendimentos/exportar.csv`;
const RELATORIO_XLSX_URL = `${API_BASE}/api/relatorios/atendimentos/exportar.xlsx`;

const AUTH_LOGIN_URL = `${API_BASE}/api/auth/login`;
const AUTH_LOGOUT_URL = `${API_BASE}/api/auth/logout`;

const USUARIOS_URL = `${API_BASE}/api/usuarios`;

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

const baseSteps = [
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
  { id: "usuarios", label: "Usuários" },
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
const SELECT_ROLES = ["ADMIN", "ATENDENTE"];

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

const initialUsuarioForm = {
  nome: "",
  username: "",
  senha: "",
  role: "ATENDENTE",
  ativo: true,
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
  const [auth, setAuth] = useState({
    token: localStorage.getItem("token") || "",
    role: localStorage.getItem("role") || "",
    nome: localStorage.getItem("nome") || "",
    username: localStorage.getItem("username") || "",
  });

  const [loginForm, setLoginForm] = useState({
    username: "",
    senha: "",
  });

  const [activeStep, setActiveStep] = useState("inicial");
  const [form, setForm] = useState(initialForm);
  const [medicinaPrimeiroPeriodo, setMedicinaPrimeiroPeriodo] = useState("Selecione");
  const [atendimentos, setAtendimentos] = useState([]);
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");

  const [usuarios, setUsuarios] = useState([]);
  const [usuarioForm, setUsuarioForm] = useState(initialUsuarioForm);
  const [editingUsuarioId, setEditingUsuarioId] = useState(null);
  const [senhaReset, setSenhaReset] = useState({});
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const isAdmin = auth.role === "ADMIN";

  const steps = useMemo(
    () => baseSteps.filter((s) => {
      if (s.id === "relatorios" && !isAdmin) return false;
      if (s.id === "usuarios" && !isAdmin) return false;
      return true;
    }),
    [isAdmin]
  );

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

  function authHeaders(extra = {}) {
    return {
      ...extra,
      Authorization: `Bearer ${auth.token}`,
    };
  }

  function showToast(msg, ms = 3000) {
    setToast(msg);
    if (ms > 0) {
      setTimeout(() => setToast(""), ms);
    }
  }

  async function fetchJson(url, options = {}) {
    const r = await fetch(url, options);
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(text || `Erro ${r.status}`);
    }
    return r.json();
  }

  async function fazerLogin(e) {
    e?.preventDefault?.();

    try {
      const r = await fetch(AUTH_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`Falha no login (${r.status}): ${t}`);
      }

      const data = await r.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("nome", data.nome || "");
      localStorage.setItem("username", data.username || "");

      setAuth({
        token: data.token,
        role: data.role,
        nome: data.nome || "",
        username: data.username || "",
      });

      showToast("Login realizado com sucesso.", 2500);
    } catch (e2) {
      console.error(e2);
      showToast(e2?.message || "Erro ao fazer login.");
    }
  }

  async function fazerLogout() {
    try {
      if (auth.token) {
        await fetch(AUTH_LOGOUT_URL, {
          method: "POST",
          headers: authHeaders(),
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("nome");
      localStorage.removeItem("username");

      setAuth({ token: "", role: "", nome: "", username: "" });
      setLoginForm({ username: "", senha: "" });
      setAtendimentos([]);
      setRelatorio(null);
      setUsuarios([]);
      setEditingId(null);
      setEditingUsuarioId(null);
      setForm(initialForm);
      setUsuarioForm(initialUsuarioForm);
    }
  }

  async function carregarAtendimentos() {
    try {
      const data = await fetchJson(API_URL, {
        headers: authHeaders(),
      });
      setAtendimentos(Array.isArray(data) ? data : []);
    } catch (e2) {
      console.error(e2);
      setAtendimentos([]);
      showToast(e2?.message || "Falha ao carregar atendimentos.");
    }
  }

  async function carregarRelatorio() {
    if (!isAdmin) return;
    try {
      setLoadingRelatorio(true);
      const data = await fetchJson(RELATORIO_RESUMO_URL, {
        headers: authHeaders(),
      });
      setRelatorio(data);
    } catch (e2) {
      console.error(e2);
      setRelatorio(null);
      showToast(e2?.message || "Falha ao carregar relatório.");
    } finally {
      setLoadingRelatorio(false);
    }
  }

  async function carregarUsuarios() {
    if (!isAdmin) return;
    try {
      setLoadingUsuarios(true);
      const data = await fetchJson(USUARIOS_URL, {
        headers: authHeaders(),
      });
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e2) {
      console.error(e2);
      setUsuarios([]);
      showToast(e2?.message || "Falha ao carregar usuários.");
    } finally {
      setLoadingUsuarios(false);
    }
  }

  async function baixarArquivoComToken(url, nomeArquivo) {
    try {
      const response = await fetch(url, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        throw new Error(txt || `Falha ao baixar arquivo (${response.status})`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (e2) {
      console.error(e2);
      showToast(e2?.message || "Erro ao baixar arquivo.");
    }
  }

  function exportarCsv() {
    baixarArquivoComToken(RELATORIO_CSV_URL, "relatorio-atendimentos.csv");
  }

  function exportarExcel() {
    baixarArquivoComToken(RELATORIO_XLSX_URL, "relatorio-atendimentos.xlsx");
  }

  useEffect(() => {
    if (auth.token) {
      carregarAtendimentos();
      if (isAdmin) {
        carregarRelatorio();
        carregarUsuarios();
      }
    }
  }, [auth.token, isAdmin]);

  useEffect(() => {
    if (bloqueiaTrancamento && form.tipoSolicitacao === "Trancamento") {
      setForm((p) => ({ ...p, tipoSolicitacao: "Cancelamento" }));
      showToast("Medicina no 1º período não permite Trancamento. Ajustei para Cancelamento.", 3500);
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

  function resetUsuarioForm() {
    setUsuarioForm(initialUsuarioForm);
    setEditingUsuarioId(null);
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
          showToast("Menor de idade sem responsável: informe a data/hora de retorno.");
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
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`Erro ao salvar (${r.status}): ${t}`);
      }

      showToast(isEdit ? "Atendimento atualizado com sucesso." : "Atendimento salvo com sucesso.", 2500);
      resetForm();
      await carregarAtendimentos();
      if (isAdmin) await carregarRelatorio();
      scrollTo("salvos");
    } catch (e2) {
      console.error(e2);
      showToast(e2?.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  async function salvarUsuario() {
    try {
      if (!usuarioForm.username?.trim()) {
        showToast("Informe o username.");
        return;
      }

      if (!editingUsuarioId && !usuarioForm.senha?.trim()) {
        showToast("Informe a senha.");
        return;
      }

      const payload = {
        nome: usuarioForm.nome,
        username: usuarioForm.username,
        role: usuarioForm.role,
        ativo: usuarioForm.ativo,
      };

      if (usuarioForm.senha?.trim()) {
        payload.senha = usuarioForm.senha;
      }

      const isEdit = !!editingUsuarioId;
      const url = isEdit ? `${USUARIOS_URL}/${editingUsuarioId}` : USUARIOS_URL;
      const method = isEdit ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`Erro ao salvar usuário (${r.status}): ${t}`);
      }

      showToast(isEdit ? "Usuário atualizado com sucesso." : "Usuário criado com sucesso.", 2500);
      resetUsuarioForm();
      await carregarUsuarios();
    } catch (e2) {
      console.error(e2);
      showToast(e2?.message || "Erro ao salvar usuário.");
    }
  }

  async function trocarSenhaUsuario(id) {
    try {
      const novaSenha = senhaReset[id];
      if (!novaSenha?.trim()) {
        showToast("Informe a nova senha.");
        return;
      }

      const r = await fetch(`${USUARIOS_URL}/${id}/senha`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ novaSenha }),
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`Erro ao trocar senha (${r.status}): ${t}`);
      }

      setSenhaReset((prev) => ({ ...prev, [id]: "" }));
      showToast("Senha alterada com sucesso.", 2500);
    } catch (e2) {
      console.error(e2);
      showToast(e2?.message || "Erro ao trocar senha.");
    }
  }

  async function excluirUsuario(id) {
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const r = await fetch(`${USUARIOS_URL}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`Erro ao excluir usuário (${r.status}): ${t}`);
      }

      showToast("Usuário removido com sucesso.", 2500);
      await carregarUsuarios();
    } catch (e2) {
      console.error(e2);
      showToast(e2?.message || "Erro ao excluir usuário.");
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

  function preencherUsuarioParaEdicao(u) {
    setEditingUsuarioId(u.id);
    setUsuarioForm({
      nome: u.nome ?? "",
      username: u.username ?? "",
      senha: "",
      role: u.role ?? "ATENDENTE",
      ativo: Boolean(u.ativo),
    });
  }

  async function remover(id) {
    if (!window.confirm("Tem certeza que deseja remover?")) return;
    try {
      const r = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        throw new Error(`Falha ao remover (${r.status}): ${t}`);
      }
      showToast("Removido com sucesso.", 2500);
      await carregarAtendimentos();
      if (isAdmin) await carregarRelatorio();
    } catch (e2) {
      console.error(e2);
      showToast(e2?.message || "Erro ao remover.");
    }
  }

  if (!auth.token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Entrar no sistema</h1>
          <p className="mt-1 text-sm text-slate-600">Use seu usuário e senha para acessar.</p>

          <form className="mt-6 space-y-4" onSubmit={fazerLogin}>
            <div>
              <Label>Usuário</Label>
              <Input
                value={loginForm.username}
                onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="Seu usuário"
              />
            </div>

            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={loginForm.senha}
                onChange={(e) => setLoginForm((p) => ({ ...p, senha: e.target.value }))}
                placeholder="Sua senha"
              />
            </div>

            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>

          {toast ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
              {toast}
            </div>
          ) : null}
        </div>
      </div>
    );
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
                <Pill>{auth.role}</Pill>
              </div>
              <p className="text-xs text-slate-600">Atendimento / Retenção — formulário + histórico</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => scrollTo("usuarios")}>
                  Usuários
                </Button>
                <Button variant="outline" onClick={carregarRelatorio} disabled={loadingRelatorio}>
                  {loadingRelatorio ? "Atualizando..." : "Atualizar Relatório"}
                </Button>
                <Button variant="outline" onClick={exportarExcel}>
                  Exportar Excel
                </Button>
                <Button variant="outline" onClick={exportarCsv}>
                  CSV
                </Button>
              </>
            )}

            <Button variant="outline" onClick={fazerLogout}>
              Sair
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
            <p className="mt-1 text-xs text-slate-600">
              {editingId ? `Editando atendimento #${editingId}` : "Novo atendimento"}
            </p>
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
            <p className="text-xs font-bold text-slate-700">Usuário</p>
            <p className="mt-1 text-xs text-slate-600">
              {auth.nome || auth.username} ({auth.role})
            </p>
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
                              {isAdmin && (
                                <Button variant="danger" onClick={() => remover(a.id)}>
                                  Remover
                                </Button>
                              )}
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

          {isAdmin && (
            <section id="usuarios">
              <Card
                title="Usuários"
                subtitle="Gestão de usuários do sistema."
                right={
                  <Button variant="subtle" onClick={carregarUsuarios} disabled={loadingUsuarios}>
                    {loadingUsuarios ? "Atualizando..." : "Atualizar"}
                  </Button>
                }
              >
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-sm font-bold text-slate-900">
                      {editingUsuarioId ? `Editar usuário #${editingUsuarioId}` : "Novo usuário"}
                    </h4>

                    <div className="mt-4 space-y-3">
                      <div>
                        <Label>Nome</Label>
                        <Input
                          value={usuarioForm.nome}
                          onChange={(e) => setUsuarioForm((p) => ({ ...p, nome: e.target.value }))}
                          placeholder="Nome completo"
                        />
                      </div>

                      <div>
                        <Label>Username</Label>
                        <Input
                          value={usuarioForm.username}
                          onChange={(e) => setUsuarioForm((p) => ({ ...p, username: e.target.value }))}
                          placeholder="usuario"
                        />
                      </div>

                      <div>
                        <Label>{editingUsuarioId ? "Nova senha (opcional)" : "Senha"}</Label>
                        <Input
                          type="password"
                          value={usuarioForm.senha}
                          onChange={(e) => setUsuarioForm((p) => ({ ...p, senha: e.target.value }))}
                          placeholder={editingUsuarioId ? "Deixe em branco para manter" : "Senha"}
                        />
                      </div>

                      <div>
                        <Label>Role</Label>
                        <Select
                          value={usuarioForm.role}
                          onChange={(e) => setUsuarioForm((p) => ({ ...p, role: e.target.value }))}
                        >
                          {SELECT_ROLES.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          id="ativo"
                          type="checkbox"
                          checked={usuarioForm.ativo}
                          onChange={(e) => setUsuarioForm((p) => ({ ...p, ativo: e.target.checked }))}
                        />
                        <label htmlFor="ativo" className="text-sm text-slate-700">
                          Usuário ativo
                        </label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button onClick={salvarUsuario}>
                          {editingUsuarioId ? "Salvar alterações" : "Criar usuário"}
                        </Button>
                        <Button variant="outline" onClick={resetUsuarioForm}>
                          Limpar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="min-w-full bg-white">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Nome</th>
                          <th className="px-4 py-3">Username</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Ativo</th>
                          <th className="px-4 py-3">Trocar senha</th>
                          <th className="px-4 py-3">Ações</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {usuarios.length === 0 ? (
                          <tr>
                            <td className="px-4 py-6 text-center text-sm text-slate-600" colSpan={7}>
                              Nenhum usuário encontrado.
                            </td>
                          </tr>
                        ) : (
                          usuarios.map((u) => (
                            <tr key={u.id} className="text-sm text-slate-800">
                              <td className="px-4 py-3 font-semibold">{u.id}</td>
                              <td className="px-4 py-3">{u.nome || "-"}</td>
                              <td className="px-4 py-3">{u.username}</td>
                              <td className="px-4 py-3">{u.role}</td>
                              <td className="px-4 py-3">{u.ativo ? "Sim" : "Não"}</td>
                              <td className="px-4 py-3">
                                <div className="flex min-w-[220px] gap-2">
                                  <Input
                                    type="password"
                                    placeholder="Nova senha"
                                    value={senhaReset[u.id] || ""}
                                    onChange={(e) =>
                                      setSenhaReset((prev) => ({
                                        ...prev,
                                        [u.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <Button variant="outline" onClick={() => trocarSenhaUsuario(u.id)}>
                                    Trocar
                                  </Button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button variant="outline" onClick={() => preencherUsuarioParaEdicao(u)}>
                                    Editar
                                  </Button>
                                  <Button variant="danger" onClick={() => excluirUsuario(u.id)}>
                                    Excluir
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {isAdmin && (
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
                      <SimpleTable title="Por frequência" data={relatorio.porFrequencia || relatorio.porRjo} />
                    </div>
                  </div>
                )}
              </Card>
            </section>
          )}

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