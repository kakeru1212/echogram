'use client'

import { FiLogOut } from 'react-icons/fi'

export const SignOutButton = () => {

  return (
    <button onClick={() => window.location.href = '/api/auth/logout'} className="flex items-center">
      <FiLogOut className="mr-2" />
      サインアウト
    </button>
  )
}