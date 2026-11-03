# Descarga TODOS los archivos de Supabase Storage del proyecto AppEnvios a C:\respaldos-crm\storage
# (RUT, Cámaras de Comercio, fotos de entregas y remisiones...). pg_dump no los incluye.
#
# Uso (PowerShell 5.1):  powershell -ExecutionPolicy Bypass -File .\scripts\respaldo-storage.ps1
# Pide una llave secreta (sb_secret_...) creada en Project Settings → API Keys.
# La llave no se guarda en ningún lado; bórrela en Supabase al terminar.

$ErrorActionPreference = 'Stop'
$Url = 'https://matyjysinegbibdwzhoq.supabase.co'
$Destino = 'C:\respaldos-crm\storage'

$seguro = Read-Host 'Pegue la llave secreta (no se muestra)' -AsSecureString
$Llave = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro))
$H = @{ apikey = $Llave }

function Listar([string]$bucket, [string]$prefijo) {
    $todos = @()
    $offset = 0
    do {
        $cuerpo = @{ prefix = $prefijo; limit = 1000; offset = $offset; sortBy = @{ column = 'name'; order = 'asc' } } | ConvertTo-Json
        $lote = Invoke-RestMethod -Method Post -Uri "$Url/storage/v1/object/list/$bucket" -Headers $H -ContentType 'application/json' -Body $cuerpo
        $todos += $lote
        $offset += 1000
    } while (@($lote).Count -eq 1000)
    foreach ($it in $todos) {
        $ruta = if ($prefijo) { "$prefijo/$($it.name)" } else { $it.name }
        if ($null -eq $it.id) { Listar $bucket $ruta }   # carpeta
        else { $ruta }
    }
}

$buckets = Invoke-RestMethod -Uri "$Url/storage/v1/bucket" -Headers $H
$total = 0; $fallos = 0
foreach ($b in $buckets) {
    $archivos = @(Listar $b.id '')
    Write-Host "Bucket $($b.id): $($archivos.Count) archivos"
    foreach ($a in $archivos) {
        $local = Join-Path $Destino (Join-Path $b.id ($a -replace '/', '\'))
        New-Item -ItemType Directory -Force -Path (Split-Path $local) | Out-Null
        $rutaUrl = ($a -split '/' | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/'
        try {
            Invoke-WebRequest -UseBasicParsing -Uri "$Url/storage/v1/object/$($b.id)/$rutaUrl" -Headers $H -OutFile $local
            $total++
        } catch {
            $fallos++
            Write-Warning "No se pudo bajar $($b.id)/$a : $($_.Exception.Message)"
        }
    }
}

$mb = [math]::Round(((Get-ChildItem $Destino -Recurse -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
Write-Host "Listo: $total archivos descargados ($mb MB) en $Destino. Fallos: $fallos"
