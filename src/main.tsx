import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { appConfig } from './config';
import { ServicesProvider, createServices } from './contexts/ServicesContext';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('#root 要素が見つかりません');
}

const services = createServices(appConfig);

createRoot(rootElement).render(
  <StrictMode>
    <ServicesProvider services={services}>
      <App config={appConfig} />
    </ServicesProvider>
  </StrictMode>,
);
