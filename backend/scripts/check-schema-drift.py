#!/usr/bin/env python3
"""Compara schema.prisma contra el esquema real de Supabase.

Existe porque `prisma migrate diff` no corre desde cualquier red: usa DIRECT_URL
(db.<ref>.supabase.co), que Supabase publica SOLO por IPv6. Si la maquina no
tiene salida IPv6 el comando se cuelga indefinidamente. El pooler si resuelve
por IPv4, pero el motor de migraciones de Prisma no funciona sobre pgBouncer en
modo transaccion.

Uso:

  1. Correr esta consulta en el SQL editor de Supabase:

     select jsonb_object_agg(table_name, cols)
     from (
       select c.table_name,
              jsonb_object_agg(c.column_name, c.is_nullable = 'YES') as cols
       from information_schema.columns c
       join information_schema.tables t
         on t.table_schema = c.table_schema
        and t.table_name   = c.table_name
        and t.table_type   = 'BASE TABLE'
       where c.table_schema = 'public'
       group by c.table_name
     ) s;

  2. Pasar ese JSON por stdin:

     pbpaste | python3 scripts/check-schema-drift.py
     python3 scripts/check-schema-drift.py < esquema.json

Sale con 0 si no hay drift y con 2 si lo hay, asi que sirve en CI.

Alcance: compara nombres de columna y nulabilidad. NO compara tipos, defaults,
indices ni claves foraneas.
"""
import json
import re
import sys
from pathlib import Path

SCHEMA = Path(__file__).resolve().parent.parent / 'prisma' / 'schema.prisma'


def prisma_models(text):
    return dict(re.findall(r'^model\s+(\w+)\s*\{(.*?)^\}', text, re.S | re.M))


def scalar_fields(body, model_names):
    """Devuelve {campo: es_opcional} salteando los campos de relacion."""
    out = {}
    for line in body.splitlines():
        line = line.split('//')[0].strip()
        if not line or line.startswith('@@'):
            continue
        m = re.match(r'(\w+)\s+(\S+)', line)
        if not m:
            continue
        field, typ = m.groups()
        if typ.rstrip('?').rstrip('[]').rstrip('?') in model_names:
            continue
        out[field] = typ.endswith('?')
    return out


def main():
    raw = sys.stdin.read().strip()
    if not raw:
        sys.exit('Sin entrada. Pasar por stdin el JSON de la consulta del docstring.')

    db = json.loads(raw)
    # El editor de Supabase puede devolver [{"jsonb_object_agg": {...}}]
    if isinstance(db, list):
        db = db[0]
    if len(db) == 1 and isinstance(next(iter(db.values())), dict):
        inner = next(iter(db.values()))
        if all(isinstance(v, dict) for v in inner.values()):
            db = inner

    models = prisma_models(SCHEMA.read_text())
    names = set(models)
    problemas = 0

    for model, body in sorted(models.items()):
        if model not in db:
            print(f'[!] modelo {model}: no existe la tabla en la base')
            problemas += 1
            continue
        pf, dc = scalar_fields(body, names), db[model]
        se_dropean = sorted(set(dc) - set(pf))
        se_crean = sorted(set(pf) - set(dc))
        nulabilidad = sorted(f for f in set(pf) & set(dc) if pf[f] != dc[f])

        if se_dropean or se_crean or nulabilidad:
            problemas += 1
            print(f'[DRIFT] {model}')
            if se_dropean:
                print(f'   en la base pero no en Prisma, se DROPEARIAN: {se_dropean}')
            if se_crean:
                print(f'   en Prisma pero no en la base, se CREARIAN:   {se_crean}')
            for f in nulabilidad:
                p = 'opcional' if pf[f] else 'requerido'
                d = 'nullable' if dc[f] else 'not null'
                print(f'   nulabilidad distinta en {f}: prisma={p} / base={d}')
        else:
            print(f'[OK]    {model}: {len(dc)} columnas coinciden')

    for tabla in sorted(set(db) - names):
        print(f'[!] tabla {tabla} existe en la base pero no tiene modelo Prisma')
        problemas += 1

    print()
    print('RESULTADO:', 'SIN DRIFT' if problemas == 0 else f'{problemas} discrepancia(s)')
    sys.exit(0 if problemas == 0 else 2)


if __name__ == '__main__':
    main()
