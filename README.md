# 🛒 Mi Compra App (Reality Audit v2.0)

**Mi Compra App** is a high-performance, offline-first Next.js application designed to manage shopping lists and track shopping expenses using advanced AI for receipt analysis.

## 🚀 Features

-   **Offline-First Architecture**: Uses `localStorage` for instant responsiveness and background synchronization.
-   **Google Drive Sync**: Automatically persists data to a private, hidden `AppDataFolder` in the user's Google Drive.
-   **Distributed AI Pipeline**: Processes receipts using a two-step pipeline (Vision with Mistral/Gemini and Synthesis with Groq) for maximum accuracy and reliable JSON extraction.
-   **Smart Shopping List**: Seamlessly reconciles scanned receipts with planned shopping list items.
-   **Global Product Catalog**: Integrates with Supabase for a shared product database and price history tracking.
-   **Premium UI**: Ultra-dark theme with fluid typography and a mobile-optimized experience.

## 🛠️ Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **UI Library**: React 19
-   **Styling**: Tailwind CSS
-   **Database**: Supabase (Global Catalog)
-   **Storage**: Google Drive (Private User Data)
-   **AI (Vision)**: Mistral Pixtral / Gemini Pro Vision
-   **AI (Reasoning)**: Groq (Llama 3.3 70B)
-   **Icons**: Lucide React

## 📋 Prerequisites

-   Node.js 20+
-   A Google Cloud Project with Google Drive API enabled and OAuth2 credentials.
-   A Supabase project.
-   API Keys for Mistral, Groq, and/or Google Gemini.

## ⚙️ Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd mi-compra-app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory (see [ENVIRONMENT.md](docs/ENVIRONMENT.md) for details).

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

5.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## 📂 Project Structure

-   `app/`: Next.js App Router (Pages and API Routes).
-   `app/components/`: Modular React components and views.
-   `lib/`: Core logic, API clients, and utility functions.
-   `locales/`: Internationalization JSON files.
-   `public/`: Static assets (icons, manifest).
-   `docs/`: Comprehensive project documentation.

## 📄 Documentation

For detailed technical information, please refer to the `docs/` directory:
-   [Architecture Overview](docs/ARCHITECTURE.md)
-   [Authentication Flow](docs/AUTH.md)
-   [API Reference](docs/API.md)
-   [Database Schema](docs/DATABASE.md)
-   [Component Library](docs/COMPONENTS.md)
-   [Environment Variables](docs/ENVIRONMENT.md)

---
Developed with ❤️ for efficient shopping management.
