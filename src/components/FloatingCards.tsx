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
    '/assets/passport.jpg',
    '/assets/passport_aus.jpg',
    '/assets/passport_swiss.jpg',
    '/assets/passport_uk.jpg'
];

// Generate many cards for a dense, messy ring
const cards = Array.from({ length: 64 }).map((_, i) => { // Increased count for density
    // Distribute in a ring with MORE depth and messiness
    const layer = i % 4; // 0..3 layers
    const angle = (i / 64) * 360 + (Math.random() * 20 - 10); // More jitter in angle

    // Radius: Spread them out more, but keep them surrounding the center
    // Base radius 45% + layer variance + large random jitter
    const baseRadius = 50 + (layer * 12);
    const radius = baseRadius + (Math.random() * 15 - 7.5); // +/- 7.5% jitter

    return {
        id: i,
        angle,
        radius,
        // Chaotic rotation: Full 360 random range for "messy dropped" look
        rotate: Math.random() * 360,
        delay: Math.random() * 4,
        // Style class matches index in ASSETS
        imageSrc: ASSETS[i % ASSETS.length],
        // Scale factor: Smaller generally, with variance
        scale: (0.6 + Math.random() * 0.4) * (1 - layer * 0.1), // 0.6 to 1.0 base, reduced by layer
        // Blur for depth
        blur: layer >= 2 ? '1.5px' : '0px',
        zIndex: 20 - layer
    };
});

export const FloatingCards: React.FC = () => {
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
                    duration: 120, // Slow rotation
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                {cards.map((card) => {
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
