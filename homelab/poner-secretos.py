"""Pone en homelab/.env las claves de las funciones, leídas de la entrada estándar (CLAVE=valor).

Así no pasan por ningún chat ni quedan en el historial de comandos. Ejemplo desde Windows:
  Get-Content $env:USERPROFILE\\.siigo.env | ssh carlos@192.168.10.201 "cd ~/crm && python3 poner-secretos.py"
Solo acepta las claves de PERMITIDAS; no muestra ningún valor.
"""
import os
import sys

PERMITIDAS = {'RESEND_API_KEY', 'EMAIL_FUNCTION_SECRET', 'SIIGO_USERNAME', 'SIIGO_ACCESS_KEY'}
ENV = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')

nuevas = {}
for linea in sys.stdin.read().splitlines():
    linea = linea.strip().lstrip('﻿')
    if '=' not in linea or linea.startswith('#'):
        continue
    clave, valor = linea.split('=', 1)
    clave = clave.strip()
    if clave in PERMITIDAS and valor.strip():
        nuevas[clave] = valor.strip().strip('"').strip("'")

with open(ENV, encoding='utf-8') as f:
    lineas = f.read().splitlines()
puestas = set()
for i, linea in enumerate(lineas):
    clave = linea.split('=', 1)[0]
    if clave in nuevas:
        lineas[i] = f'{clave}={nuevas[clave]}'
        puestas.add(clave)
for clave in nuevas.keys() - puestas:
    lineas.append(f'{clave}={nuevas[clave]}')
with open(ENV, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(lineas) + '\n')

faltan = [c for c in sorted(PERMITIDAS) if not any(l.startswith(c + '=') and l.split('=', 1)[1] for l in lineas)]
print('Puestas: ' + (', '.join(sorted(nuevas)) or 'ninguna'))
print('Faltan:  ' + (', '.join(faltan) or 'ninguna'))
