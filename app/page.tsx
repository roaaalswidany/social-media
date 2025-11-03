'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { fetchPosts, fetchFeed } from '@/store/slices/postsSlice'
import { getCurrentUser } from '@/store/slices/authSlice'
import { CreatePost } from '@/components/posts/createPost'
import { PostCard } from '@/components/posts/postCard'
import { Button } from '@/components/ui/button'
import { Loader, Users, Globe } from 'lucide-react'

export default function HomePage() {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const { posts, isLoading } = useAppSelector((state) => state.posts)
  const [activeTab, setActiveTab] = useState<'all' | 'feed'>('all')

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getCurrentUser())
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'feed') {
      dispatch(fetchFeed(1))
    } else {
      dispatch(fetchPosts(1))
    }
  }, [dispatch, isAuthenticated, activeTab])

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {isAuthenticated && (
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600">
            Share your ideas and connect with others
          </p>
        </div>
      )}

      {isAuthenticated && <CreatePost />}

      {isAuthenticated && (
        <div className="flex space-x-2 mb-6 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <Button
            variant={activeTab === 'all' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('all')}
            className="flex-1 flex items-center space-x-2 justify-center"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden xs:inline">All Posts</span>
          </Button>
          
          <Button
            variant={activeTab === 'feed' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('feed')}
            className="flex-1 flex items-center space-x-2 justify-center"
          >
            <Users className="w-4 h-4" />
            <span className="hidden xs:inline">My Feed</span>
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600 mb-4">
              {isAuthenticated 
                ? 'Be the first to share something!'
                : 'Sign in to see posts and share your thoughts'
              }
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild>
                  <Link href="/register">Create Account</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  )
}