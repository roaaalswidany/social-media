'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { likePost, unlikePost } from '@/store/slices/postsSlice'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Post } from '@/store/slices/postsSlice'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [isLiking, setIsLiking] = useState(false)

  const isLiked = post.likes?.some((like) => like.userId === user?.id) || false
  const likeCount = post._count?.likes || 0

 const handleLike = async () => {
  if (!user) return

  setIsLiking(true)
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const url = `/api/posts/like?postId=${post.id}`
    
    if (isLiked) {
      await dispatch(unlikePost(post.id)).unwrap()
    } else {
      await dispatch(likePost(post.id)).unwrap()
    }
  } catch (error) {
    console.error('Error liking post:', error)
  } finally {
    setIsLiking(false)
  }
}

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${post.author.id}`}>
            <Avatar 
              src={post.author.avatar} 
              alt={post.author.name}
              size="md"
            />
          </Link>
          <div>
            <Link 
              href={`/profile/${post.author.id}`}
              className="font-semibold text-gray-900 hover:text-primary-600 transition-colors block"
            >
              {post.author.name}
            </Link>
            <p className="text-sm text-gray-500">@{post.author.username}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
          {user?.id === post.author.id && (
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-gray-800 mb-4 whitespace-pre-wrap">
        {post.caption}
      </p>

      {post.image && (
        <div className="relative aspect-square mb-4 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={post.image}
            alt="Post image"
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking || !user}
            className={`flex items-center space-x-2 ${
              isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
          >
            <Link href={`/posts/${post.id}`} className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>{post._count?.comments || 0}</span>
            </Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          <Share className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}