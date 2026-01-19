# @health-data/web

The client application for the Health Data App. A modern, AI-enhanced dashboard for health metrics visualization.

## 🚀 Features

- **Health Dashboards:** Visualizations for Lipid Panel, Glucose Metabolism, and more.
- **Visual Excellence:** Premium UI with Glassmorphism, smooth gradients, and GSAP animations.
- **Mock Mode:** Full offline capability using MSW (Mock Service Worker).
- **Responsive:** Optimized for diagnostic analysis on any device.

## 🛠️ Tech Stack

- **React 19**
- **Vite 6**
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

- `src/components/`: Reusable primitive components (Charts, Layouts).
- `src/pages/`: Main application views.
- `src/mocks/`: MSW service definitions and mock data.
