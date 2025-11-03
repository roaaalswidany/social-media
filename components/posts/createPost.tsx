/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { createPost } from '@/store/slices/postsSlice'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'



export function CreatePost() {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { isLoading } = useAppSelector((state) => state.posts)
  
  const [caption, setCaption] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file only')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
      setIsExpanded(true)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!caption.trim() && !image) return

    try {
      await dispatch(createPost({ caption, image })).unwrap()
      
      setCaption('')
      removeImage()
      setIsExpanded(false)
      
      // Refresh page to update posts
      window.location.reload()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Error creating post')
    }
  }

  const handleFocus = () => {
    setIsExpanded(true)
  }

  const handleCancel = () => {
    setCaption('')
    removeImage()
    setIsExpanded(false)
  }

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 transition-all duration-300",
      isExpanded ? "ring-2 ring-primary-100" : "hover:shadow-md"
    )}>
      <form onSubmit={handleSubmit}>
        <div className="flex space-x-4">
          <Avatar src={user?.avatar} alt={user?.name} className="shrink-0" />
          
          <div className="flex-1 space-y-4">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onFocus={handleFocus}
              placeholder="What's happening?"
              className="w-full px-3 py-2 border-0 focus:ring-0 resize-none text-lg placeholder:text-gray-400 min-h-[60px] focus:min-h-[120px] transition-all duration-300"
              rows={isExpanded ? 4 : 2}
            />

            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={imagePreview}
                    alt="Image preview"
                    className="object-cover w-full h-full"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white backdrop-blur-sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-500 hover:text-primary-600"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
              </div>

              {isExpanded && (
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading || (!caption.trim() && !image)}
                    loading={isLoading}
                  >
                    {isLoading ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}