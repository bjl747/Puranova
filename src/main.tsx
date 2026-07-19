import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/global.css';
import { App } from './App';
import { AuthProvider } from './hooks/useAuth';
import { NowProvider } from './hooks/useNow';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NowProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NowProvider>
    </BrowserRouter>
  </StrictMode>,
);
