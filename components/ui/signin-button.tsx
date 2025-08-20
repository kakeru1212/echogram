'use client';

import { FiLogIn } from 'react-icons/fi';

export const SignInButton = () => {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <button
      onClick={() =>
        window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(base)}`
      }
      className="flex items-center"
    >
      <FiLogIn className="mr-2" />
      サインイン
    </button>
  );
};


