# Módulos UI Principales

Toda la UI principal reside en `app/components/` y se renderiza condicionalmente en `app/page.tsx` según el estado `activeTab`.

## Flujo de Pantallas
1. **AuthView**: Inicia sesión con Google Identity Services (GSI).
2. **DashboardView**: Muestra gráficos SVG nativos (donut chart) y listado mensual. Filtra gastos por la fecha de `currentViewDate`.
3. **ShoppingListView**: Lista de la compra. Tiene un buscador inteligente que chequea `Supabase` para autocompletado fuzzy.
4. **ScannerView**: Interfaz de cámara nativa (WebRTC). Captura, recorta y comprime imágenes antes de pasarlas a la IA.
5. **ReviewModal**: Pantalla crucial donde el humano revisa lo que la IA extrajo antes de guardarlo. Muestra comparación de precios históricos.
6. **DetailView**: Visor del gasto y lightbox para ver el ticket en grande recuperado de Google Drive.

## Regla de Estilos
Todos los componentes deben usar `txt('ruta.al.texto')` pasándoselo por props desde `page.tsx` para el soporte i18n.
