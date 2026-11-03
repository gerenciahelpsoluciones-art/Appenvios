"""Sube a Storage del homelab los archivos respaldados (carpeta <bucket>/<ruta>).

Uso:  python3 subir-storage.py <carpeta storage> [url]      (url por defecto: http://localhost:8300)
Lee SERVICE_ROLE_KEY de homelab/.env. Reemplaza el archivo si ya existe (x-upsert).
"""
import mimetypes
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))


def llave_servicio() -> str:
    with open(os.path.join(AQUI, '.env'), encoding='utf-8') as f:
        for linea in f:
            if linea.startswith('SERVICE_ROLE_KEY='):
                return linea.split('=', 1)[1].strip()
    sys.exit('No hay SERVICE_ROLE_KEY en .env')


def main() -> None:
    carpeta = sys.argv[1]
    url = (sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:8300').rstrip('/')
    llave = llave_servicio()
    ok = fallos = 0
    for bucket in sorted(os.listdir(carpeta)):
        raiz = os.path.join(carpeta, bucket)
        if not os.path.isdir(raiz):
            continue
        for dirpath, _, archivos in os.walk(raiz):
            for nombre in archivos:
                local = os.path.join(dirpath, nombre)
                ruta = os.path.relpath(local, raiz).replace(os.sep, '/')
                destino = f'{url}/storage/v1/object/{bucket}/{urllib.parse.quote(ruta)}'
                tipo = mimetypes.guess_type(nombre)[0] or 'application/octet-stream'
                with open(local, 'rb') as f:
                    datos = f.read()
                req = urllib.request.Request(destino, data=datos, method='POST', headers={
                    'apikey': llave, 'Authorization': f'Bearer {llave}',
                    'Content-Type': tipo, 'x-upsert': 'true',
                })
                try:
                    urllib.request.urlopen(req, timeout=120).read()
                    ok += 1
                except urllib.error.HTTPError as e:
                    fallos += 1
                    print(f'FALLO {bucket}/{ruta}: HTTP {e.code} {e.read()[:200]!r}')
                if (ok + fallos) % 50 == 0:
                    print(f'  {ok + fallos} archivos...')
    print(f'Listo: {ok} subidos, {fallos} fallos')


if __name__ == '__main__':
    main()
