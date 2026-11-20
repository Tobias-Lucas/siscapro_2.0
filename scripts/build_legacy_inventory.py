#!/usr/bin/env python3
"""Static inventory of an authorized original SISCAPRO source tree.

Only paths, file hashes and *table names* are exported. No source code, database
credentials, PII, forms, user values, or included documents are copied.
This inventory is a coverage checklist, not proof of behavioral parity.
"""
from __future__ import annotations
import argparse
import collections
import csv
import hashlib
import re
from pathlib import Path

SQL_TABLE = re.compile(r'\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+`?([A-Za-z_][A-Za-z_0-9]*)`?', re.I)
TABLE_SETTER = re.compile(r'(?:setTable|setTableName)\s*\(\s*[\'\"]([A-Za-z_][A-Za-z_0-9]*)[\'\"]', re.I)
TEMPLATES = ('/PHPMailer/', '/fpdf/', '/tinymce/', '/SpryAssets/', '/js/', '/vendor/')

# Only these examples have actually been read against the original PHP.
SOURCE_INSPECTED = {
    'proativa/mt-5.php': 'MATRICULA_BASE_SEM_PARIDADE',
    'proativa/painel/turmas/cadastro_turma.php': 'TURMAS_BASE_SEM_PARIDADE',
    'instrutor/app/turmasLancarFrequencia.php': 'FREQUENCIA_BASE_SEM_PARIDADE',
    'proativa/pedagogico/gradeCurricularCurso.php': 'CURRICULO_BASE_SEM_PARIDADE',
    'proativa/pedagogico/vincularDisciplinaAoProfessor.php': 'VINCULO_DOCENTE_BASE_SEM_PARIDADE',
    'proativa/painel/cursos/cadHorarios.php': 'HORARIOS_BASE_SEM_PARIDADE',
}

def owner_and_module(name: str):
    x=name.split('/')
    if x[0] == 'instrutor':
        return 'Facilitador', x[1] if len(x) > 2 else 'raiz'
    if x[0] == 'empresa':
        return 'Empresa', x[1] if len(x) > 2 else 'raiz'
    if x[:2] == ['proativa','aluno']:
        return 'Aluno', x[2] if len(x) > 3 else 'raiz'
    if x[:2] == ['proativa','supervisor']:
        return 'Supervisor de Estagio', x[2] if len(x) > 3 else 'raiz'
    if x[0] == 'proativa':
        return 'Administrativo', x[1] if len(x) > 2 else 'raiz'
    return 'Infraestrutura compartilhada', x[0]

def main(source: Path, output: Path):
    if not source.is_dir(): raise SystemExit('Informe o diretorio extraido do codigo SISCAPRO')
    output.parent.mkdir(parents=True,exist_ok=True)
    rows=[]
    for p in sorted(source.rglob('*.php')):
        rel=p.relative_to(source).as_posix()
        portal, module=owner_and_module(rel)
        raw=p.read_bytes()
        body=raw[:1024*1024].decode('latin-1',errors='replace')
        tables=sorted({*SQL_TABLE.findall(body),*TABLE_SETTER.findall(body)})
        library = any(mark.strip('/') in rel.split('/') for mark in TEMPLATES) or any(
            segment in ('Connections','includes','PHPMailer','fpdf') for segment in rel.split('/'))
        rows.append({
            'portal':portal, 'area':module, 'arquivo_php':rel,
            'tipo':'dependencia' if library else 'arquivo_funcional_a_validar',
            'tabelas_referenciadas_heuristica':';'.join(tables[:50]),
            'tem_form_post':'sim' if '$_POST' in body else 'nao',
            'tem_escrita_bd':'sim' if bool(re.search(r'\b(?:INSERT INTO|UPDATE|DELETE FROM|tNG_(?:insert|update|delete))\b',body,re.I)) else 'nao',
            'hash_sha256':hashlib.sha256(raw).hexdigest(),
            'estado':SOURCE_INSPECTED.get(rel,'PENDENTE_DE_ANALISE_E_HOMOLOGACAO'),
        })
    with output.open('w',encoding='utf-8',newline='') as target:
        writer=csv.DictWriter(target,fieldnames=list(rows[0]),delimiter=';')
        writer.writeheader(); writer.writerows(rows)
    print('PHP files',len(rows),'by owner',collections.Counter(row['portal'] for row in rows))
    print('Functional candidates',sum(row['tipo']=='arquivo_funcional_a_validar' for row in rows))
    print('output',output)

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('source',type=Path,help='diretorio Siscapro original extraido')
    parser.add_argument('output',type=Path,help='arquivo CSV de inventario')
    args=parser.parse_args()
    main(args.source,args.output)
