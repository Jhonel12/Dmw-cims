import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAlertDialog } from '../../contexts/AlertDialogContext';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, collapsed, onToggleCollapse, onLogout }) => {
  const { showDanger } = useAlertDialog();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    const confirmed = await showDanger({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout? Any unsaved changes will be lost.',
      confirmText: 'Logout',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      if (onLogout) {
        onLogout();
      } else {
        console.log('Sidebar: Calling logout...');
        await logout();
        console.log('Sidebar: Logout completed, redirecting...');
        // Use React Router navigation instead of window.location
        window.location.href = '/login';
      }
    }
  };

  const menuSections = [
    {
      title: 'Main',
      items: [
        { 
          path: '/', 
          label: 'Dashboard', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          description: 'Overview & Analytics'
        }
      ]
    },
    {
      title: 'OFW Management',
      items: [
        { 
          path: '/ofw-list', 
          label: 'OFW Records', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          ),
          description: 'Manage OFW Records'
        },
        { 
          path: '/add-ofw', 
          label: 'Add New OFW', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          description: 'Create New OFW Record'
        },
        { 
          path: '/reports', 
          label: 'OFW Reports', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          description: 'Generate OFW Reports'
        }
      ]
    },
    {
      title: 'Client Management',
      items: [
        { 
          path: '/client-profile', 
          label: 'Client Profiles', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          description: 'Manage Client Profiles'
        },
        { 
          path: '/add-client', 
          label: 'Add New Client', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          ),
          description: 'Create New Client Profile'
        },
        { 
          path: '/client-reports', 
          label: 'Client Reports', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          description: 'Generate Client Reports'
        }
      ]
    },
    {
      title: 'System',
      items: [
        { 
          path: '/settings', 
          label: 'Settings', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          description: 'System Settings'
        }
      ]
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white/95 backdrop-blur-xl shadow-strong transform transition-all duration-300 ease-out z-50 border-r border-gray-200/60
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:fixed lg:z-auto lg:shadow-none
        ${collapsed ? 'w-20' : 'w-64 sm:w-72 lg:w-80'}
      `}>
        {/* Sidebar Header */}
        <div className={`border-b border-gray-200/60 ${collapsed ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={onToggleCollapse}
                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {!collapsed && (
                <div>
                  <h2 className="text-xs font-bold text-gray-900">Navigation</h2>
                  <p className="text-xs text-gray-500">Quick access</p>
                </div>
              )}
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 lg:block hidden"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`space-y-4 ${collapsed ? 'p-3' : 'p-4'}`}>
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title}>
              {/* Section Header */}
              {!collapsed && (
                <div className="mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <div className="mt-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
                </div>
              )}
              
              {/* Section Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-2 py-2 rounded-lg transition-all duration-200 group ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      } ${collapsed ? 'justify-center px-1' : ''}`
                    }
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`flex items-center justify-center ${
                          isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                        } ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`}>
                          {item.icon}
                        </div>
                        <div className={`flex-1 min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
                          <div className={`font-medium text-xs ${
                            isActive ? 'text-blue-700' : 'text-gray-900'
                          }`}>{item.label}</div>
                          <div className={`text-xs truncate ${
                            isActive ? 'text-blue-500' : 'text-gray-500'
                          }`}>{item.description}</div>
                        </div>
                        <div className={`${collapsed ? 'lg:hidden' : ''}`}>
                          {item.path === '/add-ofw' && (
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          )}
                          {item.path === '/add-client' && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          )}
                          {item.path === '/client-reports' && (
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                          )}
                          {item.path === '/settings' && (
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                        {collapsed && (
                          <div className="hidden lg:block">
                            {item.path === '/add-ofw' && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            )}
                            {item.path === '/add-client' && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            )}
                            {item.path === '/client-reports' && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                            )}
                            {item.path === '/settings' && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-gray-400 rounded-full"></div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className={`absolute bottom-0 left-0 right-0 border-t border-gray-200/60 bg-gray-50/50 ${collapsed ? 'p-3' : 'p-4'}`}>
          {/* User Info */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className={`flex-1 min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="text-xs font-semibold text-gray-900">{user?.name || 'Admin User'}</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
            <div className={`${collapsed ? 'lg:hidden' : ''}`}>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            {collapsed && (
              <div className="hidden lg:block">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
            )}
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group ${
              collapsed ? 'justify-center px-1' : ''
            }`}
            title={collapsed ? 'Logout' : undefined}
          >
            <div className="flex items-center justify-center w-4 h-4 text-red-500 group-hover:text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            {!collapsed && (
              <span className="text-xs font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
