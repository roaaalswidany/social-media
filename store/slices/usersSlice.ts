/* eslint-disable @typescript-eslint/no-explicit-any */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  name: string
  username: string
  email: string
  bio?: string
  avatar?: string
  createdAt: string
  _count?: {
    followers: number
    following: number
    posts: number
  }
  isFollowing?: boolean
}

interface UsersState {
  users: User[]
  currentUser: User | null
  isLoading: boolean
  error: string | null
}

const initialState: UsersState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
}


export const followUser = createAsyncThunk(
  'users/followUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error)
      }

      return { userId }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)


export const unfollowUser = createAsyncThunk(
  'users/unfollowUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        return rejectWithValue(data.error)
      }

      return { userId }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)


export const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error)
      }

      return data.user
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(followUser.fulfilled, (state, action) => {
        const { userId } = action.payload
        
        const user = state.users.find(u => u.id === userId)
        if (user) {
          user.isFollowing = true
          user._count = {
            ...user._count,
            followers: (user._count?.followers || 0) + 1
          }
        }
        
        
        if (state.currentUser?.id === userId) {
          state.currentUser.isFollowing = true
          state.currentUser._count = {
            ...state.currentUser._count,
            followers: (state.currentUser._count?.followers || 0) + 1
          }
        }
      })
      
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const { userId } = action.payload
        
        const user = state.users.find(u => u.id === userId)
        if (user) {
          user.isFollowing = false
          user._count = {
            ...user._count,
            followers: Math.max(0, (user._count?.followers || 1) - 1)
          }
        }
        
        if (state.currentUser?.id === userId) {
          state.currentUser.isFollowing = false

state.currentUser._count = {
            ...state.currentUser._count,
            followers: Math.max(0, (state.currentUser._count?.followers || 1) - 1)
          }
        }
      })
      
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentUser = action.payload
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, setCurrentUser } = usersSlice.actions
export default usersSlice.reducer