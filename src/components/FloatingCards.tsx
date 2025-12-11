import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './FloatingCards.module.css';

// Asset Paths
// Asset Paths
const ASSETS = [
    '/assets/Canada.webp',
    '/assets/China.webp',
    '/assets/Hong-Kong.webp',
    '/assets/India.webp',
    '/assets/Japan.webp',
    '/assets/Korea.webp',
    '/assets/New-Zealand.webp',
    '/assets/Singapore.webp',
    '/assets/Taiwan.webp',
    '/assets/USA.webp',
    '/assets/United-Kindom.webp',
    '/assets/id_french.png',
    '/assets/license.jpg',
    '/assets/Hong-Kong.webp',
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

    // Prevent hydration mismatch by defining initial render
    if (!mounted) return <div className={styles.container} />;

    return (
        <div className={styles.container}>
            {/* Ripple Background Effect */}
            <div className={styles.rippleBackground}>
                <div className={styles.rippleRing} style={{ animationDelay: '0s' }} />
                <div className={styles.rippleRing} style={{ animationDelay: '2.5s' }} />
                <div className={styles.rippleRing} style={{ animationDelay: '5s' }} />
            </div>

            <motion.div
                className={styles.orbitContainer}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 120,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                {cards.map((card) => {
                    const mobileRadiusModifier = isMobile ? 1.4 : 1.0;
                    const effectiveRadius = card.radius * mobileRadiusModifier;

                    const rad = (card.angle * Math.PI) / 180;
                    const x = 50 + Math.cos(rad) * effectiveRadius;
                    const y = 50 + Math.sin(rad) * effectiveRadius;

                    return (
                        <motion.div
                            key={card.id}
                            className={styles.card}
                            style={{
                                top: `${y}%`,
                                left: `${x}%`,
                                zIndex: card.zIndex,
                                filter: `blur(${card.blur})`,
                                transform: isMobile ? `scale(0.8)` : undefined
                            }}
                            initial={{
                                scale: card.scale,
                                rotate: card.rotate
                            }}
                            animate={{
                                // Local "float" on top of orbit
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
        </div>
    );
};
