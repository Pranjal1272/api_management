import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Key, 
  TestTube, 
  FileText, 
  Home, 
  Users,
  Activity,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/api-keys', icon: Key, label: 'API Keys' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/testing', icon: TestTube, label: 'API Testing' },
    { to: '/configs', icon: Settings, label: 'API Configs' },
    { to: '/logs', icon: FileText, label: 'API Logs' },
    { to: '/activity', icon: Activity, label: 'Activity' }
  ];
  console.log(user)
  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', icon: Users, label: 'Admin Panel' });
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            API Hub
          </span>
        </div>
      </div>
      
      <nav className="px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
              ${isActive 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;