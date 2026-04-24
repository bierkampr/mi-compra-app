# Página Principal — app/page.tsx

> Fuente: `app/page.tsx`
> Auditado: 2026-04-24
> Tipo: Client Component (495 líneas)
> Rol: Estado global y orquestador de toda la aplicación

---

## Resumen

Componente principal que contiene todo el estado global de la aplicación y orquesta la navegación entre vistas. Es el único punto donde se muta el estado `AppDB`.

---

## Estado Global

### Estado de Usuario
```typescript
const [user, setUser] = useState<UserState>({ name: '', loggedIn: false, token: '' });
```
- Controla si mostrar `AuthView` o la app principal
- Token de acceso a Google Drive

### Estado de Base de Datos
```typescript
const [db, setDb] = useState<AppDB>({ gastos: [], lista: [], customCategories: [] });
const [fileId, setFileId] = useState<string | null>(null);
const [priceFileId, setPriceFileId] = useState<string | null>(null);
const [priceCache, setPriceCache] = useState<PriceCache>({});
```
- `db`: Estado completo de gastos y lista
- `fileId`: ID del archivo en Google Drive
- `priceFileId`: ID del archivo de precios en Drive
- `priceCache`: Cache de precios para comparación

### Estado de Navegación
```typescript
const [activeTab, setActiveTab] = useState('home');
const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);
const [showHelp, setShowHelp] = useState(false);
```
- `activeTab`: Vista activa ('home', 'list', 'add', 'settings')
- `selectedGasto`: Si existe, se muestra `DetailView`
- `showHelp`: Controla `HelpModal`

### Estado de Flujo de Compra
```typescript
const [purchaseMode, setPurchaseMode] = useState<string | null>(null);
const [lastTab, setLastTab] = useState<string>('home');
const [tempPhotos, setTempPhotos] = useState<string[]>([]);
const [pendingGasto, setPendingGasto] = useState<any>(null);
```
- `purchaseMode`: Modo de escaneo ('super', 'mini', 'dining', 'manual')
- `tempPhotos`: Fotos capturadas temporalmente
- `pendingGasto`: Resultado de IA pendiente de confirmación

### Estado de Loading
```typescript
const [loading, setLoading] = useState(false);
const [loadingType, setLoadingType] = useState<'ai' | 'save'>('ai');
const [loadingStep, setLoadingStep] = useState(0);
```
- `loading`: Estado de carga global
- `loadingType`: 'ai' (escaneando) o 'save' (guardando)
- `loadingStep`: Paso actual del mensaje rotatorio

---

## Funciones Principales

### updateAndSync(newDb: AppDB)
**CRÍTICO:** ÚNICO punto de mutación del estado `db`.

**Flujo:**
1. `setDb(newDb)` - Actualiza estado React
2. `localStorage.setItem('mi_compra_cache_db', JSON.stringify(newDb))` - Persiste local
3. Si hay conexión y token → `saveDriveFile()` con debounce 1s

**Regla:** Nunca escribir en `localStorage` directamente desde componentes hijos.

### loadData(token: string)
Carga datos desde Google Drive y actualiza estado.

**Flujo:**
1. `Promise.all([getDriveFile(token), loadPriceHistoryFromDrive(token)])`
2. Actualiza `db`, `fileId`, `priceFileId`, `priceCache`
3. Guarda en localStorage como backup
4. Si es primera visita, muestra tour de ayuda

### startAnalysis(useList, forceManual, images)
Inicia el análisis de IA.

**Modo manual:**
- Crea gasto vacío con "NUEVA COMPRA"
- No llama a IA

**Modo IA:**
- Construye prompt con lista de productos si `useList=true`
- Llama `analyzeReceipt(images, purchaseMode, prompt)`
- Guarda resultado en `pendingGasto` con fotos temporales

### saveConfirmedGasto(finalGasto)
Guarda el gasto confirmado tras revisión.

**Flujo:**
1. Sube imágenes a Drive en paralelo (`Promise.all`)
2. Sincroniza productos con Supabase (alias)
3. Guarda precios en CSV de Drive
4. Actualiza lista de compras (marca items confirmados)
5. Crea registro `Gasto` y añade al inicio de `db.gastos`
6. Llama `updateAndSync()`
7. Resetea flujo de compra

### resetFlow(tab)
Resetea el estado del flujo de compra y navega a tab.

---

## Efectos

### Carga Inicial
- Detecta idioma del sistema
- Lee localStorage para estado instantáneo
- Si hay token, carga datos desde Drive
- Configura listeners de online/offline

### Navegación Nativa (Back Button)
- Maneja `popstate` para cerrar modales en orden inverso
- Prioridad: Help → DetailView → ReviewModal → Scanner → Home

### Push State
- Añade entrada al historial cuando hay modal abierto o tab diferente a home
- Permite usar botón back del navegador

### Rotador de Loading
- Cambia mensaje cada 3 segundos mientras `loading=true`
- 4 mensajes distintos para IA y 4 para save

---

## Estadísticas (useMemo)

Calcula estadísticas del mes actual:
- Total gastado
- Gastos del mes actual
- Gastos del mes anterior
- Agrupación por comercio (usando `normalizeStoreName`)

Filtrado por `currentViewDate` (no el mes real).

---

## Renderizado Condicional

### Sin Login
```typescript
if (!user.loggedIn) return <AuthView CLIENT_ID={CLIENT_ID} txt={txt} />;
```

### Con Login
Renderiza:
1. `Navigation` (barra inferior)
2. Vista según `activeTab`:
   - 'home' → `DashboardView`
   - 'list' → `ShoppingListView`
   - 'add' → `ScannerView`
   - 'settings' → `SettingsView`
3. Modales según estado:
   - `showHelp` → `HelpModal`
   - `purchaseMode` → `ScannerView.Capture`
   - `pendingGasto` → `ReviewModal`
   - `selectedGasto` → `DetailView`
4. `loading` → Spinner global (z-9000)
5. `PWAInstallBanner`

---

## Integración de i18n

```typescript
const txt = useCallback((key: string) => t(key, lang), [lang]);
```

Se pasa como prop a todos los componentes. Todo texto visible usa `txt('modulo.clave')`.

---

## Notas Importantes

- **Estado centralizado:** Todo el estado vive aquí, no en componentes hijos
- **updateAndSync:** ÚNICO punto de mutación de DB
- **Debounce:** Upload a Drive tiene 1s de debounce para evitar condiciones de carrera
- **Offline-first:** localStorage es fuente de verdad primaria, Drive es respaldo
- **Paralelización:** Upload de imágenes usa `Promise.all` para velocidad
