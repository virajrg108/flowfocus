import { useState, useCallback, useEffect } from 'react';

interface UseDocumentPiPOptions {
    onClose?: () => void;
}

export const useDocumentPiP = (options: UseDocumentPiPOptions = {}) => {
    const [pipWindow, setPipWindow] = useState<Window | null>(null);

    const isSupported = 'documentPictureInPicture' in window;

    const closePiP = useCallback(() => {
        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
            options.onClose?.();
        }
    }, [pipWindow, options]);

    const requestPiP = useCallback(async (width = 400, height = 300) => {
        if (!isSupported) return;

        // If already open, close it (toggle behavior or just focus? decided to re-open/focus)
        if (pipWindow) {
            // pipWindow.focus(); // Optional: Focus if already open, but usually we want to re-render or just let it be.
            // For now, let's just return to avoid duplicate windows or errors.
            return;
        }

        try {
            // @ts-ignore - documentPictureInPicture is experimental
            const windowProxy = await window.documentPictureInPicture.requestWindow({
                width,
                height,
            });

            // Copy styles
            const styleSheets = Array.from(document.styleSheets);
            styleSheets.forEach((styleSheet) => {
                try {
                    if (styleSheet.href) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = styleSheet.href;
                        windowProxy.document.head.appendChild(link);
                    } else if (styleSheet.cssRules) {
                        const style = document.createElement('style');
                        Array.from(styleSheet.cssRules).forEach(rule => {
                            style.appendChild(document.createTextNode(rule.cssText));
                        });
                        windowProxy.document.head.appendChild(style);
                    }
                } catch (e) {
                    console.warn("Could not copy stylesheet", e);
                }
            });

            // Copy explicit style and link tags as fallback/supplement (e.g. for Tailwind injected styles if not in styleSheets list yet)
            Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach((node) => {
                windowProxy.document.head.appendChild(node.cloneNode(true));
            });


            // Handle closing
            windowProxy.addEventListener('pagehide', () => {
                setPipWindow(null);
                options.onClose?.();
            });

            setPipWindow(windowProxy);
        } catch (error) {
            console.error("Failed to open PiP window:", error);
        }
    }, [isSupported, pipWindow, options]);

    // Close PiP when the main window unmounts/reloads
    useEffect(() => {
        return () => {
            if (pipWindow) {
                pipWindow.close();
            }
        };
    }, [pipWindow]);

    return {
        isSupported,
        pipWindow,
        requestPiP,
        closePiP
    };
};
