import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject JWT token in every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('nimbus_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nimbus_token')
      localStorage.removeItem('nimbus_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
