import React, { ReactNode } from 'react';

interface HeaderProps {
  pageTitle: string;
  actions?: ReactNode;
}

const Header = ({ pageTitle, actions }: HeaderProps) => {
  return (
    <header className="border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-6">
          {actions}
        </div>
      </div>
    </header>
  );
};

export default Header;