'use client'

import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { fetchPosts } from '@/store/slices/postsSlice'
import { PostCard } from '@/components/posts/postCard'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Settings, Edit, Calendar, Users, Image as ImageIcon } from 'lucide-react'

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { posts, isLoading } = useAppSelector((state) => state.posts)
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts')

  const userPosts = posts.filter(post => post.authorId === user?.id)

  useEffect(() => {
    dispatch(fetchPosts({ page: 1, limit: 20 }))
  }, [dispatch])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <Avatar 
                src={user.avatar} 
                alt={user.name}
                size="xl"
                className="border-4 border-white shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600">@{user.username}</p>
                {user.bio && (
                  <p className="text-gray-700 mt-2 max-w-md">{user.bio}</p>
                )}
                
                <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>
                        <strong>{user._count?.followers || 0}</strong> followers
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>
                        <strong>{user._count?.following || 0}</strong> following
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{userPosts.length}</div>
            <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{user._count?.followers || 0}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{user._count?.following || 0}</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-8 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center space-x-2 pb-4 px-1 border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span className="font-medium">Posts</span>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
              {userPosts.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('likes')}
            className={`flex items-center space-x-2 pb-4 px-1 border-b-2 transition-colors ${
              activeTab === 'likes'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="font-medium">Likes</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading posts...</p>
              </div>
            ) : userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600">When you share photos, they will appear here.</p>
                <Button className="mt-4">
                  Create Your First Post
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'likes' && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No likes yet</h3>
            <p className="text-gray-600">Posts you like will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}