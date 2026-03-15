import React, { useEffect, useMemo, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8081").replace(/\/+$/, "");

const endpoints = {
  login: `${API_BASE}/api/auth/login`,
  logout: `${API_BASE}/api/auth/logout`,
  me: `${API_BASE}/api/auth/me`,
  atendimentos: `${API_BASE}/api/atendimentos`,
  usuarios: `${API_BASE}/api/usuarios`,
  relatorioResumo: `${API_BASE}/api/relatorios/atendimentos/resumo`,
  relatorioCsv: `${API_BASE}/api/relatorios/atendimentos/exportar.csv`,
  relatorioXlsx: `${API_BASE}/api/relatorios/atendimentos/exportar.xlsx`,
};

const emptyAtendimento = {
  tipoCurso: "",
  nomeCompletoAluno: "",
  numeroMatricula: "",
  curso: "",
  periodo: "",
  atendimentoGravado: false,
  dataNascimento: "",
  idade: "",
  menorDeIdade: false,
  responsavelProximo: "",
  retornoResponsavelEm: "",
  diagnosticoExterno: "",
  tipoSolicitacao: "",
  motivoSolicitacao: "",
  diagnosticoInterno: "",
  relacaoCurso: "",
  notas: "",
  rjo: "",
  rjoDetalhes: "",
  frequencia: "",
  situacaoAcademica: "",
  qtdTrancamentos: "",
  ultimoTrancamento: "",
  trancarSemPerderBeneficio: "",
  proposta: "",
  prazoTrancamento: "",
  prazoCancelamento: "",
  fechamento: "",
};

const emptyUsuario = {
  nome: "",
  username: "",
  senha: "",
  role: "ATENDENTE",
  ativo: true,
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [me, setMe] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", senha: "" });

  const [tab, setTab] = useState("atendimentos");

  const [atendimentos, setAtendimentos] = useState([]);
  const [atendimentoForm, setAtendimentoForm] = useState(emptyAtendimento);
  const [editingAtendimentoId, setEditingAtendimentoId] = useState(null);

  const [usuarios, setUsuarios] = useState([]);
  const [usuarioForm, setUsuarioForm] = useState(emptyUsuario);
  const [editingUsuarioId, setEditingUsuarioId] = useState(null);
  const [senhaReset, setSenhaReset] = useState({});

  const [resumo, setResumo] = useState(null);

  const isAdmin = me?.role === "ADMIN";

  async function api(url, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      throw new Error("Acesso negado.");
    }

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      if (contentType.includes("application/json")) {
        const err = await response.json();
        throw new Error(err.message || "Erro na requisição.");
      }
      throw new Error("Erro na requisição.");
    }

    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response;
  }

  async function loadMe() {
    const data = await api(endpoints.me);
    setMe(data);
  }

  async function loadAtendimentos() {
    const data = await api(endpoints.atendimentos);
    setAtendimentos(data);
  }

  async function loadUsuarios() {
    if (!isAdmin) return;
    const data = await api(endpoints.usuarios);
    setUsuarios(data);
  }

  async function loadResumo() {
    if (!isAdmin) return;
    const data = await api(endpoints.relatorioResumo);
    setResumo(data);
  }

  useEffect(() => {
    if (!token) {
      setMe(null);
      return;
    }

    (async () => {
      try {
        setErro("");
        await loadMe();
      } catch {
        localStorage.removeItem("token");
        setToken("");
        setMe(null);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!me) return;

    loadAtendimentos().catch((e) => setErro(e.message));

    if (me.role === "ADMIN") {
      loadUsuarios().catch((e) => setErro(e.message));
      loadResumo().catch((e) => setErro(e.message));
    }
  }, [me]);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setErro("");
      const data = await api(endpoints.login, {
        method: "POST",
        body: JSON.stringify(loginForm),
      });

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setLoginForm({ username: "", senha: "" });
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      if (token) {
        await api(endpoints.logout, { method: "POST" });
      }
    } catch {
      // ignora
    } finally {
      localStorage.removeItem("token");
      setToken("");
      setMe(null);
      setAtendimentos([]);
      setUsuarios([]);
      setResumo(null);
      setTab("atendimentos");
    }
  }

  function onAtendimentoChange(e) {
    const { name, value, type, checked } = e.target;
    setAtendimentoForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function salvarAtendimento(e) {
    e.preventDefault();
    try {
      setErro("");

      const payload = {
        ...atendimentoForm,
        idade: atendimentoForm.idade === "" ? null : Number(atendimentoForm.idade),
        qtdTrancamentos: atendimentoForm.qtdTrancamentos === "" ? null : Number(atendimentoForm.qtdTrancamentos),
        retornoResponsavelEm: atendimentoForm.retornoResponsavelEm || null,
        dataNascimento: atendimentoForm.dataNascimento || null,
      };

      const url = editingAtendimentoId
        ? `${endpoints.atendimentos}/${editingAtendimentoId}`
        : endpoints.atendimentos;

      const method = editingAtendimentoId ? "PUT" : "POST";

      await api(url, {
        method,
        body: JSON.stringify(payload),
      });

      setAtendimentoForm(emptyAtendimento);
      setEditingAtendimentoId(null);
      await loadAtendimentos();
      if (isAdmin) await loadResumo();
    } catch (e2) {
      setErro(e2.message);
    }
  }

  function editarAtendimento(item) {
    setEditingAtendimentoId(item.id);
    setAtendimentoForm({
      ...emptyAtendimento,
      ...item,
      dataNascimento: item.dataNascimento || "",
      retornoResponsavelEm: item.retornoResponsavelEm || "",
      idade: item.idade ?? "",
      qtdTrancamentos: item.qtdTrancamentos ?? "",
    });
    setTab("atendimentos");
  }

  async function excluirAtendimento(id) {
    if (!window.confirm("Excluir este atendimento?")) return;
    try {
      await api(`${endpoints.atendimentos}/${id}`, { method: "DELETE" });
      await loadAtendimentos();
      if (isAdmin) await loadResumo();
    } catch (e2) {
      setErro(e2.message);
    }
  }

  function onUsuarioChange(e) {
    const { name, value, type, checked } = e.target;
    setUsuarioForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function salvarUsuario(e) {
    e.preventDefault();
    try {
      setErro("");

      const payload = { ...usuarioForm };
      if (editingUsuarioId && !payload.senha) {
        delete payload.senha;
      }

      const url = editingUsuarioId
        ? `${endpoints.usuarios}/${editingUsuarioId}`
        : endpoints.usuarios;

      const method = editingUsuarioId ? "PUT" : "POST";

      await api(url, {
        method,
        body: JSON.stringify(payload),
      });

      setUsuarioForm(emptyUsuario);
      setEditingUsuarioId(null);
      await loadUsuarios();
    } catch (e2) {
      setErro(e2.message);
    }
  }

  function editarUsuario(usuario) {
    setEditingUsuarioId(usuario.id);
    setUsuarioForm({
      nome: usuario.nome || "",
      username: usuario.username || "",
      senha: "",
      role: usuario.role || "ATENDENTE",
      ativo: Boolean(usuario.ativo),
    });
    setTab("usuarios");
  }

  async function trocarSenhaUsuario(id) {
    const novaSenha = senhaReset[id];
    if (!novaSenha) return;

    try {
      await api(`${endpoints.usuarios}/${id}/senha`, {
        method: "PUT",
        body: JSON.stringify({ novaSenha }),
      });
      setSenhaReset((prev) => ({ ...prev, [id]: "" }));
      alert("Senha alterada com sucesso.");
    } catch (e2) {
      setErro(e2.message);
    }
  }

  async function excluirUsuario(id) {
    if (!window.confirm("Excluir este usuário?")) return;
    try {
      await api(`${endpoints.usuarios}/${id}`, { method: "DELETE" });
      await loadUsuarios();
    } catch (e2) {
      setErro(e2.message);
    }
  }

  async function baixarArquivo(url, filename) {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Não foi possível baixar o arquivo.");
      }

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(fileUrl);
    } catch (e2) {
      setErro(e2.message);
    }
  }

  const atendimentoRows = useMemo(() => atendimentos || [], [atendimentos]);

  if (!token || !me) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1>Sistema de Retenção de Alunos</h1>
          <p>Entrar no sistema</p>
          {erro ? <div style={styles.error}>{erro}</div> : null}
          <form onSubmit={handleLogin} style={styles.form}>
            <input
              placeholder="Usuário"
              value={loginForm.username}
              onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
            />
            <input
              type="password"
              placeholder="Senha"
              value={loginForm.senha}
              onChange={(e) => setLoginForm((p) => ({ ...p, senha: e.target.value }))}
            />
            <button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1>Sistema de Retenção de Alunos</h1>
          <div>
            Logado como <strong>{me.nome}</strong> ({me.role})
          </div>
        </div>
        <button onClick={handleLogout}>Sair</button>
      </div>

      <div style={styles.tabs}>
        <button onClick={() => setTab("atendimentos")}>Atendimentos</button>
        {isAdmin && <button onClick={() => setTab("usuarios")}>Usuários</button>}
        {isAdmin && <button onClick={() => setTab("relatorios")}>Relatórios</button>}
      </div>

      {erro ? <div style={styles.error}>{erro}</div> : null}

      {tab === "atendimentos" && (
        <div style={styles.grid2}>
          <div style={styles.card}>
            <h2>{editingAtendimentoId ? "Editar atendimento" : "Novo atendimento"}</h2>
            <form onSubmit={salvarAtendimento} style={styles.form}>
              <input name="tipoCurso" placeholder="Tipo do curso" value={atendimentoForm.tipoCurso} onChange={onAtendimentoChange} />
              <input name="nomeCompletoAluno" placeholder="Nome completo do aluno" value={atendimentoForm.nomeCompletoAluno} onChange={onAtendimentoChange} />
              <input name="numeroMatricula" placeholder="Matrícula" value={atendimentoForm.numeroMatricula} onChange={onAtendimentoChange} />
              <input name="curso" placeholder="Curso" value={atendimentoForm.curso} onChange={onAtendimentoChange} />
              <input name="periodo" placeholder="Período" value={atendimentoForm.periodo} onChange={onAtendimentoChange} />
              <input type="date" name="dataNascimento" value={atendimentoForm.dataNascimento} onChange={onAtendimentoChange} />
              <input name="idade" placeholder="Idade" value={atendimentoForm.idade} onChange={onAtendimentoChange} />
              <label>
                <input type="checkbox" name="menorDeIdade" checked={Boolean(atendimentoForm.menorDeIdade)} onChange={onAtendimentoChange} />
                Menor de idade
              </label>
              <input name="responsavelProximo" placeholder="Responsável próximo" value={atendimentoForm.responsavelProximo} onChange={onAtendimentoChange} />
              <input type="datetime-local" name="retornoResponsavelEm" value={atendimentoForm.retornoResponsavelEm} onChange={onAtendimentoChange} />
              <input name="tipoSolicitacao" placeholder="Tipo da solicitação" value={atendimentoForm.tipoSolicitacao} onChange={onAtendimentoChange} />
              <input name="motivoSolicitacao" placeholder="Motivo da solicitação" value={atendimentoForm.motivoSolicitacao} onChange={onAtendimentoChange} />
              <input name="notas" placeholder="Notas" value={atendimentoForm.notas} onChange={onAtendimentoChange} />
              <input name="rjo" placeholder="RJO" value={atendimentoForm.rjo} onChange={onAtendimentoChange} />
              <input name="frequencia" placeholder="Frequência" value={atendimentoForm.frequencia} onChange={onAtendimentoChange} />
              <input name="situacaoAcademica" placeholder="Situação acadêmica" value={atendimentoForm.situacaoAcademica} onChange={onAtendimentoChange} />
              <input name="qtdTrancamentos" placeholder="Qtd. trancamentos" value={atendimentoForm.qtdTrancamentos} onChange={onAtendimentoChange} />
              <input name="ultimoTrancamento" placeholder="Último trancamento" value={atendimentoForm.ultimoTrancamento} onChange={onAtendimentoChange} />
              <input name="trancarSemPerderBeneficio" placeholder="Trancar sem perder benefício" value={atendimentoForm.trancarSemPerderBeneficio} onChange={onAtendimentoChange} />
              <input name="prazoTrancamento" placeholder="Prazo trancamento" value={atendimentoForm.prazoTrancamento} onChange={onAtendimentoChange} />
              <input name="prazoCancelamento" placeholder="Prazo cancelamento" value={atendimentoForm.prazoCancelamento} onChange={onAtendimentoChange} />
              <textarea name="diagnosticoExterno" placeholder="Diagnóstico externo" value={atendimentoForm.diagnosticoExterno} onChange={onAtendimentoChange} />
              <textarea name="diagnosticoInterno" placeholder="Diagnóstico interno" value={atendimentoForm.diagnosticoInterno} onChange={onAtendimentoChange} />
              <textarea name="relacaoCurso" placeholder="Relação com o curso" value={atendimentoForm.relacaoCurso} onChange={onAtendimentoChange} />
              <textarea name="rjoDetalhes" placeholder="Detalhes RJO" value={atendimentoForm.rjoDetalhes} onChange={onAtendimentoChange} />
              <textarea name="proposta" placeholder="Proposta" value={atendimentoForm.proposta} onChange={onAtendimentoChange} />
              <textarea name="fechamento" placeholder="Fechamento" value={atendimentoForm.fechamento} onChange={onAtendimentoChange} />

              <div style={styles.row}>
                <button type="submit">{editingAtendimentoId ? "Salvar edição" : "Criar atendimento"}</button>
                {editingAtendimentoId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAtendimentoId(null);
                      setAtendimentoForm(emptyAtendimento);
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={styles.card}>
            <h2>Lista de atendimentos</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Aluno</th>
                    <th>Curso</th>
                    <th>Atendente</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {atendimentoRows.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.nomeCompletoAluno}</td>
                      <td>{item.curso}</td>
                      <td>{item.atendenteNome || item.atendenteUsername}</td>
                      <td>
                        <button onClick={() => editarAtendimento(item)}>Editar</button>
                        {isAdmin && (
                          <button onClick={() => excluirAtendimento(item.id)} style={{ marginLeft: 8 }}>
                            Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {atendimentoRows.length === 0 && (
                    <tr>
                      <td colSpan="5">Nenhum atendimento encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "usuarios" && isAdmin && (
        <div style={styles.grid2}>
          <div style={styles.card}>
            <h2>{editingUsuarioId ? "Editar usuário" : "Novo usuário"}</h2>
            <form onSubmit={salvarUsuario} style={styles.form}>
              <input name="nome" placeholder="Nome" value={usuarioForm.nome} onChange={onUsuarioChange} />
              <input name="username" placeholder="Username" value={usuarioForm.username} onChange={onUsuarioChange} />
              <input name="senha" type="password" placeholder={editingUsuarioId ? "Nova senha opcional" : "Senha"} value={usuarioForm.senha} onChange={onUsuarioChange} />
              <select name="role" value={usuarioForm.role} onChange={onUsuarioChange}>
                <option value="ATENDENTE">ATENDENTE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <label>
                <input type="checkbox" name="ativo" checked={Boolean(usuarioForm.ativo)} onChange={onUsuarioChange} />
                Ativo
              </label>

              <div style={styles.row}>
                <button type="submit">{editingUsuarioId ? "Salvar usuário" : "Criar usuário"}</button>
                {editingUsuarioId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUsuarioId(null);
                      setUsuarioForm(emptyUsuario);
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={styles.card}>
            <h2>Usuários</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Ativo</th>
                    <th>Senha</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nome}</td>
                      <td>{u.username}</td>
                      <td>{u.role}</td>
                      <td>{String(u.ativo)}</td>
                      <td>
                        <input
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
                        <button onClick={() => trocarSenhaUsuario(u.id)}>Trocar</button>
                      </td>
                      <td>
                        <button onClick={() => editarUsuario(u)}>Editar</button>
                        <button onClick={() => excluirUsuario(u.id)} style={{ marginLeft: 8 }}>
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan="6">Nenhum usuário encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "relatorios" && isAdmin && (
        <div style={styles.grid2}>
          <div style={styles.card}>
            <h2>Resumo</h2>
            {resumo ? (
              <div style={styles.form}>
                <div>Total de atendimentos: {resumo.totalAtendimentos}</div>
                <div>Total de menores: {resumo.totalMenores}</div>
                <div>Com retorno agendado: {resumo.totalComRetornoAgendado}</div>
                <div>Retornos vencidos: {resumo.totalRetornosVencidos}</div>
              </div>
            ) : (
              <div>Carregando...</div>
            )}
          </div>

          <div style={styles.card}>
            <h2>Exportação</h2>
            <div style={styles.row}>
              <button onClick={() => baixarArquivo(endpoints.relatorioCsv, "relatorio-atendimentos.csv")}>
                Baixar CSV
              </button>
              <button onClick={() => baixarArquivo(endpoints.relatorioXlsx, "relatorio-atendimentos.xlsx")}>
                Baixar XLSX
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: 24,
    fontFamily: "Arial, sans-serif",
    background: "#f8fafc",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    background: "#fff",
    padding: 16,
    borderRadius: 12,
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  form: {
    display: "grid",
    gap: 10,
  },
  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  grid2: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "1fr 1fr",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
};

export default App;