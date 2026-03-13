"use client";

import { motion } from "framer-motion";
import { Wind, Flame, Mountain, Sparkles, Droplet } from "lucide-react";

const ENERGIES = [
    {
        name: "Wood",
        icon: Wind,
        archetype: "The Visionary",
        hook: "You grow toward the light — even through concrete.",
        color: "#22c55e",
        gradient: "from-emerald-500/20 to-green-600/20",
    },
    {
        name: "Fire",
        icon: Flame,
        archetype: "The Catalyst",
        hook: "You don't enter rooms — you ignite them.",
        color: "#ef4444",
        gradient: "from-red-500/20 to-orange-600/20",
    },
    {
        name: "Earth",
        icon: Mountain,
        archetype: "The Anchor",
        hook: "Everyone orbits you. You just don't notice.",
        color: "#f59e0b",
        gradient: "from-amber-500/20 to-yellow-600/20",
    },
    {
        name: "Metal",
        icon: Sparkles,
        archetype: "The Blade",
        hook: "Precision is your love language. Mediocrity isn't.",
        color: "#a1a1aa",
        gradient: "from-zinc-400/20 to-slate-500/20",
    },
    {
        name: "Water",
        icon: Droplet,
        archetype: "The Mirror",
        hook: "You feel everything — and remember what others forget.",
        color: "#3b82f6",
        gradient: "from-blue-500/20 to-indigo-600/20",
    },
] as const;

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.12 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function LoreSection() {
    return (
        <section className="py-20 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Headline */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-white/90 mb-3">
                        12 Zodiacs are dead.<br />
                        <span className="text-gradient-ohang">Meet the 5 Energies.</span>
                    </h2>
                    <p className="text-sm text-white/30 max-w-md mx-auto">
                        Your Cosmic Blueprint maps your soul to five primal forces — not constellations.
                    </p>
                </motion.div>

                {/* Energy Cards */}
                <motion.div
                    className="grid gap-3"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-30px" }}
                >
                    {ENERGIES.map((energy) => {
                        const Icon = energy.icon;
                        return (
                            <motion.div
                                key={energy.name}
                                variants={cardVariants}
                                className="group flex items-center gap-4 p-4 rounded-xl bg-black/40 backdrop-blur-sm border transition-colors hover:border-opacity-50"
                                style={{
                                    borderColor: `${energy.color}30`,
                                }}
                            >
                                {/* Icon */}
                                <div
                                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${energy.gradient} flex items-center justify-center flex-shrink-0`}
                                    style={{ border: `1px solid ${energy.color}25` }}
                                >
                                    <Icon size={20} style={{ color: energy.color }} />
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-semibold text-white/80">{energy.name}</span>
                                        <span
                                            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                            style={{
                                                color: energy.color,
                                                backgroundColor: `${energy.color}12`,
                                            }}
                                        >
                                            {energy.archetype}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/35 leading-relaxed">{energy.hook}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
