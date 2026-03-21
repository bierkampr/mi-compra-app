# Arquitectura del Sistema

## Flujo de Datos Híbrido
La app utiliza una estrategia de 3 capas para el almacenamiento:
1. **Capa Local (Primaria):** `localStorage` (`mi_compra_cache_db`). Acceso instantáneo.
2. **Capa Personal (Respaldo):** Google Drive AppDataFolder (`mi_compra_data.json`). Archivo oculto en el drive del usuario.
3. **Capa Global (Catálogo):** Supabase. Guarda el catálogo maestro de productos y evolución de precios.

## Z-Index Hierarchy (ESTRICTA)
No alterar estos valores en los componentes:
- `z-[9999]`: Modales críticos y overlays de sistema.
- `z-[9000]`: Spinner de carga global (`Loader2`).
- `z-[1200]`: `DetailView`.
- `z-[1100]`: `ReviewModal`.
- `z-[1000]`: `ScannerView.Capture`.
- `z-[600]`: Modales de contenido completo.
- `z-[100]`: Navegación inferior (`nav-bottom`).

## Gestión de Estado Central
El estado de la base de datos se maneja en `app/page.tsx` con la interfaz `AppDB`. Toda mutación de estado DB debe pasar por la función `updateAndSync(newDb)` para asegurar la persistencia en Drive.
