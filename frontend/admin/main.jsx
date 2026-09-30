import React from 'react';
import { createRoot } from 'react-dom/client';
import ClassicAdminApp from './classic-app.jsx';
import '../src/styles.css';
import '../src/commerce.css';
import './styles.css';
import './classic-admin.css';
import './brand-palette.css';
createRoot(document.getElementById('root')).render(<ClassicAdminApp />);
