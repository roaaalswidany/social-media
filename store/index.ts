import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import postsSlice from './slices/postsSlice'
import usersSlice from './slices/usersSlice'
import notificationsSlice from './slices/notificationsSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    posts: postsSlice,
    users: usersSlice,
    notifications: notificationsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: ['register'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch