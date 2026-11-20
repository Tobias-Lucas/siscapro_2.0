#!/usr/bin/env python3
"""Static-only check that mapped MariaDB columns exist in the bundled schema.

This does not query any database or validate behavior of the original PHP.
"""
from pathlib import Path
import re
import sys
root=Path(__file__).resolve().parents[1]
service=(root/'apps/api/src/legacy/legacy.service.ts').read_text()
dump=(root/'docs/legacy/siscapro_schema_legacy.sql').read_text(errors='replace')
tables={}
for m in re.finditer(r'CREATE TABLE `([^`]+)` \((.*?)\) ENGINE=',dump,re.S):
    tables[m.group(1)]=set(re.findall(r'^\s*`([^`]+)`\s+\w+',m.group(2),re.M))
queries={entity:(table,key) for entity,table,key in re.findall(r'^\s*(\w+): \{ table: [\'\"](\w+)[\'\"], key: [\'\"](\w+)[\'\"] \}',service,re.M)}
start=service.index('  private async write(')
end=service.index('\n  async sync(',start)
body=service[start:end]
errors=[]
for entity,(table,key) in queries.items():
    if table not in tables:
        errors.append(f'{entity}: missing table {table}');continue
    if key not in tables[table]:errors.append(f'{entity}: missing key {table}.{key}')
    match=re.search(r"    if \(entity === '"+entity+r"'\) \{",body)
    if not match: errors.append(f'{entity}: missing importer');continue
    next_match=re.search(r"\n    if \(entity === '\w+'\) \{",body[match.end():])
    segment=body[match.end():match.end()+next_match.start()] if next_match else body[match.end():]
    columns=set(re.findall(r'\bx\.(\w+)',segment))
    for column in sorted(columns-tables[table]):
        errors.append(f'{entity}: unknown source column {table}.{column}')
print('CHECKED',len(queries),'import sources; legacy schema tables',len(tables))
if errors:
    print('ISSUES:',*errors,sep='\n');sys.exit(1)
print('PASS: every accessed field exists in the source DDL')
