import { useState } from "react";

const ProfileModal = () => {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button 
        onClick={() => setShowProfile(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        プロフィールを開く
      </button>

      {/* モーダル表示 */}
      {showProfile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <button 
              onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileModal;
