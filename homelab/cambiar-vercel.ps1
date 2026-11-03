# Cambia la dirección y la llave de Supabase en los proyectos de Vercel al Supabase del homelab
# y los vuelve a publicar. Las llaves se leen del servidor (~/crm/.env): no pasan por ningún chat.
#
# Uso (PowerShell 5.1):  powershell -ExecutionPolicy Bypass -File .\homelab\cambiar-vercel.ps1
# Solo después de restaurar el respaldo final en el homelab.

# 'Continue': la CLI de Vercel escribe avisos por stderr y PowerShell 5.1 los tomaría como error;
# el resultado real de cada comando se revisa con $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
$Url = 'https://crm-api.helpsoluciones.com.co'
$Ssh = @('-i', "$env:USERPROFILE\.ssh\id_ed25519_homelab", '-o', 'BatchMode=yes', 'carlos@192.168.10.201')

$anon = (ssh @Ssh "grep ^ANON_KEY= ~/crm/.env | cut -d= -f2-" | Out-String).Trim()
$servicio = (ssh @Ssh "grep ^SERVICE_ROLE_KEY= ~/crm/.env | cut -d= -f2-" | Out-String).Trim()
if (-not $anon.StartsWith('eyJ') -or -not $servicio.StartsWith('eyJ')) { throw 'No se pudieron leer las llaves del servidor' }

$proyectos = @(
    @{ nombre = 'appenvios';               publica = 'appenvios.vercel.app';               vars = @{ VITE_SUPABASE_URL = $Url; VITE_SUPABASE_ANON_KEY = $anon } },
    @{ nombre = 'appenvios-vavf';          publica = 'appenvios-vavf.vercel.app';          vars = @{ VITE_SUPABASE_URL = $Url; VITE_SUPABASE_ANON_KEY = $anon } },
    @{ nombre = 'web-app';                 publica = 'web-app-three-beta-36.vercel.app';   vars = @{ VITE_SUPABASE_URL = $Url; VITE_SUPABASE_ANON_KEY = $anon } },
    @{ nombre = '2rpits-app';              publica = '2rpits-app.vercel.app';              vars = @{ VITE_SUPABASE_URL = $Url; VITE_SUPABASE_ANON_KEY = $anon } },
    @{ nombre = 'velia-app';               publica = 'velia-app.vercel.app';               vars = @{ NEXT_PUBLIC_SUPABASE_URL = $Url; NEXT_PUBLIC_SUPABASE_ANON_KEY = $anon; SUPABASE_SERVICE_ROLE_KEY = $servicio } },
    @{ nombre = 'help-solutions-main-new'; publica = 'www.helpsoluciones.com.co';          vars = @{ NEXT_PUBLIC_SUPABASE_URL = $Url; NEXT_PUBLIC_SUPABASE_ANON_KEY = $anon } }
)

$fallos = @()
foreach ($p in $proyectos) {
    Write-Host "== $($p.nombre)" -ForegroundColor Cyan
    try {
        foreach ($k in $p.vars.Keys) {
            # VITE_ y NEXT_PUBLIC_ van dentro de la página (públicas): tipo config. La de servicio queda secreta.
            $tipo = if ($k -match '^(VITE|NEXT_PUBLIC)_') { @('--type', 'config') } else { @() }
            npx --yes vercel env add $k --environment production --value $p.vars[$k] @tipo --force --yes --project $p.nombre 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "no se pudo poner $k" }
            Write-Host "   $k actualizada"
        }
        # Vuelve a construir la última versión publicada, ahora con las variables nuevas
        npx --yes vercel redeploy "https://$($p.publica)" --environment production 2>&1 | Select-Object -Last 1
        if ($LASTEXITCODE -ne 0) { throw 'falló la nueva publicación' }
    } catch {
        Write-Host "   ERROR: $_" -ForegroundColor Red
        $fallos += $p.nombre
    }
}
if ($fallos) { Write-Host "Revisar: $($fallos -join ', ')" -ForegroundColor Red } else { Write-Host 'Todos los proyectos apuntan al homelab.' -ForegroundColor Green }
