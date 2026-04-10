# Guía de Activación: Servidor MCP n8n (Pro)

Para activar permanentemente las herramientas de n8n en tu entorno de Antigravity, sigue estos pasos:

## 1. Localiza tu archivo de configuración MCP
El archivo de configuración para tu cliente Antigravity se encuentra en:
👉 `C:\Users\carlo\.gemini\antigravity\mcp_config.json`

## 2. Añade este bloque JSON
Abre el archivo anterior y añade la sección `"n8n"` dentro de `"mcpServers"`. Asegúrate de respetar la estructura de Antigravity:

```json
    "n8n": {
      "$typeName": "exa.cascade_plugins_pb.CascadePluginCommandTemplate",
      "command": "npx",
      "args": [
        "-y",
        "n8n-mcp"
      ],
      "env": {
        "N8N_API_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOTBmMTU1Zi0xYWU5LTQwM2ItYmE4Ni05M2RmMDQ4OWM5MzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjAwNDdhMzc4LWNkNjYtNGVjOC1hMjE1LWZjMDU2ODk1OWUxZCIsImlhdCI6MTc3NDA2MDMwNn0.jMCboSDwziCKAX1DUU_CiKC4-f60KvQaNQCIrBFkZCE",
        "N8N_BASE_URL": "http://localhost:5678"
      }
    }
```

## 3. Skills Habilitados (Pro)
Una vez activado, podré realizar las siguientes acciones de nivel **Enterprise**:

| Skill | Función |
| :--- | :--- |
| `list_workflows` | Auditoría de automatizaciones existentes. |
| `get_workflow` | Análisis profundo de la lógica de nodos. |
| `create_workflow` | Inyección de flujos complejos (JSON). |
| `execute_workflow` | Disparo de flujos bajo demanda. |
| `update_workflow` | Refactorización y corrección de errores en automatizaciones. |

## 4. Reglas de Automatización Avanzada (IA)
- **Manejo de Errores**: Todos los flujos nuevos incluirán nodos "Error Trigger".
- **Optimización**: Se pre-procesarán datos con nodos de código JavaScript.
- **Seguridad**: Se utilizarán credenciales por ID.
