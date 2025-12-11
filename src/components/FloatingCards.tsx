import React from 'react';
import { motion } from 'framer-motion';
import styles from './FloatingCards.module.css';

// Generate many cards for a dense ring
const cards = Array.from({ length: 48 }).map((_, i) => {
  // Distribute in a ring with some depth
  const layer = i % 3; // 0=close, 1=mid, 2=far
  const angle = (i / 48) * 360 + (Math.random() * 10 - 5); // Base angle + jitter

  // Radius: INCREASED to ensure they "surround" the page content as requested
  // Old: 35 + ...
  const baseRadius = 45 + (layer * 15);
  const radius = baseRadius + (Math.random() * 8 - 4);

  return {
    id: i,
    angle,
    radius,
    // Random rotation
    rotate: Math.random() * 180 - 90, // Chaotic rotation like dropped photos
    delay: Math.random() * 4,
    // Style class
    style: `style${(i % 4) + 1}`,
    // Scale factor for depth perception
    scale: layer === 0 ? 1.1 : layer === 1 ? 0.9 : 0.7,
    // Blur for depth
    blur: layer === 2 ? '1px' : '0px',
    zIndex: 10 - layer
  };
});

export const FloatingCards: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* 
         We animate the entire container to rotate slowly, creating the "orbit" effect 
         without needing complex per-card math updates.
      */}
      <motion.div
        className={styles.orbitContainer}
        animate={{ rotate: 360 }}
        transition={{
          duration: 120, // Slow rotation (2 minutes per revolution)
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {cards.map((card) => {
          // Calculate position
          const rad = (card.angle * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * card.radius;
          const y = 50 + Math.sin(rad) * card.radius;

          return (
            <motion.div
              key={card.id}
              className={`${styles.card} ${styles[card.style]}`}
              style={{
                top: `${y}%`,
                left: `${x}%`,
                zIndex: card.zIndex,
                filter: `blur(${card.blur})`
              }}
              // Instant appearance, no fade-in
              initial={{
                scale: card.scale,
                rotate: card.rotate
              }}
              // Just local hover-like float, main movement is the container orbit
              animate={{
                rotate: card.rotate + (Math.random() * 10 - 5),
                x: [0, Math.random() * 10 - 5, 0],
                y: [0, Math.random() * 10 - 5, 0]
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              {/* Render different interiors based on style */}
              {card.style === 'style1' ? (
                // Passport Style
                <div className={styles.cardInterior}>
                  <div className={styles.header} />
                  <div style={{ color: '#fbbf24', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>PASSPORT</div>
                  <div className={styles.textLine} />
                  <div className={styles.textLine} style={{ width: '40%' }} />
                </div>
              ) : (
                // ID/License Style
                <div className={styles.cardInterior}>
                  <div className={styles.header} />
                  <div className={styles.body}>
                    <div className={styles.portrait} />
                    <div className={styles.details}>
                      {/* Randomize chip presence */}
                      {card.id % 2 === 0 && <div className={styles.chip} style={{ width: '20px', height: '14px', background: 'gold', borderRadius: '2px', marginBottom: '4px' }} />}
                      <div className={styles.textLine} style={{ width: '90%' }} />
                      <div className={styles.textLine} style={{ width: '60%' }} />
                      <div className={styles.textLine} style={{ width: '80%' }} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
