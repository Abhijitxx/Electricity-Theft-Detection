'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  FileText,
  Zap,
  Upload,
  Menu,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Consumer Analysis', href: '/consumers', icon: Users },
  { name: 'Model Performance', href: '/models', icon: BarChart3 },
  { name: 'Upload & Predict', href: '/upload', icon: Upload },
  { name: 'Resources', href: '/settings', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        flex flex-col bg-gray-900 
        fixed lg:static inset-y-0 left-0 z-40
        w-64 lg:w-64
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
          <Zap className="h-8 w-8 text-primary-500" />
          <span className="ml-2 text-white font-bold text-lg">Theft Detection</span>
        </div>
      
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
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
    </>
  );
}
