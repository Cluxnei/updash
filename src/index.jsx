import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Dashboard from './pages/dashboard';
import Login from './pages/login';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import { createSocket, handleTokenExpired, toastError } from './helpers';

const rootElement = document.getElementById('root');

const socket = createSocket();

socket.on('login-token-expired', ({token}) => {
  if (handleTokenExpired(token)) {
    toastError('Your session has expired. Please login again.');
    window.location.href = '/';
  }
});

socket.on('error-message', (message) => {
  toastError(message);
});

ReactDOM.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dash" element={<Dashboard />} />
    </Routes>
  </BrowserRouter>,
  rootElement,
);
