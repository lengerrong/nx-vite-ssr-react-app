import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import App from './app/app';

ReactDOM.hydrateRoot(
  document.getElementById('root') as HTMLElement,
  <StrictMode>
    <App />
  </StrictMode>
);
