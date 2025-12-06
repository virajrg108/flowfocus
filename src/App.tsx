import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import TimerPage from "./pages/TimerPage";
import TasksPage from "./pages/TasksPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";

import { ThemeProvider } from "./components/ThemeProvider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter basename="/flowfocus">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<TimerPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
