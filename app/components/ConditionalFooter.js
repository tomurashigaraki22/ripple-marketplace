'use client'
import { useAuth } from '../context/AuthContext'
import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function ConditionalFooter() {
  const { user } = useAuth()
  const pathname = usePathname()
  
  // Hide footer for admin users or on admin pages
  const isAdminUser = user && (user.role === 'admin' || user.role_name === 'admin')
  const isAdminPage = pathname?.startsWith('/admin')
  
  // Hide footer for storefront pages
  const isStorefrontPage = pathname?.startsWith('/storefront')
  
  // Don't show footer if user is admin, on admin pages, or on storefront pages
  if (isAdminUser || isAdminPage || isStorefrontPage) {
    return null
  }
  
  return <Footer />
}