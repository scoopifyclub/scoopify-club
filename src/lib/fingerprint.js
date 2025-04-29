'use client';

import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise = null;

export async function generateDeviceFingerprint() {
    try {
        if (!fpPromise) {
            fpPromise = FingerprintJS.load();
        }

        const fp = await fpPromise;
        const result = await fp.get();

        return result.visitorId;
    } catch (error) {
        console.error('Error generating device fingerprint:', error);
        // Fallback to a random identifier if fingerprinting fails
        return `fallback-${Math.random().toString(36).substring(2)}`;
    }
} 