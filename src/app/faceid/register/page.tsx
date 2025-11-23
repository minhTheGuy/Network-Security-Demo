'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaAngleLeft } from 'react-icons/fa6'
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

    checkAvailability()
  }, [])

  const requestChallenge = async (): Promise<PublicKeyCredentialCreationOptionsJSON> => {
    const response = await fetch('/api/auth/faceid/register-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch('/api/auth/faceid/register-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      
      router.push('/sign-in')
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
            Vui lòng sử dụng Safari trên iOS để đăng ký bằng FaceID/TouchID.
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
        {isSubmitting ? 'Đang xử lý...' : 'Đăng Ký FaceID/TouchID'}
      </h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-sm w-full">
        <input
          type="text"
          id="username"
          name="username"
          placeholder="Tên hiển thị (tuỳ chọn)"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="w-[350px] text-slate-800 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-600"
        />
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
          {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký FaceID/TouchID'}
        </button>
        {error ? <p className="text-sm text-red-500 text-center w-[350px]">{error}</p> : null}
      </form>

      <Link href="/sign-in">
        <p className="mt-10">
          Đã có tài khoản?{' '}
          <span className="font-bold text-white ml-2 cursor-pointer hover:underline">
            Đăng nhập ngay
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

export default FaceIDRegisterPage
