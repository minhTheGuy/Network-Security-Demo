'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaAngleLeft, FaLock, FaUser, FaEnvelope, FaShieldHalved } from 'react-icons/fa6'
import { startRegistration } from '@simplewebauthn/browser'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types'

const FaceIDRegisterPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
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

  const requestChallenge = async (): Promise<PublicKeyCredentialCreationOptionsJSON> => {
    if (!csrfToken) {
      throw new Error('CSRF token chưa sẵn sàng')
    }
    const response = await fetch('/api/auth/faceid/register-challenge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ email, username }),
    })
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data?.error ?? 'Không tạo được challenge')
    }
    const data = await response.json()
    return data.options as PublicKeyCredentialCreationOptionsJSON
  }

  const verifyResponse = async (registrationResponse: RegistrationResponseJSON) => {
    if (!csrfToken) {
      throw new Error('CSRF token chưa sẵn sàng')
    }
    const response = await fetch('/api/auth/faceid/register-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ email, username, credential: registrationResponse }),
    })
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data?.error ?? 'Xác minh đăng ký thất bại')
    }
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
      const registrationResponse = await startRegistration({ optionsJSON: options })
      await verifyResponse(registrationResponse)
      
      router.push('/profile')
    } catch (err) {
      const registerError = err instanceof Error ? err : new Error('Đăng ký thất bại')
      
      let errorMessage = registerError.message
      if (registerError.name === 'NotAllowedError') {
        errorMessage = 'Đăng ký bị từ chối. Vui lòng thử lại và cho phép sử dụng FaceID/TouchID.'
      } else if (registerError.name === 'SecurityError') {
        errorMessage = 'Lỗi bảo mật. Vui lòng đảm bảo bạn đang truy cập qua HTTPS hoặc localhost.'
      } else if (registerError.name === 'NotSupportedError') {
        errorMessage = 'Thiết bị không hỗ trợ FaceID/TouchID.'
      }
      
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAvailable === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Đang kiểm tra khả năng FaceID/TouchID...</p>
        </div>
      </div>
    )
  }

  if (isAvailable === false) {
    if (isIOS && isChrome) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Chrome trên iOS không hỗ trợ FaceID/TouchID</h1>
            <p className="text-gray-600 mb-6">
              Vui lòng sử dụng Safari trên iOS để đăng ký bằng FaceID/TouchID.
            </p>
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
              <FaAngleLeft className="mr-2" /> Quay Về Trang Chủ
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thiết bị không hỗ trợ FaceID/TouchID</h1>
          <p className="text-gray-600 mb-6">
            Trình duyệt hoặc thiết bị của bạn không hỗ trợ WebAuthn với Platform Authenticator.
          </p>
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
            <FaAngleLeft className="mr-2" /> Quay Về Trang Chủ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <FaShieldHalved className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tạo Tài Khoản</h1>
          <p className="text-gray-600">Đăng ký với FaceID/TouchID để bảo mật tối đa</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Tên Người Dùng <span className="text-gray-400">(tùy chọn)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Nhập tên của bạn"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your.email@example.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || email.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <FaShieldHalved className="w-5 h-5" />
                  <span>Đăng ký với FaceID/TouchID</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Đã có tài khoản?{' '}
            <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
          <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm">
            <FaAngleLeft className="mr-1" /> Quay Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  )
}

export default FaceIDRegisterPage
