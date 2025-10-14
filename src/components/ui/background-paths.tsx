"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        color: `rgba(15,23,42,${0.1 + i * 0.03})`,
        width: 0.5 + i * 0.03,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                className="w-full h-full text-primary/30"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={0.15 + path.id * 0.02}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: [0, 1, 0],
                            opacity: [0.2, 0.6, 0.2],
                            pathOffset: [0, 0.5, 1],
                        }}
                        transition={{
                            duration: 15 + path.id * 0.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                            delay: path.id * 0.1,
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths({
    children,
}: {
    children?: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
            {/* Animated gradient orbs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="absolute inset-0">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
}
