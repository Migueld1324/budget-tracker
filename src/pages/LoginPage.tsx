import { useState, type FormEvent } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Container,
  Link,
} from '@mui/material';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, register, error, loading } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      await register(email, password);
    } else {
      await login(email, password);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper sx={{ p: 4, width: '100%' }} elevation={3}>
          <Typography variant="h5" component="h1" sx={{ textAlign: 'center', mb: 3 }}>
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Correo electrónico"
              type="email"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 2, mb: 2 }}
            >
              {isRegister ? 'Registrarse' : 'Entrar'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <Link
              component="button"
              variant="body2"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Inicia sesión' : 'Regístrate'}
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
