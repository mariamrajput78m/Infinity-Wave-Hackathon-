import { useEffect } from 'react'

// The CRM screens are static pages served from /public.
// Send visitors from the root URL to the login screen.
function App() {
  useEffect(() => {
    window.location.replace('/login/Login.html')
  }, [])

  return null
}

export default App
