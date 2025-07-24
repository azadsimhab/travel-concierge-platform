import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container } from '@mui/material';

// Components
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ChatInterface from './components/ChatInterface/ChatInterface';
import TripPlanner from './components/TripPlanner/TripPlanner';
import ImageSearch from './components/ImageSearch/ImageSearch';
import Dashboard from './components/Dashboard/Dashboard';
import Profile from './components/Profile/Profile';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { TripProvider } from './contexts/TripContext';

// Services
import { WebSocketService } from './services/WebSocketService';
import { AuthService } from './services/AuthService';

// Types
import { User, Trip, Message } from './types';

// Styles
import './App.css';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

// Main App Component
const AppContent: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [wsService, setWsService] = useState<WebSocketService | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize WebSocket connection
      const ws = new WebSocketService();
      ws.connect();
      setWsService(ws);

      return () => {
        ws.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <div>Loading...</div>
      </Box>
    );
  }

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
          <Routes>
            {!isAuthenticated ? (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Login />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/chat" element={<ChatInterface />} />
                <Route path="/trip-planner" element={<TripPlanner />} />
                <Route path="/image-search" element={<ImageSearch />} />
                <Route path="/profile" element={<Profile />} />
              </>
            )}
          </Routes>
        </Container>
        <Footer />
      </Box>
    </Router>
  );
};

// App Component with Providers
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ChatProvider>
          <TripProvider>
            <AppContent />
          </TripProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 