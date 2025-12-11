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
                    <button className={styles.signInBtn}>API Docs</button>
                    <button className={styles.joinBtn}>Join Waitlist</button>
                </div>
            </div>
        </nav>
    );
};
