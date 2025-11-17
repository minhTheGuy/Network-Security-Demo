'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const LogoutButton = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error((await response.json()).error ?? 'Đăng xuất thất bại')
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      const logoutError = err instanceof Error ? err : new Error('Đăng xuất thất bại')
      setError(logoutError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-60"
        disabled={loading}
      >
        {loading ? 'Đang đăng xuất...' : 'Đăng xuất'}
      </button>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  )
}

export default LogoutButton

