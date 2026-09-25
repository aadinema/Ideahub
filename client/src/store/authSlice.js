import { createSlice } from '@reduxjs/toolkit'

const storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('ideahub_user')) }
  catch { return null }
})()

const initialState = {
  user: storedUser || null,
  accessToken: null, // SECURITY: Access token now held in memory only, never persisted to localStorage
  isAuthenticated: !!storedUser,
}



const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload
      state.user = user
      state.accessToken = accessToken
      state.isAuthenticated = true
      // SECURITY: Store only user info (non-sensitive) in localStorage
      localStorage.setItem('ideahub_user', JSON.stringify(user))
      // SECURITY: Access token is kept in memory only. Refresh token is in httpOnly cookie.
      // On app reload, the Axios interceptor will call /api/auth/refresh to get a new access token.
    },
    clearCredentials: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      localStorage.removeItem('ideahub_user')
    },
    updateToken: (state, action) => {
      // SECURITY: Update access token in memory only (no localStorage)
      state.accessToken = action.payload
    },
  },
})

export const { setCredentials, clearCredentials, updateToken } = authSlice.actions

// Selectors
export const selectCurrentUser  = (state) => state.auth.user
export const selectAccessToken  = (state) => state.auth.accessToken
export const selectIsAuth       = (state) => state.auth.isAuthenticated

export default authSlice.reducer
