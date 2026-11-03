"""Crea homelab/.env con secretos nuevos (contraseña de la base, secreto JWT y llaves anon/servicio).

Uso:  python3 generar-env.py https://crm-api.helpsoluciones.com.co
No sobrescribe un .env existente. Después hay que completar a mano RESEND_API_KEY,
EMAIL_FUNCTION_SECRET, SIIGO_USERNAME y SIIGO_ACCESS_KEY (no se ponen en ningún chat).
"""
import base64
import hashlib
import hmac
import json
import os
import secrets
import string
import sys
import time

AQUI = os.path.dirname(os.path.abspath(__file__))
DESTINO = os.path.join(AQUI, '.env')


def b64(datos: bytes) -> str:
    return base64.urlsafe_b64encode(datos).rstrip(b'=').decode()


def jwt(rol: str, secreto: str) -> str:
    ahora = int(time.time())
    cabecera = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cuerpo = b64(json.dumps({'role': rol, 'iss': 'supabase', 'iat': ahora,
                             'exp': ahora + 10 * 365 * 24 * 3600}, separators=(',', ':')).encode())
    firma = hmac.new(secreto.encode(), f'{cabecera}.{cuerpo}'.encode(), hashlib.sha256).digest()
    return f'{cabecera}.{cuerpo}.{b64(firma)}'


def aleatorio(n: int) -> str:
    # Solo letras y números: van dentro de URLs de conexión sin necesidad de escaparlos
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(n))


def main() -> None:
    if os.path.exists(DESTINO):
        sys.exit(f'Ya existe {DESTINO}; no se sobrescribe.')
    url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8300'
    secreto_jwt = aleatorio(64)
    lineas = [
        '# Generado por generar-env.py — NO subir a git',
        f'API_EXTERNAL_URL={url}',
        f'SITE_URL=https://appenvios.vercel.app',
        f'POSTGRES_PASSWORD={aleatorio(32)}',
        f'JWT_SECRET={secreto_jwt}',
        f'SECRET_KEY_BASE={aleatorio(64)}',
        f'ANON_KEY={jwt("anon", secreto_jwt)}',
        f'SERVICE_ROLE_KEY={jwt("service_role", secreto_jwt)}',
        '# Completar a mano:',
        'RESEND_API_KEY=',
        'EMAIL_FUNCTION_SECRET=',
        'SIIGO_USERNAME=',
        'SIIGO_ACCESS_KEY=',
    ]
    with open(DESTINO, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lineas) + '\n')
    os.chmod(DESTINO, 0o600)
    print(f'Listo: {DESTINO}')


if __name__ == '__main__':
    main()
