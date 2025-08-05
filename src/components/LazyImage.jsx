'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export function LazyImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  placeholder = '/images/placeholder.jpg',
  priority = false,
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  return (
    <div 
      ref={imgRef} 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Image failed to load</div>
        </div>
      )}

      {/* Actual image */}
      {isInView && !error && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
          {...props}
        />
      )}
    </div>
  );
}

// Lazy loading for background images
export function LazyBackgroundImage({ 
  src, 
  children, 
  className = '', 
  placeholder = '/images/placeholder.jpg',
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView && !error) {
      const img = new window.Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setError(true);
      img.src = src;
    }
  }, [isInView, src, error]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        backgroundImage: isLoaded ? `url(${src})` : `url(${placeholder})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.3s ease-in-out'
      }}
      {...props}
    >
      {children}
    </div>
  );
} 