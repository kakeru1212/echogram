'use client';

import { FiLogOut } from 'react-icons/fi';

export const SignOutButton = () => {
  const base = 'https://master.dww3cxr5fnjzb.amplifyapp.com';
  return (
    <button
      onClick={() =>
        window.location.href =
          `/api/auth/logout?federated&returnTo=${encodeURIComponent(base)}`
      }
      className="flex items-center"
    >
      <FiLogOut className="mr-2" />
      サインアウト
    </button>
  );
};
