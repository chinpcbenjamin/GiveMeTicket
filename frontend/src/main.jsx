import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import Home from './Home.jsx';
import Buy from './pages/Buy.jsx';
import Resell from './pages/Resell.jsx';
import MyTickets from './pages/MyTickets.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/resell" element={<Resell />} />
        <Route path="/my-tickets" element={<MyTickets />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
