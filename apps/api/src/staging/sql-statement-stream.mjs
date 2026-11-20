import fs from 'node:fs';
import zlib from 'node:zlib';

const LIMITE_INSTRUCAO = 192 * 1024 * 1024;
const LIMITE_CABECALHO = 8192;
const INTERVALO_PROGRESSO = 16 * 1024 * 1024;
const decodificador = new TextDecoder('utf-8', { fatal: true });

export class SqlDumpFormatError extends Error {
  constructor(code) {
    super(code);
    this.name = 'SqlDumpFormatError';
    this.code = code;
  }
}

function decodificar(partes, tamanho) {
  try {
    return decodificador.decode(Buffer.concat(partes, tamanho));
  } catch {
    throw new SqlDumpFormatError('SQL_NOT_UTF8');
  }
}

async function* linhasSql(arquivo, informarProgresso) {
  let fluxo = fs.createReadStream(arquivo, { highWaterMark: 256 * 1024 });
  if (/\.gz$/i.test(arquivo)) {
    fluxo = fluxo.pipe(zlib.createGunzip());
  }

  let partes = [];
  let tamanho = 0;
  let bytesLidos = 0;
  let ultimoProgresso = 0;

  for await (const bloco of fluxo) {
    let inicio = 0;
    let fim;

    while ((fim = bloco.indexOf(10, inicio)) !== -1) {
      const parte = bloco.subarray(inicio, fim + 1);
      partes.push(parte);
      tamanho += parte.length;
      if (tamanho > LIMITE_INSTRUCAO) {
        throw new SqlDumpFormatError('OVERSIZE_SQL_LINE');
      }
      bytesLidos += parte.length;
      const linha = Buffer.concat(partes, tamanho);
      partes = [];
      tamanho = 0;
      inicio = fim + 1;

      if (informarProgresso && bytesLidos - ultimoProgresso > INTERVALO_PROGRESSO) {
        ultimoProgresso = bytesLidos;
        await informarProgresso(bytesLidos);
      }
      yield linha;
    }

    if (inicio < bloco.length) {
      const parte = bloco.subarray(inicio);
      partes.push(parte);
      tamanho += parte.length;
      bytesLidos += parte.length;
      if (tamanho > LIMITE_INSTRUCAO) {
        throw new SqlDumpFormatError('OVERSIZE_SQL_LINE');
      }
      if (informarProgresso && bytesLidos - ultimoProgresso > INTERVALO_PROGRESSO) {
        ultimoProgresso = bytesLidos;
        await informarProgresso(bytesLidos);
      }
    }
  }

  if (tamanho) {
    yield Buffer.concat(partes, tamanho);
  }
}

function removerComentariosIniciais(texto) {
  let restante = texto.trimStart();
  for (let i = 0; i < 100; i++) {
    if (restante.startsWith('--') || restante.startsWith('#')) {
      const posicao = restante.indexOf('\n');
      if (posicao < 0) return '';
      restante = restante.slice(posicao + 1).trimStart();
      continue;
    }
    if (restante.startsWith('/*') &&
        !restante.startsWith('/*!') &&
        !restante.startsWith('/*M!')) {
      const posicao = restante.indexOf('*/');
      if (posicao < 0) return '';
      restante = restante.slice(posicao + 2).trimStart();
      continue;
    }
    break;
  }
  return restante;
}

function identificarRotina(texto) {
  const inicio = removerComentariosIniciais(texto);
  if (!inicio.trim()) return 'COMENTARIO';
  if (/^(?:SET\b|\/\*(?:!|M!)\d+\s+SET\b)/i.test(inicio)) {
    return 'CONFIGURACAO';
  }
  const comandoRotina = /\b(?:CREATE|ALTER|DROP)\b[\s\S]{0,1200}?\b(?:TRIGGER|PROCEDURE|FUNCTION|EVENT)\b/i;
  if (/^(?:CREATE|ALTER|DROP|\/\*(?:!|M!)\d+)/i.test(inicio) &&
      comandoRotina.test(inicio)) {
    return 'ROTINA';
  }
  throw new SqlDumpFormatError('SQL_WITH_CUSTOM_DELIMITER_NOT_A_ROUTINE');
}

function comandoDelimitador(linha) {
  if (linha.length > 256) return null;
  const texto = linha.toString('ascii').trim();
  const correspondencia = texto.match(/^DELIMITER\s+([^\s]{1,16})$/i);
  if (!correspondencia) return null;
  const delimitador = correspondencia[1];
  if (!/^[!#$%&*+\-.:;?@^_|~/]+$/.test(delimitador)) {
    throw new SqlDumpFormatError('INVALID_SQL_DELIMITER');
  }
  return delimitador;
}

export async function* sqlStatements(arquivo, opcoes = {}) {
  let total = 0;
  let inicioInstrucao = 0;
  let partesInstrucao = [];
  let tamanhoInstrucao = 0;
  let delimitador = ';';
  let cabecalhoRotina = '';
  let aspas = 0;
  let escape = false;
  let comentarioLinha = false;
  let comentarioBloco = false;
  let finalBloco = false;

  for await (const linha of linhasSql(arquivo, opcoes.onProgress)) {
    const inicioLinha = total;
    const possivelDelimitador = !aspas && !comentarioBloco &&
      !comentarioLinha ? comandoDelimitador(linha) : null;

    if (possivelDelimitador !== null) {
      if (delimitador === ';') {
        const pendente = decodificar(partesInstrucao, tamanhoInstrucao);
        if (removerComentariosIniciais(pendente).trim()) {
          throw new SqlDumpFormatError('DELIMITER_INSIDE_SQL_STATEMENT');
        }
      } else if (cabecalhoRotina.trim()) {
        throw new SqlDumpFormatError('UNTERMINATED_SQL_ROUTINE');
      }

      total += linha.length;
      inicioInstrucao = total;
      partesInstrucao = [];
      tamanhoInstrucao = 0;
      cabecalhoRotina = '';
      delimitador = possivelDelimitador;
      continue;
    }

    let inicioParte = 0;
    const marcador = Buffer.from(delimitador, 'ascii');
    for (let i = 0; i < linha.length; i++) {
      const atual = linha[i];
      const seguinte = linha[i + 1];
      const terceiro = linha[i + 2];

      if (comentarioLinha) {
        if (atual === 10) comentarioLinha = false;
        continue;
      }
      if (comentarioBloco) {
        if (finalBloco && atual === 47) {
          comentarioBloco = false;
          finalBloco = false;
        } else {
          finalBloco = atual === 42;
        }
        continue;
      }
      if (aspas) {
        if (escape) {
          escape = false;
        } else if (atual === 92 && aspas !== 96) {
          escape = true;
        } else if (atual === aspas) {
          if (seguinte === aspas) {
            i++;
            continue;
          }
          aspas = 0;
        }
        continue;
      }

      if (atual === 35) {
        comentarioLinha = true;
        continue;
      }
      if (atual === 45 && seguinte === 45 &&
          (terceiro === 32 || terceiro === 9 || terceiro === 10 || terceiro === 13)) {
        comentarioLinha = true;
        i++;
        continue;
      }
      if (atual === 47 && seguinte === 42) {
        comentarioBloco = true;
        finalBloco = false;
        i++;
        continue;
      }
      if (atual === 39 || atual === 34 || atual === 96) {
        aspas = atual;
        continue;
      }

      if (atual !== marcador[0] ||
          i + marcador.length > linha.length ||
          !linha.subarray(i, i + marcador.length).equals(marcador)) {
        continue;
      }

      const fim = inicioLinha + i + marcador.length;
      if (delimitador !== ';') {
        if (cabecalhoRotina.length < LIMITE_CABECALHO) {
          cabecalhoRotina += linha.subarray(inicioParte, i).toString('utf8');
          cabecalhoRotina = cabecalhoRotina.slice(0, LIMITE_CABECALHO);
        }
        const tipo = identificarRotina(cabecalhoRotina);
        if (opcoes.onRoutineSkipped && tipo === 'ROTINA') {
          await opcoes.onRoutineSkipped({ type: 'ROTINA' });
        }
        cabecalhoRotina = '';
      } else {
        const parte = linha.subarray(inicioParte, i + 1);
        partesInstrucao.push(parte);
        tamanhoInstrucao += parte.length;
        if (tamanhoInstrucao > LIMITE_INSTRUCAO) {
          throw new SqlDumpFormatError('OVERSIZE_SQL_STATEMENT');
        }
        const sql = decodificar(partesInstrucao, tamanhoInstrucao);
        yield { sql, start: inicioInstrucao, end: fim, bytes: tamanhoInstrucao };
        partesInstrucao = [];
        tamanhoInstrucao = 0;
      }

      inicioInstrucao = fim;
      inicioParte = i + marcador.length;
      i += marcador.length - 1;
    }

    if (delimitador === ';') {
      if (inicioParte < linha.length) {
        const parte = linha.subarray(inicioParte);
        partesInstrucao.push(parte);
        tamanhoInstrucao += parte.length;
      }
      if (tamanhoInstrucao > LIMITE_INSTRUCAO) {
        throw new SqlDumpFormatError('OVERSIZE_SQL_STATEMENT');
      }
    } else if (inicioParte < linha.length &&
               cabecalhoRotina.length < LIMITE_CABECALHO) {
      cabecalhoRotina += linha.subarray(inicioParte).toString('utf8');
      cabecalhoRotina = cabecalhoRotina.slice(0, LIMITE_CABECALHO);
    }
    total += linha.length;
  }

  if (aspas || comentarioBloco) {
    throw new SqlDumpFormatError('UNTERMINATED_SQL_LITERAL_OR_COMMENT');
  }
  if (delimitador !== ';' && cabecalhoRotina.trim()) {
    throw new SqlDumpFormatError('UNTERMINATED_SQL_ROUTINE');
  }
  if (tamanhoInstrucao) {
    const sql = decodificar(partesInstrucao, tamanhoInstrucao);
    if (sql.trim()) {
      yield { sql, start: inicioInstrucao, end: total, bytes: tamanhoInstrucao };
    }
  }
}

export function describeSqlStatement(sql, opcoes = {}) {
  const comando = removerComentariosIniciais(sql);
  if (!comando) return { kind: 'COMMENT', table: '(comentarios)' };
  if (/^\/\*(?:!|M!)\d+\s+SET\b/i.test(comando)) {
    return { kind: 'SESSION', table: '(sessao)' };
  }
  if (/^SET\s/i.test(comando) || /^SET\s*@/i.test(comando)) {
    return { kind: 'SESSION', table: '(sessao)' };
  }
  if (/^DELIMITER\b/i.test(comando)) {
    throw new SqlDumpFormatError('UNSUPPORTED_DELIMITER');
  }
  const usar = comando.match(/^USE\s+`?([a-zA-Z0-9_]+)`?\s*;?\s*$/i);
  if (/^USE\b/i.test(comando)) {
    if (!usar || (opcoes.sourceSchema && usar[1].toLowerCase() !== opcoes.sourceSchema.toLowerCase())) {
      throw new SqlDumpFormatError('CROSS_SCHEMA_REFERENCE');
    }
    return { kind: 'SKIP_SCHEMA_SELECTOR', table: '(banco)' };
  }
  if (/^(?:CREATE\s+DATABASE\b|DROP\s+DATABASE\b)/i.test(comando)) {
    return { kind: 'SKIP_SCHEMA_SELECTOR', table: '(banco)' };
  }
  if (/^(?:LOCK\s+TABLES\b|UNLOCK\s+TABLES\b)/i.test(comando)) {
    return { kind: 'SKIP_LOCK', table: '(sessao)' };
  }
  if (/^(?:START\s+TRANSACTION\b|BEGIN\b|COMMIT\b|ROLLBACK\b)/i.test(comando)) {
    return { kind: 'SKIP_TRANSACTION', table: '(sessao)' };
  }
  if (/^DROP\s+VIEW\b/i.test(comando) ||
      /^CREATE\s+(?!TABLE\b|DATABASE\b|TRIGGER\b|PROCEDURE\b|FUNCTION\b|EVENT\b|INDEX\b)[\s\S]{0,350}?\bVIEW\b/i.test(comando)) {
    return { kind: 'SKIP_VIEW', table: '(view)' };
  }
  if (/^(?:CREATE\s+(?:UNIQUE\s+)?INDEX\b|DROP\s+INDEX\b)/i.test(comando)) {
    return { kind: 'DDL', table: '(indice)', verb: 'INDEX' };
  }
  if (/^(?:CREATE|ALTER|DROP)\b[\s\S]{0,500}?\b(?:TRIGGER|PROCEDURE|FUNCTION|EVENT)\b/i.test(comando) ||
      /^\/\*![\s\S]{0,500}?\b(?:TRIGGER|PROCEDURE|FUNCTION|EVENT)\b/i.test(comando)) {
    return { kind: 'SKIP_ROUTINE', table: '(rotina)' };
  }
  if (/^(?:CALL\b|PREPARE\b|EXECUTE\b|SOURCE\b|\\\.)/i.test(comando)) {
    throw new SqlDumpFormatError('UNSUPPORTED_SQL_ROUTINE');
  }

  // A referencia no alvo e analisada pela gramatica do comando, nao por
  // uma busca generica por "nome.nome" no corpo ou em valores de dados.
  // Somente o banco original autorizado pode ser remapeado para a copia
  // isolada siscapro_import. Outros bancos continuam proibidos.
  const alvo = comando.match(
    /^((?:INSERT(?:\s+IGNORE)?\s+INTO|REPLACE\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|DROP\s+TABLE|ALTER\s+TABLE|TRUNCATE\s+TABLE)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?)(?:(`?[a-zA-Z0-9_]+`?)\s*\.\s*)?(`?[a-zA-Z0-9_]+`?)/i,
  );
  if (alvo) {
    const banco = alvo[2]?.replaceAll('`', '');
    const tabela = alvo[3].replaceAll('`', '');
    const verbo = alvo[1].trim().toUpperCase();
    const descricao = {
      kind: /^(INSERT|REPLACE|UPDATE|DELETE)/.test(verbo) ? 'DML' : 'DDL',
      table: tabela,
      verb: verbo,
    };
    if (!banco) return descricao;
    if (!opcoes.sourceSchema || banco.toLowerCase() !== opcoes.sourceSchema.toLowerCase()) {
      throw new SqlDumpFormatError('CROSS_SCHEMA_REFERENCE');
    }
    // Preserva comentarios, literais, offsets de leitura e SQL nao qualificado.
    // So remove o prefixo da TABELA-ALVO, mantendo o resto do comando intacto.
    const prefixo = sql.slice(0, sql.length - comando.length);
    const sqlNormalizado = prefixo + alvo[1] + alvo[3] + comando.slice(alvo[0].length);
    return { ...descricao, normalizedSql: sqlNormalizado };
  }
  if (/^\/\*(?:!|M!)/.test(comando)) {
    return { kind: 'DDL', table: '(configuracao)', verb: 'VERSIONED_SQL' };
  }
  throw new SqlDumpFormatError('UNSUPPORTED_SQL_STATEMENT');
}
