'use client'
import { useAuth } from '../context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import Navbar from './Navbar'

export default function ConditionalNavbar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  
  // Hide navbar for admin users or on admin pages
  const isAdminUser = user && (user.role === 'admin' || user.role_name === 'admin')
  const isAdminPage = pathname?.startsWith('/admin')
  
  // Hide navbar for storefront pages
  const isStorefrontPage = pathname?.startsWith('/storefront')
  
  // Don't show navbar if user is admin, on admin pages, or on storefront pages
  if (isAdminUser || isAdminPage || isStorefrontPage) {
    if (isAdminUser && !isAdminPage){
      console.log("NNot ann admin page: ", isAdminPage)
      router.push("/admin/login")
    }
    return null
  }
  
  return <Navbar />
}