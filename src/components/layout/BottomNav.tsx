// src/components/layout/BottomNav.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Grid3X3, CreditCard, Lock } from "lucide-react";

const NAV_ITEMS = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/features", icon: Grid3X3, label: "Features" },
    { href: "/pricing", icon: CreditCard, label: "Pricing" },
    { href: "/profile", icon: Lock, label: "My Vault" },
] as const;

export default function BottomNav() {
    const pathname = usePathname();

    // Hide on landing page for clean hero UX
    if (pathname === "/") return null;

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] safe-area-bottom"
            style={{
                background: "rgba(10,10,10,0.75)",
                backdropFilter: "blur(20px) saturate(1.5)",
                WebkitBackdropFilter: "blur(20px) saturate(1.5)",
            }}
        >
            <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center gap-1 py-1.5 px-3 min-w-[56px]"
                        >
                            <div className="relative">
                                <Icon
                                    size={20}
                                    className={`transition-colors ${
                                        isActive ? "text-violet-400" : "text-white/30"
                                    }`}
                                    strokeWidth={isActive ? 2.5 : 1.5}
                                />
                                {isActive && (
                                    <motion.div
                                        className="absolute -inset-2 rounded-full bg-violet-400/10"
                                        layoutId="nav-glow"
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    />
                                )}
                            </div>
                            <span
                                className={`text-[10px] font-medium tracking-wide transition-colors ${
                                    isActive ? "text-violet-400" : "text-white/25"
                                }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
