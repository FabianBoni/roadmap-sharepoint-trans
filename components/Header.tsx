import React, { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaTimes, FaHome, FaInfoCircle, FaUserShield } from 'react-icons/fa';

interface HeaderNavigationProps {
    currentPage?: 'roadmap' | 'admin' | 'doc';
}

const Header: React.FC<HeaderNavigationProps> = ({ currentPage = 'roadmap' }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="bg-gray-800 shadow-md fixed top-0 left-0 right-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/">
                            <span className="flex-shrink-0 flex items-center cursor-pointer">
                                <span className="text-xl font-bold text-white">IT + Digital Roadmap</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        <Link href="/">
                            <span className={`${currentPage === 'roadmap' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center`}>
                                <FaHome className="mr-1" /> Roadmap
                            </span>
                        </Link>
                        <Link href="/docs/pages/">
                            <span className={`${currentPage === 'doc' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center`}>
                                <FaInfoCircle className="mr-1" /> Dokumentation
                            </span>
                        </Link>
                        <Link href="/admin">
                            <span className={`${currentPage === 'admin' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center`}>
                                <FaUserShield className="mr-1" /> Admin
                            </span>
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        >
                            <span className="sr-only">Open main menu</span>
                            {mobileMenuOpen ? <FaTimes className="block h-6 w-6" /> : <FaBars className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state */}
            {mobileMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link href="/">
                            <span className={`${currentPage === 'roadmap' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center`}>
                                <FaHome className="mr-2" /> Home
                            </span>
                        </Link>
                        <Link href="/docs/pages/">
                            <span className={`${currentPage === 'doc' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center`}>
                                <FaInfoCircle className="mr-2" /> About
                            </span>
                        </Link>
                        <Link href="/admin">
                            <span className={`${currentPage === 'admin' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center`}>
                                <FaUserShield className="mr-2" /> Admin
                            </span>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Header;