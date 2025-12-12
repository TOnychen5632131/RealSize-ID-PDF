import React from 'react';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
    return (
        <nav className={styles.navContainer}>
            <div className={styles.navPill}>
                {/* Logo Section */}
                <div className={styles.logoSection}>
                    {/* Overlapping Circles Icon */}
                    <div className={styles.logoIcon}>
                        <div className={styles.circle} />
                        <div className={styles.circle} style={{ left: '12px', background: 'transparent', border: '1.5px solid currentColor' }} />
                    </div>
                    <span className={styles.brandName}>RealSize ID</span>
                    <span className={styles.betaBadge}>Beta</span>
                </div>

                {/* Right Actions */}
                <div className={styles.actions}>
                    <button className={styles.signInBtn}>Power by Wendell</button>
                    <button className={styles.joinBtn}>API Docs</button>
                </div>
            </div>
        </nav>
    );
};
