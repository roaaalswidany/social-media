'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { loginUser, clearError } from '@/store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((state) => state.auth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      dispatch(clearError())
      return
    }
    
    try {
      await dispatch(loginUser({ email, password })).unwrap()
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const handleInputChange = () => {
    if (error) {
      dispatch(clearError())
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            handleInputChange()
          }}
          required
          placeholder="Enter your email"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            handleInputChange()
          }}
          required
          placeholder="Enter your password"
        />
      </div>

      <Button type="submit" className="w-full" loading={isLoading}>
        Sign in
      </Button>

      <div className="text-center">
        <span className="text-sm text-gray-600">
          Don not have an account?
          <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
            Sign up
          </Link>
        </span>
      </div>
    </form>
  )
}