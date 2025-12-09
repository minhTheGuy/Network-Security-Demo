'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaAngleLeft } from 'react-icons/fa6'
import { startAuthentication } from '@simplewebauthn/browser'
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types'

const FaceIDLoginPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isSafari, setIsSafari] = useState(false)
  const [isChrome, setIsChrome] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string>('')

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const userAgent = navigator.userAgent
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
        const ios = /iPhone|iPad|iPod/i.test(userAgent)
        const isChromeUA = /CriOS|Chrome/i.test(userAgent)
        const hasSafari = /Safari/i.test(userAgent)
        const safari = ios ? !isChromeUA : hasSafari && !isChromeUA
        
        setIsMobile(mobile)
        setIsIOS(ios)
        setIsSafari(safari)
        setIsChrome(isChromeUA)

        if (typeof window === 'undefined') {
          setIsAvailable(false)
          return
        }

        if (ios && isChromeUA) {
          setIsAvailable(false)
          return
        }

        if (ios && safari) {
          if ('navigator' in window && 'credentials' in navigator) {
            setIsAvailable(true)
          } else {
            setIsAvailable(false)
          }
          return
        }

        if (typeof PublicKeyCredential === 'undefined') {
          setIsAvailable(false)
          return
        }

        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          setIsAvailable(available)
        } catch (err) {
          setIsAvailable(false)
        }
      } catch (err) {
        setIsAvailable(false)
      }
    }

    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token')
        const data = await response.json()
        if (data.token) {
          setCsrfToken(data.token)
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error)
      }
    }

    checkAvailability()
    fetchCsrfToken()
  }, [])

  const requestChallenge = async (): Promise<PublicKeyCredentialRequestOptionsJSON> => {
    if (!csrfToken) {
      throw new Error('CSRF token chưa sẵn sàng')
    }
    const response = await fetch('/api/auth/faceid/login-challenge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ email }),
    })
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data?.error ?? 'Không tạo được challenge')
    }
    const data = await response.json()
    return data.options as PublicKeyCredentialRequestOptionsJSON
  }

  const verifyResponse = async (authenticationResponse: AuthenticationResponseJSON) => {
    if (!csrfToken) {
      throw new Error('CSRF token chưa sẵn sàng')
    }
    const response = await fetch('/api/auth/faceid/login-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ email, credential: authenticationResponse }),
    })
    const data = await response.json()
    if (!response.ok || !data?.success) {
      throw new Error(data?.error ?? 'Đăng nhập thất bại')
    }
    return data
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (typeof window === 'undefined') {
        throw new Error('Window object không tồn tại')
      }
      
      const userAgent = navigator.userAgent
      const ios = /iPhone|iPad|iPod/i.test(userAgent)
      const isChromeUA = /CriOS|Chrome/i.test(userAgent)
      const safari = ios ? !isChromeUA : false
      
      if (!('navigator' in window)) {
        throw new Error('navigator không tồn tại - WebAuthn không được hỗ trợ')
      }
      
      if (!('credentials' in navigator)) {
        if (!(ios && safari)) {
          throw new Error('navigator.credentials không tồn tại - WebAuthn không được hỗ trợ')
        }
      }
      
      const options = await requestChallenge()
      const authenticationResponse = await startAuthentication({ optionsJSON: options })
      await verifyResponse(authenticationResponse)
      
      setIsSubmitting(false)
      window.location.href = '/profile'
    } catch (err) {
      setIsSubmitting(false)
      const loginError = err instanceof Error ? err : new Error('Đăng nhập thất bại')
      
      let errorMessage = loginError.message
      if (loginError.name === 'NotAllowedError') {
        errorMessage = 'Đăng nhập bị từ chối. Vui lòng thử lại và cho phép sử dụng FaceID/TouchID.'
      } else if (loginError.name === 'SecurityError') {
        errorMessage = 'Lỗi bảo mật. Vui lòng đảm bảo bạn đang truy cập qua HTTPS hoặc localhost.'
      } else if (loginError.name === 'NotSupportedError') {
        errorMessage = 'Thiết bị không hỗ trợ FaceID/TouchID.'
      }
      
      setError(errorMessage)
    }
  }

  if (isAvailable === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <p className="text-xl">Đang kiểm tra khả năng WebAuthn...</p>
      </div>
    )
  }

  if (isAvailable === false) {
    if (isIOS && isChrome) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 text-center">
          <h1 className="py-10 mb-6 text-4xl font-semibold text-red-500">
            Chrome trên iOS không hỗ trợ FaceID/TouchID
          </h1>
          <p className="mb-6 text-gray-300 w-[360px]">
            Vui lòng sử dụng Safari trên iOS để đăng nhập bằng FaceID/TouchID.
          </p>
          <Link href="/">
            <p className="opacity-50">
              <FaAngleLeft className="inline mr-1" /> Quay Về Trang Chủ
            </p>
          </Link>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2 text-center">
        <h1 className="py-10 mb-6 text-4xl font-semibold text-red-500">
          Thiết bị không hỗ trợ FaceID/TouchID
        </h1>
        <p className="mb-6 text-gray-300 w-[360px]">
          Trình duyệt hoặc thiết bị của bạn không hỗ trợ WebAuthn với Platform Authenticator.
        </p>
        <Link href="/">
          <p className="opacity-50">
            <FaAngleLeft className="inline mr-1" /> Quay Về Trang Chủ
          </p>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="py-10 mb-10 text-5xl">
        {isSubmitting ? 'Đang xử lý...' : 'Đăng Nhập FaceID/TouchID'}
      </h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-sm w-full">
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-[350px] text-slate-800 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-600"
          required
        />
        <button
          type="submit"
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-600 uppercase px-40 py-3 mt-10 font-bold disabled:opacity-50"
          disabled={isSubmitting || email.length === 0}>
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập FaceID/TouchID'}
        </button>
        {error ? <p className="text-sm text-red-500 text-center w-[350px]">{error}</p> : null}
      </form>

      <Link href="/sign-up">
        <p className="mt-10">
          Chưa có tài khoản?{' '}
          <span className="font-bold text-white ml-2 cursor-pointer hover:underline">
            Đăng ký ngay
          </span>
        </p>
      </Link>

      <Link href="/">
        <p className="mt-8 opacity-50">
          <FaAngleLeft className="inline mr-1" /> Quay Về Trang Chủ
        </p>
      </Link>
    </div>
  )
}

export default FaceIDLoginPage
