/**
 * client/src/api/axios.js
 * Configured Axios instance with:
 * - JWT Authorization header injection
 * - Refresh token rotation on 401 (silent token refresh)
 * - Session timeout: redirect to login if refresh fails
 * - Request/response interceptors
 */
import axios from 'axios'
import { store } from '../store'
import { selectAccessToken, clearCredentials, updateToken } from '../store/authSlice'

const BASE_URL = '/api' // proxied by Vite to http://localhost:5000/api

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // required for httpOnly refresh token cookie
  timeout: 30000,
})

// ── Request interceptor: attach access token ──
api.interceptors.request.use(
  (config) => {
    const token = selectAccessToken(store.getState())
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 with silent refresh ──
let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (cb) => refreshSubscribers.push(cb)
const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        const newToken = data.data.accessToken
        store.dispatch(updateToken(newToken))
        onRefreshed(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (_refreshErr) {
        // Refresh failed — session expired or token family compromised
        store.dispatch(clearCredentials())
        window.location.href = '/login?expired=1'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
