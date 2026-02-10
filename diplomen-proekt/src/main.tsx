import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.tsx';
import { ProgressProvider } from './context/ProgressContext.tsx';
import { useAuth } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';

const client = new QueryClient();

function AppWithProgress() {
  const { user } = useAuth();
  return (
    <ProgressProvider userId={user?.id ?? null}>
      <App />
    </ProgressProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <AuthProvider>
        <ToastProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppWithProgress />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);

)
