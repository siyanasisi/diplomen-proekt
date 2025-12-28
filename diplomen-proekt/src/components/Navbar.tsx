import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { to: "/", label: "Начало" },
        { to: "/matura-bel", label: "Матура БЕЛ" },
        { to: "/matura-math", label: "Матура Математика" },
        { to: "/find-tutor", label: "Намери преподавател" },
        { to: "/make-plan", label: "Направи ми план" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-rose-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link 
                        to={"/"} 
                        className="group flex items-center space-x-2 flex-shrink-0"
                    >
                        <span className="text-3xl font-extrabold bg-gradient-to-r from-rose-900 via-rose-700 to-rose-900 bg-clip-text text-transparent group-hover:from-rose-700 group-hover:to-rose-900 transition-all duration-300">
                            Матура
                        </span>
                        <span className="text-3xl font-extrabold text-rose-600 group-hover:text-rose-700 group-hover:scale-110 transition-transform duration-300 inline-block">
                            +
                        </span>
                    </Link>

                    {/* desktop nav*/}
                    <div className="hidden md:flex md:items-center md:flex-1 md:justify-center md:mx-4 lg:mx-8">
                        <div className="flex items-center gap-6 lg:gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    aria-current={isActive(link.to) ? 'page' : undefined}
                                    className={`px-5 lg:px-6 py-3 text-lg font-semibold rounded-full transition-transform duration-200 transform shadow-sm whitespace-nowrap flex items-center justify-center ${
                                        isActive(link.to)
                                            ? 'bg-rose-50 text-rose-900 ring-1 ring-rose-100 scale-105'
                                            : 'text-gray-700 hover:text-rose-900 hover:bg-rose-50/40 hover:scale-105'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

  
                    <div className="hidden md:flex md:items-center md:space-x-4 flex-shrink-0 md:min-w-[120px] lg:min-w-[160px]">

                    </div>

                    {/* mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setMenuOpen((prev) => !prev)}
                            className="relative inline-flex items-center justify-center p-3 rounded-xl text-gray-700 hover:text-rose-900 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all duration-300 active:scale-95"
                            aria-label="Toggle menu"
                            aria-expanded={menuOpen}
                        >
                            <div className="relative w-6 h-6">
                                <span
                                    className={`absolute top-0 left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ${
                                        menuOpen ? "rotate-45 translate-y-2.5" : ""
                                    }`}
                                ></span>
                                <span
                                    className={`absolute top-2.5 left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ${
                                        menuOpen ? "opacity-0" : ""
                                    }`}
                                ></span>
                                <span
                                    className={`absolute top-5 left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ${
                                        menuOpen ? "-rotate-45 -translate-y-2.5" : ""
                                    }`}
                                ></span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* mobile nav */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                        menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                >
                    <div className="px-4 pt-4 pb-6 space-y-3 border-t border-rose-100">
                        {navLinks.map((link, index) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`block px-5 py-4 rounded-full text-lg font-semibold transition-all duration-200 transform ${
                                    isActive(link.to)
                                        ? 'text-rose-900 bg-rose-50 shadow-sm scale-105'
                                        : 'text-gray-700 hover:text-rose-900 hover:bg-rose-50/50 active:scale-95'
                                }`}
                                onClick={() => setMenuOpen(false)}
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {/* Mobile auth section */}
                        <div className="pt-4 mt-4 border-t border-rose-100">
                            <div className="px-4 py-2">
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}