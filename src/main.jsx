import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ✅ CSS를 여기서 불러오기 (빌드 시 assets 경로로 변환됨)
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
