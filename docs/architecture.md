### 1. Directory Tree

```text
src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.guard.ts           # Functional router guard
│   │   │   ├── auth.interceptor.ts     # Functional HTTP interceptor
│   │   │   └── auth.service.ts         # Singleton authentication logic
│   │   ├── http/
│   │   │   ├── api-response.model.ts
│   │   │   ├── base-http.service.ts    # Abstract/Base HTTP CRUD operations
│   │   │   └── error.interceptor.ts    # Global error handling interceptor
│   │   ├── utils/
│   │   │   ├── crypto.util.ts          # Crypto-js wrappers
│   │   │   └── secure-storage.util.ts
│   │   └── core.providers.ts           # Aggregated core providers array
│   ├── shared/
│   │   ├── ui/                         # PrimeNG wrapper components
│   │   │   ├── ui-button/
│   │   │   │   └── ui-button.component.ts
│   │   │   ├── ui-chart/               # Chart.js wrapper
│   │   │   │   └── ui-chart.component.ts
│   │   │   └── index.ts
│   │   ├── directives/
│   │   │   ├── has-permission.directive.ts
│   │   │   └── index.ts
│   │   └── pipes/
│   │       ├── safe-html.pipe.ts
│   │       └── index.ts
│   ├── layout/
│   │   ├── components/
│   │   │   ├── app-layout/
│   │   │   │   └── app-layout.component.ts
│   │   │   ├── app-sidebar/
│   │   │   │   └── app-sidebar.component.ts
│   │   │   ├── app-topbar/
│   │   │   │   └── app-topbar.component.ts
│   │   │   ├── app-footer/
│   │   │   │   └── app-footer.component.ts
│   │   │   └── app-menu/
│   │   │       ├── app-menu.component.ts
│   │   │       └── app-menu-item.component.ts
│   │   ├── services/
│   │   │   └── layout.service.ts       # Layout state (sidebar toggle, theme)
│   │   └── layout.routes.ts            # Routes that require the AppLayout shell
│   ├── store/
│   │   ├── app.store.ts                # Global SignalStore (theme, user session)
│   │   └── auth.store.ts               # Global Auth SignalStore
│   ├── features/
│   │   ├── dashboard/                  # Domain feature
│   │   │   ├── components/             # Feature-specific dumb components
│   │   │   │   ├── stats-widget.component.ts
│   │   │   │   └── revenue-chart.component.ts
│   │   │   ├── store/
│   │   │   │   └── dashboard.store.ts  # Localized Feature SignalStore
│   │   │   ├── dashboard.component.ts  # Smart component routing entry point
│   │   │   └── dashboard.routes.ts
│   │   ├── auth/                       # Public domain feature
│   │   │   ├── login/
│   │   │   │   └── login.component.ts
│   │   │   └── auth.routes.ts
│   │   └── settings/
│   │       ├── settings.component.ts
│   │       └── settings.routes.ts
│   ├── app.component.ts
│   ├── app.config.ts                   # Application configuration and providers
│   └── app.routes.ts                   # Root routing configuration
├── assets/
│   └── styles/
│       ├── tailwind.css                # Tailwind v4 entrypoint
│       └── layout.scss                 # Custom layout overrides if strictly needed
├── environments/
│   ├── environment.ts
│   └── environment.development.ts
├── index.html
└── main.ts                             # Bootstrap entry point
```

### 2. Architectural Overview

*   **Core (`src/app/core`)**: Strictly reserved for singleton services, functional interceptors, functional guards, and foundational utilities that must be instantiated only once per application lifecycle. It exposes `core.providers.ts` to cleanly register these elements in the root `app.config.ts`. UI components are expressly forbidden here.
*   **Shared (`src/app/shared`)**: Contains reusable, presentational ("dumb") standalone components, directives, and pipes. Crucially, this is where PrimeNG components are wrapped and standardized. This ensures consistency across the enterprise applications and isolates third-party UI library upgrades. Components here should rely on Signal inputs and outputs and contain no domain-specific business logic or HTTP calls.
*   **Layout (`src/app/layout`)**: Encapsulates the Sakai NG application shell. It manages the structural orchestration of the sidebar, topbar, and footer. It provides `layout.routes.ts` to map child feature routes into the central router outlet of the `app-layout.component.ts`, ensuring the shell is conditionally applied to authenticated routes.
*   **Store (`src/app/store`)**: Houses global state management leveraging `@ngrx/signals`. `app.store.ts` tracks application-wide state (e.g., active theme, global loading states). Feature-specific state is delegated to the `features/` directory (e.g., `dashboard.store.ts`) to maintain boundary cohesion and support tree-shaking when features are lazy-loaded.
*   **Features (`src/app/features`)**: Represents independent, domain-driven modules. Each directory (e.g., `dashboard`, `settings`) is self-contained with its own routing, smart/dumb components, and feature-level SignalStores. They are lazy-loaded natively via the Router using `loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)`.

### 3. Configuration Highlights

*   **Tailwind PostCSS (`src/assets/styles/tailwind.css` & `.postcssrc.json`)**: 
    In Tailwind CSS v4, the configuration is heavily CSS-driven. `@tailwindcss/postcss` is executed via the Angular CLI build pipeline. The `tailwind.css` file serves as the configuration root via `@import "tailwindcss";` and `@plugin "tailwindcss-primeui";`. The `.postcssrc.json` simply enables the Tailwind PostCSS plugin.
*   **PrimeNG Theme Provider (`src/app/app.config.ts`)**:
    PrimeNG v21 drops module imports in favor of root configuration. The theme and UI configuration must be injected into the `ApplicationConfig` using `providePrimeNG()` alongside `provideAnimationsAsync()`.
    ```typescript
    // app.config.ts
    export const appConfig: ApplicationConfig = {
      providers: [
        provideRouter(routes),
        provideAnimationsAsync(),
        providePrimeNG({
          theme: { preset: Aura, options: { darkModeSelector: '.p-dark' } }
        })
      ]
    };
    ```
*   **NgRx Signal Store (`src/app/app.config.ts` or Component Level)**:
    Global SignalStores (like `AppStore` or `AuthStore`) are provided at the root level using `provideAppStore()` or by declaring `providedIn: 'root'` on the `signalStore` definition itself. Feature-specific stores (e.g., `DashboardStore`) are strictly provided at the component level within the `features` directory (`providers: [DashboardStore]`) to tie their lifecycle directly to the feature component tree.
*   **Functional Interceptors (`src/app/app.config.ts`)**:
    Registered within `provideHttpClient()`.
    ```typescript
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
    ```