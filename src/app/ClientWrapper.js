"use client";

import { useEffect } from 'react';
import Modal from 'react-modal';

export default function ClientWrapper({ children }) {
    useEffect(() => {
        const appElement = document.getElementById('__next');
        if (appElement) {
            Modal.setAppElement(appElement);
        }
    }, []);

    return <>{children}</>;
}
