import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, LineChart, History, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getDisplayableImageUrl } from '../utils/imageUtils';
import Footer from '../components/Footer';
import DepartmentCelebrationTicker from '../pages/admin/components/DepartmentCelebrationTicker';

const AdminLayout = () => {
  const { user, logout, updateProfileImage } = useAuth();
  const location = useLocation();
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const basePrefix = (user?.role === 'admin' || user?.role === 'superadmin') ? '/admin' : '/user';

  const navItems = [
    { to: `${basePrefix}/dashboard`, label: 'Dashboard', icon: LayoutDashboard, match: ['/admin/dashboard', '/user/dashboard'] },
    { to: `${basePrefix}/department`, label: 'Department', icon: Building2, match: ['/admin/department', '/user/department'] },
    { to: `${basePrefix}/history-commitment`, label: 'Weekly Report Record', icon: History, match: ['/admin/history-commitment', '/user/history-commitment'] },
    { to: `${basePrefix}/kpi-kra`, label: 'KPI & KRA', icon: LineChart, match: ['/admin/kpi-kra', '/user/kpi-kra'] },
  ];

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file");
        return;
      }

      setIsUpdating(true);
      setError(null);
      const result = await updateProfileImage(file);
      setIsUpdating(false);

      if (result.success) {
        setProfilePopupOpen(false);
      } else {
        setError(result.error || "Failed to update image");
      }
    }
  };

  const isActive = (matches) => matches.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30 h-16 sm:h-18 shadow-sm">
        <div className="px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between max-w-full gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-shrink-0">
            <Link to={`${basePrefix}/dashboard`} className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img src="/logo.png" alt="Logo" className="h-9 w-9 sm:h-11 sm:w-11 object-contain flex-shrink-0" />
              <span className={`text-xs sm:text-sm text-white px-2 sm:px-3 py-1 rounded whitespace-nowrap uppercase font-semibold ${
                user?.role === 'superadmin' ? 'bg-purple-600' : (user?.role === 'admin' ? 'bg-indigo-600' : 'bg-green-600')
                }`}>
                {user?.role || 'USER'}
              </span>
            </Link>
          </div>

          {/* Top Performers Reel Ticker */}
          <div className="hidden md:flex flex-1 max-w-md lg:max-w-xl xl:max-w-3xl 2xl:max-w-4xl mx-2 min-w-0 justify-center">
            <DepartmentCelebrationTicker />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink-0">
            {user && (
              <div className="relative">
                <div
                  className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setProfilePopupOpen(!profilePopupOpen)}
                >
                  <img
                    src={getDisplayableImageUrl(user.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`}
                    alt={user.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                  />
                  <span className="text-sm sm:text-base font-medium text-gray-700 hidden md:inline-block truncate max-w-32 lg:max-w-none">
                    {user.name}
                  </span>
                </div>

                {/* Profile Popup */}
                {profilePopupOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfilePopupOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
                      <div className="p-5">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative group">
                            <img
                              src={getDisplayableImageUrl(user.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`}
                              alt={user.name}
                              className="w-20 h-20 rounded-full object-cover border-4 border-indigo-50"
                            />
                            {isUpdating && (
                              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                              </div>
                            )}
                          </div>
                          <h3 className="mt-3 font-bold text-gray-800 text-lg">{user.name}</h3>
                          <p className="text-sm text-gray-500">{user.designation || user.role}</p>
                          <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                        </div>

                        <div className="mt-6 space-y-3">
                          <label className="block">
                            <span className="sr-only">Choose profile photo</span>
                            <div className={`w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${isUpdating
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95'
                              }`}>
                              {isUpdating ? 'Updating...' : 'Change Image'}
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageChange}
                              disabled={isUpdating}
                            />
                          </label>

                          {error && (
                            <p className="text-xs text-red-500 text-center font-medium animate-pulse">{error}</p>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 border-t border-gray-100">
                        <button
                          onClick={logout}
                          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="hidden sm:block h-6 w-px bg-gray-200 mx-1"></div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 transition-colors"
            >
              <LogOut size={16} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline-block text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="bg-white border-b border-gray-200 fixed top-16 left-0 right-0 z-20 h-12 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 h-full flex items-center gap-1 sm:gap-2 overflow-x-auto mobile-scroll">
          {navItems.map(({ to, label, icon: Icon, match }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-3 sm:px-4 h-full whitespace-nowrap border-b-2 text-sm sm:text-base font-medium transition-colors duration-200 ${isActive(match)
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
            >
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 pt-28 pb-10 sm:pb-12 overflow-y-auto overflow-x-hidden mobile-scroll">
        <div className="p-4 sm:p-6 lg:p-8 max-w-full min-h-full">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminLayout;