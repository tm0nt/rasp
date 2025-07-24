import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { setCookie } from 'cookies-next'
import { useRouter } from 'next/navigation'

export function useReferral() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const referralCode = searchParams.get('code')
    if (referralCode) {
      // Armazenar no cookie por 30 dias
      setCookie('referral_code', referralCode, { maxAge: 60 * 60 * 24 * 30 })
      
      // Redirecionar sem o parâmetro code na URL
      router.replace('/', { scroll: false })
    }
  }, [searchParams, router])
}