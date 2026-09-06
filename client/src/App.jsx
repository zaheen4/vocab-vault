import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import DeckLayout from './components/DeckLayout'
import Home from './pages/Home'
import Practice from './pages/Practice'
import Quiz from './pages/Quiz'
import Typing from './pages/Typing'
import Progress from './pages/Progress'
import Search from './pages/Search'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  // State initializer so StrictMode double-render doesn't mint two clients
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1 } } })
  )
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="decks/:id" element={<DeckLayout />}>
              <Route index element={<Practice />} />
              <Route path="quiz" element={<Quiz />} />
              <Route path="typing" element={<Typing />} />
            </Route>
            <Route path="progress" element={<Progress />} />
            <Route path="search" element={<Search />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
