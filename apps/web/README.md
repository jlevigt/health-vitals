# @health-vitals/web

The client application for the Health Data App. A modern, AI-enhanced dashboard for health metrics visualization.

## 🚀 Features

- **Health Dashboards:** Visualizations for Lipid Panel, Glucose Metabolism, and more.
- **Visual Excellence:** Premium UI with Glassmorphism, smooth gradients, and GSAP animations.
- **Mock Mode:** Full offline capability using MSW (Mock Service Worker).
- **Modern Patterns:** React 19, Vite 7, ESM, and absolute imports (`@/`).

## 🛠️ Tech Stack

- **React 19**
- **Vite 7**
- **Tailwind CSS 4**
- **Recharts** (Data Visualization)
- **GSAP** (Animations)
- **MSW** (Mocking)

## 💻 Development

Run from the project root:

```bash
bun run dev:web    # Connected to local API
bun run dev:mock   # Using MSW Mock API (Standalone)
```

## 🏗️ Structure

- `src/components/`: Reusable primitive components.
- `src/pages/`: Main application views.
- `src/context/`: Auth and Application state providers.
- `src/api/`: API client and type definitions.
- `src/mocks/`: MSW service definitions and mock data.
