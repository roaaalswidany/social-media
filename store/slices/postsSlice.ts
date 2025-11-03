/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface Like {
  id: string
  userId: string
  postId: string
  createdAt: string
  user?: {
    id: string
    name: string
    username: string
  }
}

export interface Post {
  id: string
  caption: string
  image?: string
  authorId: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    username: string
    avatar?: string
  }
  likes: Like[]
  _count: {
    likes: number
    comments: number
  }
  isLiked?: boolean
}

interface PostsState {
  posts: Post[]
  currentPost: Post | null
  isLoading: boolean
  error: string | null
  hasMore: boolean
  page: number
}

const initialState: PostsState = {
  posts: [],
  currentPost: null,
  isLoading: false,
  error: null,
  hasMore: true,
  page: 1,
}

// Fetch posts
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async ({ page = 1, limit = 10 }: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/posts?page=${page}&limit=${limit}`, {
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch posts')
      }

      return {
        posts: data.posts,
        hasMore: data.pagination?.hasMore || false,
        page,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred')
    }
  }
)

// Fetch feed posts
export const fetchFeed = createAsyncThunk(
  'posts/fetchFeed',
  async ({ page = 1, limit = 10 }: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/posts/feed?page=${page}&limit=${limit}`, {
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch feed')
      }

      return {
        posts: data.posts,
        hasMore: data.pagination?.hasMore || false,
        page,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred')
    }
  }
)

// Create post
export const createPost = createAsyncThunk(
  'posts/createPost',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create post')
      }

      return data.post
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred')
    }
  }
)

// Like post
export const likePost = createAsyncThunk(
  'posts/likePost',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to like post')
      }

      return { postId, like: data.like, likesCount: data.likesCount }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred')
    }
  }
)

// Unlike post
export const unlikePost = createAsyncThunk(
  'posts/unlikePost',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to unlike post')
      }

      return { postId, likesCount: data.likesCount }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred')
    }
  }
)

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentPost: (state, action: PayloadAction<Post | null>) => {
      state.currentPost = action.payload
    },
    addPost: (state, action: PayloadAction<Post>) => {
      state.posts.unshift(action.payload)
    },
    updatePost: (state, action: PayloadAction<{ id: string; updates: Partial<Post> }>) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id)
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...action.payload.updates }
      }
      
      if (state.currentPost?.id === action.payload.id) {
        state.currentPost = { ...state.currentPost, ...action.payload.updates }
      }
    },
    deletePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(post => post.id !== action.payload)
      if (state.currentPost?.id === action.payload) {
        state.currentPost = null
      }
    },
    // Reducer 
    removeLike: (state, action: PayloadAction<{ postId: string; userId: string }>) => {
      const { postId, userId } = action.payload
      const post = state.posts.find(p => p.id === postId)
      if (post && post.likes) {
        post.likes = post.likes.filter(like => like.userId !== userId)
        post._count.likes = Math.max(0, post._count.likes - 1)
        post.isLiked = false
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchPosts
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload.page === 1) {
          state.posts = action.payload.posts
        } else {
          state.posts = [...state.posts, ...action.payload.posts]
        }
        state.hasMore = action.payload.hasMore
        state.page = action.payload.page
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // fetchFeed
      .addCase(fetchFeed.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload.page === 1) {
          state.posts = action.payload.posts
        } else {
          state.posts = [...state.posts, ...action.payload.posts]
        }
        state.hasMore = action.payload.hasMore
        state.page = action.payload.page
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // createPost
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload)
      })
      // likePost
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId, like, likesCount } = action.payload
        const post = state.posts.find(p => p.id === postId)
        if (post) {
          post.likes = post.likes || []
          post.likes.push(like)
          post._count.likes = likesCount
          post.isLiked = true
        }
        
        if (state.currentPost?.id === postId) {
          state.currentPost.likes = state.currentPost.likes || []
          state.currentPost.likes.push(like)
          state.currentPost._count.likes = likesCount
          state.currentPost.isLiked = true
        }
      })
      // unlikePost
      .addCase(unlikePost.fulfilled, (state, action) => {
        const { postId, likesCount } = action.payload
        const post = state.posts.find(p => p.id === postId)

          if (post && post.likes) {
          
          if (post.likes.length > 0) {
            post.likes = post.likes.slice(0, -1)
          }
          post._count.likes = likesCount
          post.isLiked = false
        }
        
        if (state.currentPost?.id === postId && state.currentPost.likes) {
          if (state.currentPost.likes.length > 0) {
            state.currentPost.likes = state.currentPost.likes.slice(0, -1)
          }
          state.currentPost._count.likes = likesCount
          state.currentPost.isLiked = false
        }
      })
  },
})

export const { 
  clearError, 
  setCurrentPost, 
  addPost, 
  updatePost, 
  deletePost,
  removeLike 
} = postsSlice.actions
export default postsSlice.reducer