'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings,
  Zap,
  Upload
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Consumer Analysis', href: '/consumers', icon: Users },
  { name: 'Model Performance', href: '/models', icon: BarChart3 },
  { name: 'Upload & Predict', href: '/upload', icon: Upload },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-gray-900">
      <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
        <Zap className="h-8 w-8 text-primary-500" />
        <span className="ml-2 text-white font-bold text-lg">Theft Detection</span>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 bg-gray-800">
        <div className="text-xs text-gray-400">
          <p className="font-medium">System Status</p>
          <div className="flex items-center mt-2">
            <div className="h-2 w-2 bg-success-500 rounded-full mr-2"></div>
            <span>All models operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
