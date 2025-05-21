'use client';

import { useEffect, useRef, useState } from 'react';

interface IntersectionObserverOptions extends IntersectionObserverInit {
    triggerOnce?: boolean;
    freezeOnceVisible?: boolean; // Renamed for clarity, similar to triggerOnce but for class removal
}

/**
 * Custom hook to observe an element's intersection with the viewport.
 * @param options Configuration options for the IntersectionObserver.
 * @param animationClass The CSS class to add when the element is intersecting.
 * @param baseClass The base CSS class that might be on the element initially (e.g., 'animate-on-scroll').
 * @returns A ref to attach to the element you want to observe.
 */
export function useIntersectionObserver<T extends HTMLElement>(
    animationClass: string,
    options?: IntersectionObserverOptions,
    baseClass: string = 'animate-on-scroll'
) {
    const elementRef = useRef<T>(null);
    const [isVisible, setIsVisible] = useState(false);

    const defaultOptions: IntersectionObserverOptions = {
        threshold: 0.1, // Trigger when 10% of the element is visible
        triggerOnce: true, // Default to only triggering the animation once
        freezeOnceVisible: true, // Default to keeping the animation class once visible
        ...options,
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    entry.target.classList.add(animationClass);
                    if (baseClass && entry.target.classList.contains(baseClass)) {
                        // Optionally remove the base class if it was just for initial state (e.g., opacity 0)
                        // entry.target.classList.remove(baseClass);
                    }
                    if (defaultOptions.triggerOnce) {
                        observer.unobserve(entry.target);
                    }
                } else {
                    if (!defaultOptions.freezeOnceVisible) {
                        setIsVisible(false);
                        entry.target.classList.remove(animationClass);
                    }
                }
            });
        }, defaultOptions);

        const currentElement = elementRef.current;
        if (currentElement) {
            if (baseClass) {
                currentElement.classList.add(baseClass); // Ensure base class is present for initial hidden state
            }
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [animationClass, baseClass, defaultOptions.threshold, defaultOptions.root, defaultOptions.rootMargin, defaultOptions.triggerOnce, defaultOptions.freezeOnceVisible]); // Ensure all relevant options are dependencies

    return { ref: elementRef, isVisible };
}
