import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './FloatingCards.module.css';

// Asset Paths
// Asset Paths
const ASSETS = [
    '/assets/Australia.webp',
    '/assets/Canada.webp',
    '/assets/China.webp',
    '/assets/Germany.webp',
    '/assets/Hong-Kong.webp',
    '/assets/India.webp',
    '/assets/Japan.webp',
    '/assets/Korea.webp',
    '/assets/Macao.webp',
    '/assets/New-Zealand.webp',
    '/assets/Singapore.webp',
    '/assets/Spain.webp',
    '/assets/Taiwan.webp',
    '/assets/USA.webp',
    '/assets/United-Kindom.webp',
    '/assets/id_french.png',
    '/assets/license.jpg',
    '/assets/passport_aus.jpg',
    '/assets/passport_swiss.jpg',
    '/assets/passport_uk.jpg'
];

// Generate cards logic (keep standard config, can be outside or inside, but usage must be client-side)
const generateCards = () => {
    return Array.from({ length: 64 }).map((_, i) => {
        const layer = i % 4;
        const angle = (i / 64) * 360 + (Math.random() * 20 - 10);
        const baseRadius = 50 + (layer * 12);
        const radius = baseRadius + (Math.random() * 15 - 7.5);

        return {
            id: i,
            angle,
            radius,
            rotate: Math.random() * 360,
            delay: Math.random() * 4,
            imageSrc: ASSETS[i % ASSETS.length],
            scale: (0.6 + Math.random() * 0.4) * (1 - layer * 0.1),
            blur: layer >= 2 ? '1.5px' : '0px',
            zIndex: 20 - layer
        };
    });
};

export const FloatingCards: React.FC = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [cards, setCards] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        setCards(generateCards()); // Generate random cards only on client

        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Mobile Marquee Logic
    // create 3 columns, each with a duplicated long list of assets for smooth infinite scroll
    const marqueeColumns = [
        [...ASSETS, ...ASSETS, ...ASSETS], // Column 1
        [...ASSETS, ...ASSETS, ...ASSETS].reverse(), // Column 2 (reverse for variety)
        [...ASSETS, ...ASSETS, ...ASSETS]  // Column 3
    ];

    if (!mounted) return <div className={styles.container} />;

    return (
        <div className={styles.container}>
            {/* Ripple Background Effect - Always present */}
            <div className={styles.rippleBackground}>
                <div className={styles.rippleRing} style={{ animationDelay: '0s' }} />
                <div className={styles.rippleRing} style={{ animationDelay: '2.5s' }} />
                <div className={styles.rippleRing} style={{ animationDelay: '5s' }} />
            </div>

            {isMobile ? (
                // --- Mobile Marquee View ---
                <div className={styles.marqueeContainer}>
                    {marqueeColumns.map((colAssets, colIndex) => (
                        <div key={colIndex} className={styles.marqueeColumn}>
                            <motion.div
                                className={styles.marqueeTrack}
                                animate={{ y: colIndex % 2 === 0 ? [0, -1000] : [-1000, 0] }}
                                transition={{
                                    duration: 40 + colIndex * 10,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            >
                                {colAssets.map((src, idx) => (
                                    <div key={idx} className={styles.marqueeCard}>
                                        <img src={src} alt="" />
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    ))}
                </div>
            ) : (
                // --- Desktop Orbit View ---
                <motion.div
                    className={styles.orbitContainer}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 120, // Slow rotation
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    {cards.map((card) => {
                        // Desktop only needs checking here strictly speaking, but keeping logic clean
                        const rad = (card.angle * Math.PI) / 180;
                        const x = 50 + Math.cos(rad) * card.radius;
                        const y = 50 + Math.sin(rad) * card.radius;

                        return (
                            <motion.div
                                key={card.id}
                                className={styles.card}
                                style={{
                                    top: `${y}%`,
                                    left: `${x}%`,
                                    zIndex: card.zIndex,
                                    filter: `blur(${card.blur})`
                                }}
                                initial={{
                                    scale: card.scale,
                                    rotate: card.rotate
                                }}
                                animate={{
                                    rotate: card.rotate + (Math.random() * 20 - 10),
                                    x: [0, Math.random() * 15 - 7.5, 0],
                                    y: [0, Math.random() * 15 - 7.5, 0]
                                }}
                                transition={{
                                    duration: 5 + Math.random() * 5,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    ease: "easeInOut"
                                }}
                            >
                                <img
                                    src={card.imageSrc}
                                    alt=""
                                    className={styles.cardImage}
                                />
                                <div className={styles.gloss} />
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
};

