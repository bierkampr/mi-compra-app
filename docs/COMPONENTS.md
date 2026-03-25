# 🧩 Component Library

Mi Compra App is built with a view-based architecture, where the main `page.tsx` acts as an orchestrator for several high-level view components.

## 🖼️ Core Views (`app/components/`)

### `DashboardView.tsx`
-   **Purpose**: The main landing screen after login.
-   **Key Features**: Monthly spending summary, spending by store (bar charts), and recent activity list.
-   **Props**: `stats`, `currentViewDate`, `setCurrentViewDate`, `setSelectedGasto`, `setActiveTab`, `txt`, `lang`.

### `ScannerView.tsx`
-   **Purpose**: Handles the camera interface and initial receipt processing.
-   **Key Features**: Multi-capture mode (up to 3 photos), real-time camera preview, and "AI Magic" trigger.
-   **Props**: `db`, `updateAndSync`, `setPurchaseMode`, `startAnalysis`, `txt`.

### `ShoppingListView.tsx`
-   **Purpose**: Manages the planned items to buy.
-   **Key Features**: Add/remove items, fuzzy search from master catalog, and "Start Shopping" mode.
-   **Props**: `db`, `updateAndSync`, `setPurchaseMode`, `txt`.

### `ReviewModal.tsx`
-   **Purpose**: The "Brain" of the verification process.
-   **Key Features**: Displays AI-extracted data, allows manual corrections, calculates totals, and reconciles with the shopping list.
-   **Props**: `pendingGasto`, `setPendingGasto`, `onSave`, `onCancel`, `loading`, `db`, `txt`.

### `DetailView.tsx`
-   **Purpose**: Detailed view of a past expense.
-   **Key Features**: List of products, total, store name, and display of saved receipt images (fetched from Drive).
-   **Props**: `gasto`, `onClose`, `onDelete`, `token`, `txt`.

### `AuthView.tsx`
-   **Purpose**: Initial login screen.
-   **Key Features**: Google Sign-In integration and app value proposition.
-   **Props**: `CLIENT_ID`, `txt`.

### `SettingsView.tsx`
-   **Purpose**: Configuration and user profile.
-   **Key Features**: Logout, database backup/export, and language selection.
-   **Props**: `user`, `db`, `setActiveTab`, `txt`, `onShowHelp`.

## 🛠️ Global UI Utilities

-   **`Navigation.tsx`**: The main bottom navigation bar.
-   **`HelpModal.tsx`**: Interactive tutorial/onboarding helper.
-   **`ConfirmModal.tsx`**: Standardized confirmation dialogs.
-   **`Providers.tsx`**: Context providers (currently minimal).

## 🎨 Styling System
The app uses **Vanilla Tailwind CSS** with a custom design system defined in `globals.css`.
-   **Primary Colors**: Brand Violet/Primary.
-   **Design Tokens**: `card-premium`, `btn-primary`, `input-premium`.
-   **Dynamic Sizing**: Uses fluid typography (`text-fluid-lg`) to adapt to different mobile screen sizes perfectly.
