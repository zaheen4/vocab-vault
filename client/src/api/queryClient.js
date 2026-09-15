import { QueryClient } from '@tanstack/react-query'

// Singleton query client so session code (logout) can clear cached user data
// without prop-drilling the client through context.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
})
