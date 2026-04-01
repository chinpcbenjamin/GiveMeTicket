import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import Home from './pages/Home.jsx';
import Buy from './pages/Buy.jsx';
import Resell from './pages/Resell.jsx';
import MyTickets from './pages/MyTickets.jsx';
import Marketplace from './pages/Marketplace.jsx';
import Events from './pages/Events.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buy/:eventId" element={<Buy />} />
        <Route path="/resell/:ticketId" element={<Resell />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/events" element={<Events />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
