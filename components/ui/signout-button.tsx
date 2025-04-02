'use client'

import { useClerk } from '@clerk/nextjs'
import { FiLogOut } from 'react-icons/fi'

export const SignOutButton = () => {
  const { signOut } = useClerk()

  return (
    // Clicking this button signs out a user
    // and redirects them to the home page "/".
    <button onClick={() => signOut({ redirectUrl: '/' })} className="flex items-center">
      <FiLogOut className="mr-2" />
      サインアウト
    </button>
  )
}