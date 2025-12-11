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
const cards = Array.from({ length: 64 }).map((_, i) => { // High density
    // Distribute in a ring
    const layer = i % 4;
    const angle = (i / 64) * 360 + (Math.random() * 20 - 10);

    return {
        id: i,
        angle,
        // Store base percentage (50 is center edge, higher is wider)
        // We will scale this in CSS or use baseRadius logical unit
        baseRadiusPct: 50 + (layer * 12) + (Math.random() * 15 - 7.5),

        rotate: Math.random() * 360,
        delay: Math.random() * 4,
        imageSrc: ASSETS[i % ASSETS.length],
        scale: (0.6 + Math.random() * 0.4) * (1 - layer * 0.1),
        blur: layer >= 2 ? '1.5px' : '0px',
        zIndex: 20 - layer
    };
});

export const FloatingCards: React.FC = () => {
    // We can use window width to adjust orbit scale if needed, or just CSS media queries on the container.
    // Simpler: Use CSS variable for radius multiplier!

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

                    // Use CSS logic for responsive radius? Hard in inline styles.
                    // Instead, we stick to %, but maybe ensure 50% means "edge of screen" 
                    // which works well for both mobile (narrow) and desktop (wide).
                    // Actually, on mobile 50% width is small. We might want larger radius on mobile.
                    // But for now, let's trust the % based layout will scale down, keeping them 'surrounding'.
                    // To ensure they don't cover center content on mobile, we can push them out further?

                    const x = 50 + Math.cos(rad) * card.baseRadiusPct;
                    const y = 50 + Math.sin(rad) * card.baseRadiusPct;

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
