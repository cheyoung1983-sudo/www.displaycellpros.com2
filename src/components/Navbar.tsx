"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Wrench, Cpu, User, LogOut } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

export function Navbar({ onBookClick }: { onBookClick: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'B2B Fleet', href: '/b2b' },
    { name: 'Store', href: '/store' },
    { name: 'Privacy & Consent', href: '/privacy' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Wrench className="h-8 w-8 text-blue-500 mr-2" />
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-white leading-none">DISPLAY & CELL PROS</span>
                <span className="text-[10px] font-bold text-blue-400 tracking-[0.2em] uppercase mt-0.5 font-mono">Mobile Technical Lab</span>
              </div>
            </Link>
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    pathname === item.href
                      ? "text-blue-400 bg-blue-500/5"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/lab"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border font-mono ${
                pathname === '/lab'
                  ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                  : "bg-slate-950 text-blue-400 border-slate-800 hover:border-blue-500/40 hover:bg-slate-900"
              }`}
            >
              <Cpu size={14} /> Lab Portal
            </Link>

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-white leading-none">{user.name}</span>
                  <Link href="/auth/logout" className="text-[9px] font-bold text-slate-500 hover:text-red-400 uppercase tracking-widest mt-1">Logout</Link>
                </div>
                <div className="w-9 h-9 rounded-full border border-slate-700 p-0.5 bg-slate-800">
                  <img src={user.picture || ''} alt="Profile" className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
                </div>
              </div>
            ) : (
              <a
                href="/auth/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all"
              >
                <User size={14} /> Sign In
              </a>
            )}

            <button
              onClick={onBookClick}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 active:scale-95 ml-2"
            >
              Book Mission
            </button>
          </div>
          <div className="flex items-center md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-b border-slate-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-3 rounded-md text-base font-bold ${
                  pathname === item.href ? "text-blue-400 bg-slate-900" : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/lab"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 block px-3 py-3 rounded-md text-base font-bold text-blue-400 bg-slate-900 border border-slate-755 mb-2"
            >
              <Cpu size={18} /> Diagnostics Lab Portal (Beta)
            </Link>

            {user ? (
               <a
                href="/auth/logout"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left flex items-center gap-2 block px-3 py-3 rounded-md text-base font-medium text-red-400 bg-slate-900 border border-red-900/30 mb-2"
              >
                <LogOut size={18} /> Sign Out ({user.name})
              </a>
            ) : (
              <a
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left flex items-center gap-2 block px-3 py-3 rounded-md text-base font-medium text-white bg-slate-700 border border-slate-600 mb-2"
              >
                <User size={18} /> Sign In
              </a>
            )}

            <button
              onClick={() => { onBookClick(); setMobileMenuOpen(false); }}
              className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-white bg-blue-600"
            >
              Book Repair / Get Quote
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
