import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { get, post } from '../../lib/api';
import './imports.css';

type Escopo = 'PRIORITY_SEVEN' | 'FULL';
type Aba = 'sql' | 'legacy';
type Fase = 'RESTORE' | 'STAGING' | 'TRANSFORM';

type Lote = {
  id: string;
  source: string;
  status: string;
  stagingPhase?: string;
  rowCount: number;
  startedAt: string;
  finishedAt?: string | null;
  fileName?: string | null;
  fileBytes?: string | null;
  message?: string | null;
  importHeartbeat?: string | null;
  importControl?: string;
  importScope?: Escopo;
  currentImportTable?: string | null;
  restoreTotalBytes?: string | null;
  restoreProcessedBytes?: string | null;
  restoreScannedBytes?: string | null;
  completedImportChunks?: number;
};

type Bloco = {
  id: string;
  phase: string;
  sequence: number;
  sourceTable: string;
  status: string;
  rowCount: number;
  statementCount: number;
  endOffset?: string | null;
};

type PaginaBlocos = {
  items: Bloco[];
  total: number;
};

type Tabela = {
  id: string;
  sourceTable: string;
  targetEntity?: string | null;
  recordCount: number;
  writtenCount: number;
  skippedCount: number;
  failedCount: number;
  status: string;
  reason?: string | null;
};

type Resultado = {
  id: string;
  sourceTable: string;
  sourceKey: string;
  targetEntity: string;
  status: string;
  reasonCode?: string | null;
  explanation?: string | null;
};

type PaginaResultados = {
  items: Resultado[];
  total: number;
};

type Evento = {
  id: string;
  phase: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  sourceTable?: string | null;
  message: string;
  createdAt: string;
};

type Capacidade = {
  localImportEnabled: boolean;
  mappedEntities: string[];
};

const entidades = [
  ['people', 'Alunos'],
  ['companies', 'Empresas'],
  ['courses', 'Cursos'],
  ['groups', 'Turmas'],
  ['disciplines', 'Disciplinas'],
  ['enrollments', 'Matrículas'],
  ['attendance', 'Frequências'],
];

const rotulos: Record<string, string> = {
  UPLOADED: 'Arquivo recebido',
  RUNNING: 'Importando dados',
  PAUSED: 'Pausado',
  CANCELLED: 'Cancelado com dados preservados',
  FAILED: 'Requer atenção',
  STAGED: 'Preservação completa concluída',
  STAGED_PRIORITY: 'Cadastros prioritários preparados',
  PROMOTING: 'Transformando cadastros',
  PROMOTED_PARTIAL: 'Transformação disponível concluída',
  PREFLIGHT: 'Verificação',
  RESTORE: 'Restauração do SQL',
  STAGING: 'Preservação de registros',
  TRANSFORM: 'Transformação para o sistema',
  WAITING_APPROVAL: 'Aguardando transformação',
  REPORT: 'Conferência',
  READY_TO_TRANSFORM: 'Pronto para transformar',
  NO_TRANSFORMER: 'Preservado, sem transformação',
  EXCLUDED: 'Excluído por regra',
  EMPTY_OR_EXCLUDED: 'Sem registros elegíveis',
  INSERTED: 'Inserido',
  UPDATED: 'Atualizado',
  SKIPPED_EXISTING: 'Existente preservado',
  COMPLETED: 'Concluído',
};

const rotulo = (codigo: string) => rotulos[codigo] || codigo;
const quantidade = (valor: number) => (valor || 0).toLocaleString('pt-BR');
const mebibytes = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MiB`;
const hora = (data: string) => new Date(data).toLocaleTimeString('pt-BR');

function enviarArquivo(
  arquivo: File,
  atualizar: (porcentagem: number) => void,
): Promise<{ id: string }> {
  return new Promise((resolver, rejeitar) => {
    const requisicao = new XMLHttpRequest();
    requisicao.open('POST', '/api/staging/upload');
    requisicao.withCredentials = true;
    requisicao.upload.onprogress = (evento) => {
      if (evento.lengthComputable) {
        atualizar(Math.round((evento.loaded / evento.total) * 100));
      }
    };
    requisicao.onerror = () => rejeitar(new Error('Falha na conexão durante o envio.'));
    requisicao.onload = () => {
      let resposta: { id?: string; message?: string | string[] } = {};
      try {
        resposta = JSON.parse(requisicao.responseText);
      } catch {
        // A resposta sem JSON será tratada pelo código de situação HTTP.
      }
      if (requisicao.status >= 200 && requisicao.status < 300 && resposta.id) {
        resolver({ id: resposta.id });
        return;
      }
      const detalhe = Array.isArray(resposta.message)
        ? resposta.message.join(', ')
        : resposta.message;
      rejeitar(new Error(detalhe || `Falha no envio: HTTP ${requisicao.status}.`));
    };
    const corpo = new FormData();
    corpo.append('file', arquivo, arquivo.name);
    requisicao.send(corpo);
  });
}

function BarraProgresso({
  valor,
  titulo,
}: {
  valor: number | null;
  titulo: string;
}) {
  return (
    <div className="import-barra" role="group" aria-label={titulo}>
      <div className="import-barra-trilho">
        <div
          className={`import-barra-valor ${valor === null ? 'indeterminada' : ''}`}
          style={{ width: valor === null ? '38%' : `${Math.max(0, Math.min(100, valor))}%` }}
        />
      </div>
      <span>{valor === null ? 'Em processamento' : `${valor}%`}</span>
    </div>
  );
}

export function ImportCenterPage() {
  const [aba, definirAba] = useState<Aba>('sql');
  const [capacidade, definirCapacidade] = useState<Capacidade | null>(null);
  const [lotes, definirLotes] = useState<Lote[]>([]);
  const [selecionado, definirSelecionado] = useState('');
  const [arquivo, definirArquivo] = useState<File | null>(null);
  const [escopo, definirEscopo] = useState<Escopo>('PRIORITY_SEVEN');
  const [enviando, definirEnvio] = useState<number | null>(null);
  const [ocupado, definirOcupado] = useState(false);
  const [erro, definirErro] = useState('');
  const [aviso, definirAviso] = useState('');
  const [legado, definirLegado] = useState<{ connected?: boolean; enabled?: boolean } | null>(null);
  const [tabelas, definirTabelas] = useState<Tabela[]>([]);
  const [resultados, definirResultados] = useState<PaginaResultados | null>(null);
  const [filtro, definirFiltro] = useState('FAILED');
  const [pagina, definirPagina] = useState(1);
  const [blocos, definirBlocos] = useState<PaginaBlocos | null>(null);
  const [faseBlocos, definirFaseBlocos] = useState<Fase>('RESTORE');
  const [eventos, definirEventos] = useState<Evento[]>([]);
  const [somenteAlertas, definirSomenteAlertas] = useState(false);
  const [velocidade, definirVelocidade] = useState(0);
  const ultimaLeitura = useRef<{ id: string; bytes: number; instante: number } | null>(null);

  const lote = lotes.find((item) => item.id === selecionado);
  const ativo = lote?.status === 'RUNNING' || lote?.status === 'PROMOTING';
  const bytesLidos = Number(lote?.restoreScannedBytes || 0);
  const bytesTotais = Number(lote?.restoreTotalBytes || 0);
  const percentual = bytesTotais > 0
    ? Math.min(100, Math.floor((bytesLidos / bytesTotais) * 100))
    : null;
  const fase = lote?.stagingPhase || 'UPLOAD';
  const ultimoContato = lote?.importHeartbeat
    ? Math.max(0, Date.now() - new Date(lote.importHeartbeat).getTime())
    : null;
  const semContato = Boolean(ativo && (ultimoContato === null || ultimoContato > 120000));
  const falhas = tabelas.reduce((total, tabela) => total + tabela.failedCount, 0);
  const eventosVisiveis = useMemo(
    () => eventos.filter((evento) => !somenteAlertas || ['ERROR', 'WARNING'].includes(evento.level)),
    [eventos, somenteAlertas],
  );

  const atualizarLotes = useCallback(async () => {
    const lista = await get<Lote[]>('/api/staging/batches');
    definirLotes(lista);
    definirSelecionado((atual) => (
      lista.some((item) => item.id === atual) ? atual : lista[0]?.id || ''
    ));
  }, []);

  const atualizarDetalhes = useCallback(async () => {
    if (!selecionado) {
      definirTabelas([]);
      definirResultados(null);
      return;
    }
    const [resumo, registros] = await Promise.all([
      get<Tabela[]>(`/api/staging/tables/${selecionado}`),
      get<PaginaResultados>(
        `/api/staging/results/${selecionado}?status=${filtro}&page=${pagina}`,
      ),
    ]);
    definirTabelas(resumo);
    definirResultados(registros);
  }, [selecionado, filtro, pagina]);

  const atualizarEventos = useCallback(async () => {
    if (!selecionado) {
      definirEventos([]);
      return;
    }
    definirEventos(await get<Evento[]>(`/api/staging/events/${selecionado}`));
  }, [selecionado]);

  const atualizarBlocos = useCallback(async () => {
    if (!selecionado) {
      definirBlocos(null);
      return;
    }
    definirBlocos(await get<PaginaBlocos>(
      `/api/staging/chunks/${selecionado}?phase=${faseBlocos}`,
    ));
  }, [selecionado, faseBlocos]);

  useEffect(() => {
    void Promise.all([
      get<Capacidade>('/api/staging/capabilities'),
      get<{ connected?: boolean; enabled?: boolean }>('/api/legacy/status'),
    ]).then(([configuracao, conexao]) => {
      definirCapacidade(configuracao);
      definirLegado(conexao);
    }).catch((falha: Error) => definirErro(falha.message));
    void atualizarLotes().catch((falha: Error) => definirErro(falha.message));
  }, [atualizarLotes]);

  useEffect(() => {
    void atualizarDetalhes().catch((falha: Error) => definirErro(falha.message));
  }, [atualizarDetalhes]);

  useEffect(() => {
    void atualizarBlocos().catch(() => undefined);
  }, [atualizarBlocos]);

  useEffect(() => {
    void atualizarEventos().catch((falha: Error) => definirErro(falha.message));
  }, [atualizarEventos]);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      void atualizarLotes().catch(() => undefined);
      void atualizarEventos().catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(intervalo);
  }, [atualizarLotes, atualizarEventos]);

  useEffect(() => {
    if (!ativo) {
      return;
    }
    const intervalo = window.setInterval(() => {
      void atualizarDetalhes().catch(() => undefined);
      void atualizarBlocos().catch(() => undefined);
    }, 6000);
    return () => window.clearInterval(intervalo);
  }, [ativo, atualizarDetalhes, atualizarBlocos]);

  useEffect(() => {
    if (!lote) {
      return;
    }
    const instante = Date.now();
    const anterior = ultimaLeitura.current;
    if (anterior && anterior.id === lote.id && instante > anterior.instante) {
      const variacao = Math.max(0, bytesLidos - anterior.bytes);
      definirVelocidade((variacao * 1000) / (instante - anterior.instante));
    } else {
      definirVelocidade(0);
    }
    ultimaLeitura.current = { id: lote.id, bytes: bytesLidos, instante };
  }, [lote?.id, bytesLidos]);

  async function executar(operacao: () => Promise<unknown>, texto: string) {
    definirOcupado(true);
    definirErro('');
    definirAviso('');
    try {
      await operacao();
      definirAviso(texto);
      await atualizarLotes();
      await Promise.all([atualizarDetalhes(), atualizarEventos()]);
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não foi possível concluir a operação.');
    } finally {
      definirOcupado(false);
    }
  }

  async function enviar() {
    if (!arquivo) {
      return;
    }
    await executar(async () => {
      const novo = await enviarArquivo(arquivo, definirEnvio);
      definirSelecionado(novo.id);
      definirArquivo(null);
      definirEnvio(null);
    }, 'Arquivo recebido. Agora escolha a modalidade de processamento.');
  }

  async function iniciar() {
    if (!lote) {
      return;
    }
    const escolha = lote.completedImportChunks
      ? lote.importScope || 'FULL'
      : escopo;
    const descricao = escolha === 'PRIORITY_SEVEN'
      ? 'Iniciar a importação prioritária dos sete cadastros mapeados?'
      : 'Iniciar a importação completa para preservar todas as tabelas elegíveis?';
    if (!window.confirm(descricao)) {
      return;
    }
    await executar(
      () => post(`/api/staging/start/${lote.id}`, {
        confirm: 'PROCESS_ORIGINAL_SQL_LOCALLY',
        importScope: escolha,
      }),
      'Processamento iniciado. Acompanhe o histórico de atividade abaixo.',
    );
  }

  async function controlar(acao: 'pause' | 'cancel') {
    if (!lote) {
      return;
    }
    await executar(
      () => post(`/api/staging/${acao}/${lote.id}`, {}),
      acao === 'pause'
        ? 'Pausa solicitada para depois do bloco atual.'
        : 'Cancelamento solicitado; os checkpoints serão mantidos.',
    );
  }

  async function recuperar() {
    if (!lote || !window.confirm('Recuperar a tarefa interrompida? Confirme que o worker anterior já parou.')) {
      return;
    }
    await executar(
      () => post(`/api/staging/recover/${lote.id}`, {
        confirm: 'RECOVER_STALE_IMPORT',
      }),
      'Retomada solicitada a partir dos checkpoints.',
    );
  }

  async function criarNovoLote(modo: Escopo) {
    if (!lote || !window.confirm('Criar um novo lote reutilizando o SQL privado, sem novo envio?')) {
      return;
    }
    await executar(async () => {
      const novo = await post<{ id: string }>(`/api/staging/reuse/${lote.id}`, {
        confirm: 'REUSE_PRIVATE_SQL',
        importScope: modo,
      });
      definirSelecionado(novo.id);
      definirEscopo(modo);
    }, 'Novo lote criado a partir do arquivo já armazenado.');
  }

  async function transformar() {
    if (!lote || !window.confirm('O backup do PostgreSQL foi conferido? A transformação gravará os cadastros mapeados.')) {
      return;
    }
    await executar(
      () => post(`/api/staging/transform/${lote.id}`, {
        confirm: 'BACKUP_CONFIRMED_TRANSFORM_SEVEN',
      }),
      'Transformação iniciada. Acompanhe a situação por entidade.',
    );
  }

  const podeIniciar = Boolean(
    lote && ['UPLOADED', 'FAILED', 'PAUSED', 'CANCELLED'].includes(lote.status),
  );
  const podeTransformar = Boolean(
    lote && ['STAGED', 'STAGED_PRIORITY', 'PROMOTED_PARTIAL'].includes(lote.status),
  );
  const escopoEfetivo = lote?.completedImportChunks
    ? lote.importScope || 'FULL'
    : escopo;

  return (
    <section className="page access-page import-pagina">
      <header className="page-header">
        <div>
          <span className="eyebrow">ADMINISTRAÇÃO · IMPORTAÇÃO</span>
          <h1>Central de importação de dados</h1>
          <p>Importe os registros do SISCAPRO com acompanhamento e retomada.</p>
        </div>
        <div className="page-actions">
          <button
            className="btn ghost"
            onClick={() => {
              void atualizarLotes();
              void atualizarDetalhes();
              void atualizarBlocos();
              void atualizarEventos();
            }}
          >
            Atualizar agora
          </button>
        </div>
      </header>

      <div className="access-tabs">
        <button
          className={aba === 'sql' ? 'selected' : ''}
          onClick={() => definirAba('sql')}
        >
          Importação de arquivo
        </button>
        <button
          className={aba === 'legacy' ? 'selected' : ''}
          onClick={() => definirAba('legacy')}
        >
          Conector legado
        </button>
      </div>

      {erro && <div className="alert error" role="alert">{erro}</div>}
      {aviso && <div className="alert info" role="status">{aviso}</div>}

      {aba === 'legacy' && (
        <div className="panel access-form">
          <h2>Conector MariaDB</h2>
          <p>
            Situação: {legado?.connected
              ? 'Conexão disponível'
              : legado?.enabled
                ? 'Conexão indisponível'
                : 'Conexão desativada'}.
          </p>
          <p>Este conector é independente da importação de arquivos SQL.</p>
        </div>
      )}

      {aba === 'sql' && (
        <>
          <div className="import-grade-superior">
            <div className="panel import-painel">
              <h2>1. Arquivo de origem</h2>
              <p className="import-ajuda">
                Formatos: SQL e SQL compactado. O arquivo enviado permanece disponível
                para retomada do lote.
              </p>
              <label className="import-campo">
                Arquivo SQL
                <input
                  type="file"
                  accept=".sql,.sql.gz,.gz"
                  disabled={ocupado || !capacidade?.localImportEnabled}
                  onChange={(evento) => definirArquivo(evento.target.files?.[0] || null)}
                />
              </label>
              {enviando !== null && (
                <BarraProgresso valor={enviando} titulo="Envio do arquivo" />
              )}
              <button
                className="btn primary"
                disabled={!arquivo || ocupado || !capacidade?.localImportEnabled}
                onClick={() => void enviar()}
              >
                {ocupado ? 'Enviando arquivo…' : 'Enviar arquivo'}
              </button>
              {!capacidade?.localImportEnabled && (
                <p className="import-aviso">A configuração local de importação precisa estar habilitada.</p>
              )}
            </div>

            <div className="panel import-painel">
              <h2>2. Prioridade de processamento</h2>
              <p className="import-ajuda">
                Para a demonstração, você pode carregar primeiro os cadastros
                que já possuem conversão para a PROATIVA.
              </p>
              <label className="import-opcao">
                <input
                  type="radio"
                  name="escopo-importacao"
                  value="PRIORITY_SEVEN"
                  checked={escopo === 'PRIORITY_SEVEN'}
                  onChange={() => definirEscopo('PRIORITY_SEVEN')}
                  disabled={Boolean(lote?.completedImportChunks)}
                />
                <span>
                  <strong>Importação prioritária</strong>
                  <small>Alunos, empresas, cursos, turmas, disciplinas, matrículas e frequências.</small>
                </span>
              </label>
              <label className="import-opcao">
                <input
                  type="radio"
                  name="escopo-importacao"
                  value="FULL"
                  checked={escopo === 'FULL'}
                  onChange={() => definirEscopo('FULL')}
                  disabled={Boolean(lote?.completedImportChunks)}
                />
                <span>
                  <strong>Importação completa</strong>
                  <small>Preserva todas as tabelas elegíveis; a conversão de outras áreas será posterior.</small>
                </span>
              </label>
              {lote?.completedImportChunks ? (
                <p className="import-ajuda">
                  O lote selecionado mantém o escopo original: {
                    lote.importScope === 'PRIORITY_SEVEN' ? 'prioritário' : 'completo'
                  }.
                </p>
              ) : null}
            </div>
          </div>

          <div className="panel import-painel">
            <h2>3. Lote e acompanhamento</h2>
            <label className="import-campo">
              Lote recebido
              <select
                value={selecionado}
                onChange={(evento) => {
                  definirSelecionado(evento.target.value);
                  definirPagina(1);
                  definirVelocidade(0);
                }}
              >
                <option value="">Selecione um lote</option>
                {lotes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fileName || 'Lote'} · {new Date(item.startedAt).toLocaleString('pt-BR')}
                    {' · '}{rotulo(item.status)}
                  </option>
                ))}
              </select>
            </label>

            {lote ? (
              <>
                <div className="import-indicadores">
                  <div>
                    <small>Estado do lote</small>
                    <strong>{rotulo(lote.status)}</strong>
                  </div>
                  <div>
                    <small>Registros preservados</small>
                    <strong>{quantidade(lote.rowCount)}</strong>
                  </div>
                  <div>
                    <small>Blocos confirmados</small>
                    <strong>{quantidade(lote.completedImportChunks || 0)}</strong>
                  </div>
                  <div>
                    <small>Última atividade</small>
                    <strong>
                      {lote.importHeartbeat ? hora(lote.importHeartbeat) : 'Aguardando início'}
                    </strong>
                  </div>
                </div>

                <div className="import-etapas" aria-label="Etapas da importação">
                  {[
                    ['UPLOAD', 'Recebimento'],
                    ['RESTORE', 'Restauração'],
                    ['STAGING', 'Preservação'],
                    ['TRANSFORM', 'Transformação'],
                  ].map(([codigo, titulo], indice) => {
                    const posicao = fase === 'UPLOAD' ? 0
                      : fase === 'RESTORE' || fase === 'PREFLIGHT' ? 1
                        : fase === 'STAGING' || fase === 'WAITING_APPROVAL' ? 2
                          : fase === 'TRANSFORM' ? 3 : 4;
                    const concluida = indice < posicao;
                    const emAndamento = fase === codigo && ativo;
                    return (
                      <div
                        key={codigo}
                        className={`import-etapa ${concluida ? 'concluida' : ''} ${emAndamento ? 'ativa' : ''}`}
                      >
                        <span>{indice + 1}</span>
                        <strong>{titulo}</strong>
                      </div>
                    );
                  })}
                </div>

                <div className="import-acompanhamento">
                  <div className="import-acompanhamento-cabecalho">
                    <div>
                      <h3>{rotulo(fase)}</h3>
                      <p>{lote.message || 'Aguardando processamento.'}</p>
                    </div>
                    <span className={`import-situacao ${semContato ? 'import-alerta' : ''}`}>
                      {ativo
                        ? semContato
                          ? 'Sem contato recente'
                          : 'Processamento ativo'
                        : rotulo(lote.status)}
                    </span>
                  </div>
                  {ativo && (
                    <BarraProgresso
                      valor={fase === 'RESTORE' ? percentual : null}
                      titulo="Andamento da etapa atual"
                    />
                  )}
                  <div className="import-metricas">
                    <span>SQL lido: <strong>{mebibytes(bytesLidos)}</strong></span>
                    <span>
                      Volume: <strong>{bytesTotais > 0 ? mebibytes(bytesTotais) : 'Calculando'}</strong>
                    </span>
                    <span>
                      Velocidade recente: <strong>{velocidade > 0 ? `${mebibytes(velocidade)}/s` : 'Aguardando medição'}</strong>
                    </span>
                    <span>Tabela: <strong>{lote.currentImportTable || '—'}</strong></span>
                  </div>
                  <small className="import-ajuda">
                    O percentual representa os bytes lidos do arquivo SQL, não os dados já transformados.
                    A confirmação dos blocos é registrada separadamente. A preservação e a transformação são acompanhadas por registros e tabelas.
                  </small>
                </div>

                <div className="import-acoes">
                  <button
                    className="btn primary"
                    disabled={ocupado || !podeIniciar}
                    onClick={() => void iniciar()}
                  >
                    {lote.status === 'UPLOADED' ? 'Iniciar importação' : 'Retomar importação'}
                  </button>
                  <button
                    className="btn primary"
                    disabled={ocupado || !podeTransformar}
                    onClick={() => void transformar()}
                  >
                    Transformar cadastros
                  </button>
                  {ativo && (
                    <>
                      <button
                        className="btn ghost"
                        disabled={ocupado || lote.importControl !== 'RUN'}
                        onClick={() => void controlar('pause')}
                      >
                        Pausar após bloco
                      </button>
                      <button
                        className="btn ghost"
                        disabled={ocupado || lote.importControl !== 'RUN'}
                        onClick={() => void controlar('cancel')}
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  {semContato && (
                    <button
                      className="btn ghost"
                      disabled={ocupado}
                      onClick={() => void recuperar()}
                    >
                      Recuperar execução
                    </button>
                  )}
                  {lote.source === 'SISCAPRO_ORIGINAL_LOCAL' && !ativo &&
                    lote.status !== 'UPLOADED' && (
                      <>
                        <button
                          className="btn ghost"
                          disabled={ocupado}
                          onClick={() => void criarNovoLote('PRIORITY_SEVEN')}
                        >
                          Novo lote prioritário sem reenviar
                        </button>
                        <button
                          className="btn ghost"
                          disabled={ocupado}
                          onClick={() => void criarNovoLote('FULL')}
                        >
                          Novo lote completo sem reenviar
                        </button>
                      </>
                    )}
                  <a className="btn ghost" href={`/api/staging/export/${selecionado}`}>
                    Exportar relatório
                  </a>
                </div>
              </>
            ) : (
              <p className="import-ajuda">Envie um arquivo ou selecione um lote anterior.</p>
            )}
          </div>

          {lote && (
            <>
              <div className="panel import-painel">
                <div className="import-secao-titulo">
                  <div>
                    <h2>4. Histórico de atividade</h2>
                    <p className="import-ajuda">
                      Atualização automática a cada 2,5 segundos. Eventos sem dados pessoais.
                    </p>
                  </div>
                  <label className="import-filtro">
                    <input
                      type="checkbox"
                      checked={somenteAlertas}
                      onChange={(evento) => definirSomenteAlertas(evento.target.checked)}
                    />
                    Somente alertas
                  </label>
                </div>
                <div className="import-registros" role="log" aria-label="Atividades da importação">
                  {eventosVisiveis.length ? eventosVisiveis.map((evento) => (
                    <div className="import-evento" key={evento.id}>
                      <time>{hora(evento.createdAt)}</time>
                      <span className={`import-nivel nivel-${evento.level.toLowerCase()}`}>
                        {evento.level === 'ERROR'
                          ? 'Falha'
                          : evento.level === 'WARNING'
                            ? 'Atenção'
                            : evento.level === 'SUCCESS'
                              ? 'Concluído'
                              : 'Informação'}
                      </span>
                      <div>
                        <p>{evento.message}</p>
                        <small>{rotulo(evento.phase)}{evento.sourceTable ? ` · ${evento.sourceTable}` : ''}</small>
                      </div>
                    </div>
                  )) : (
                    <p className="import-ajuda">Os acontecimentos do lote aparecerão aqui.</p>
                  )}
                </div>
              </div>

              <div className="panel import-painel">
                <div className="import-secao-titulo">
                  <h2>5. Blocos de processamento</h2>
                  <label className="import-campo import-campo-curto">
                    Etapa
                    <select
                      value={faseBlocos}
                      onChange={(evento) => definirFaseBlocos(evento.target.value as Fase)}
                    >
                      <option value="RESTORE">Restauração</option>
                      <option value="STAGING">Preservação</option>
                      <option value="TRANSFORM">Transformação</option>
                    </select>
                  </label>
                </div>
                <p className="import-ajuda">{quantidade(blocos?.total || 0)} blocos registrados.</p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Bloco</th>
                        <th>Tabela</th>
                        <th>Comandos / registros</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(blocos?.items || []).slice(0, 15).map((bloco) => (
                        <tr key={bloco.id}>
                          <td>{bloco.sequence}</td>
                          <td>{bloco.sourceTable}</td>
                          <td>{bloco.statementCount || bloco.rowCount}</td>
                          <td>{rotulo(bloco.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel import-painel">
                <h2>6. Resultado por tabela</h2>
                <div className="import-resumo">
                  <span>Com destino mapeado: <strong>{quantidade(tabelas.filter((item) => item.targetEntity).length)}</strong></span>
                  <span>Sem transformador: <strong>{quantidade(tabelas.filter((item) => item.status === 'NO_TRANSFORMER').length)}</strong></span>
                  <span>Registros com falha: <strong>{quantidade(falhas)}</strong></span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Origem</th>
                        <th>Destino</th>
                        <th>Preservados</th>
                        <th>Transformados</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabelas.map((tabela) => (
                        <tr key={tabela.id}>
                          <td>{tabela.sourceTable}</td>
                          <td>{entidades.find(([codigo]) => codigo === tabela.targetEntity)?.[1] || 'Sem transformador'}</td>
                          <td>{quantidade(tabela.recordCount)}</td>
                          <td>{quantidade(tabela.writtenCount)}</td>
                          <td>{rotulo(tabela.status)}{tabela.reason && <small>{tabela.reason}</small>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!tabelas.length && <p className="import-ajuda">Ainda não há tabelas preservadas neste lote.</p>}
              </div>

              <div className="panel import-painel">
                <div className="import-secao-titulo">
                  <h2>7. Ocorrências por registro</h2>
                  <label className="import-campo import-campo-curto">
                    Situação
                    <select
                      value={filtro}
                      onChange={(evento) => {
                        definirFiltro(evento.target.value);
                        definirPagina(1);
                      }}
                    >
                      <option value="FAILED">Falhas</option>
                      <option value="INSERTED">Inseridos</option>
                      <option value="UPDATED">Atualizados</option>
                      <option value="SKIPPED_EXISTING">Preservados</option>
                      <option value="">Todos</option>
                    </select>
                  </label>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Tabela</th>
                        <th>Referência original</th>
                        <th>Destino</th>
                        <th>Resultado</th>
                        <th>Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(resultados?.items || []).map((item) => (
                        <tr key={item.id}>
                          <td>{item.sourceTable}</td>
                          <td>{item.sourceKey}</td>
                          <td>{item.targetEntity}</td>
                          <td>{rotulo(item.status)}</td>
                          <td>{item.explanation || item.reasonCode || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="import-paginacao">
                  <button
                    className="btn ghost"
                    disabled={pagina <= 1}
                    onClick={() => definirPagina((atual) => atual - 1)}
                  >
                    Anterior
                  </button>
                  <span>Página {pagina} · {quantidade(resultados?.total || 0)} ocorrências</span>
                  <button
                    className="btn ghost"
                    disabled={!resultados || pagina * 100 >= resultados.total}
                    onClick={() => definirPagina((atual) => atual + 1)}
                  >
                    Próxima
                  </button>
                </div>
              </div>
              <p className="import-ajuda">
                Escopo deste lote: {escopoEfetivo === 'PRIORITY_SEVEN' ? 'prioritário' : 'completo'}.
                Os registros sem transformador não se tornam cadastros operacionais automaticamente.
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}
