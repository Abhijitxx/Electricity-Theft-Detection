'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LoadingAnimation from '@/components/LoadingAnimation';
import { useSystem } from '@/context/SystemContext';
import { 
  Zap,
  LayoutDashboard, 
  Users, 
  BarChart3, 
  FileText,
  Upload,
  Menu,
  X,
  FlaskConical,
  Cog
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Consumers', href: '/consumers', icon: Users },
  { name: 'Models', href: '/models', icon: BarChart3 },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Generate', href: '/generate', icon: FlaskConical },
  { name: 'Resources', href: '/resources', icon: FileText },
  { name: 'Working', href: '/working', icon: Cog },
];

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isSystemOnline } = useSystem();

  // Removed scroll effect - navbar stays visible

  return (
    <>
      <LoadingAnimation />
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header with Navbar */}
        <header className="sticky top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 shadow-lg">

          <div className="container mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Logo and App Name */}
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg"></div>
                  {/* Icon */}
                  <div className="relative bg-blue-600 rounded-full p-2 shadow-xl shadow-blue-500/50">
                    <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400">
                      Ampere.ai
                    </span>
                  </h1>
                  <p className="text-blue-300 text-[9px] font-medium tracking-wider hidden sm:block">
                    INTELLIGENT THEFT DETECTION
                  </p>
                </div>
              </Link>

              {/* Center: Navigation Menu (Desktop) */}
              <nav className="hidden lg:flex items-center gap-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' 
                          : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                        }
                      `}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Right: Status indicator and Mobile Menu Button */}
              <div className="flex items-center gap-3">
                {/* Status indicator (Desktop) */}
                <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                  isSystemOnline 
                    ? 'bg-green-800/30 border-green-500/30' 
                    : 'bg-gray-800/30 border-gray-500/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isSystemOnline 
                      ? 'bg-green-400 animate-pulse' 
                      : 'bg-gray-400'
                  }`}></div>
                  <span className={`text-xs font-medium ${
                    isSystemOnline 
                      ? 'text-green-200' 
                      : 'text-gray-400'
                  }`}>
                    {isSystemOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg bg-blue-800/50 text-white hover:bg-blue-700 transition-colors"
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
              <nav className="lg:hidden mt-4 pb-4 border-t border-blue-700/50 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'bg-blue-800/30 text-blue-200 hover:bg-blue-800/50 hover:text-white'
                          }
                        `}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            )}
          </div>
          
          {/* Bottom border with gradient */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
