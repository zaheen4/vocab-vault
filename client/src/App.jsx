import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import DeckLayout from './components/DeckLayout'
import Home from './pages/Home'
import Progress from './pages/Progress'
import Search from './pages/Search'
import Bookmarks from './pages/Bookmarks'
import AddWord from './pages/AddWord'
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
            <Route path="decks/:id/*" element={<DeckLayout />} />
            <Route path="progress" element={<Progress />} />
            <Route path="search" element={<Search />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="words/new" element={<AddWord />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
