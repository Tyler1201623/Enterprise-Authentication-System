import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface ProgressiveImageProps {
  src: string;
  placeholderSrc?: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

// Styled containers for improved rendering
const ImageContainer = styled.div<{ $width?: string | number; $height?: string | number }>`
  position: relative;
  width: ${props => props.$width ? (typeof props.$width === 'number' ? `${props.$width}px` : props.$width) : '100%'};
  height: ${props => props.$height ? (typeof props.$height === 'number' ? `${props.$height}px` : props.$height) : 'auto'};
  overflow: hidden;
  background-color: #f0f0f0;
  transform: translateZ(0); /* Force GPU acceleration */
`;

const StyledImage = styled.img<{ $loaded: boolean; $blur: boolean }>`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${props => props.$loaded ? '1' : '0'};
  transition: opacity 0.3s ease-in-out;
  filter: ${props => props.$blur ? 'blur(10px)' : 'none'};
  transform: ${props => props.$blur ? 'scale(1.1)' : 'scale(1)'};
  transition: 
    opacity 0.4s ease-in-out, 
    filter 0.3s ease-in-out,
    transform 0.3s ease-in-out;
  will-change: opacity, filter, transform;
`;

/**
 * ProgressiveImage component for improved image loading experience
 * Shows a low-resolution or blurred image while the full image loads
 */
const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholderSrc,
  alt,
  width,
  height,
  className,
  style
}) => {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaceholder, setIsPlaceholder] = useState(Boolean(placeholderSrc));

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    
    const image = new Image();
    image.src = src;
    image.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      setIsPlaceholder(false);
    };
    
    // Generate a simple placeholder if none is provided
    if (!placeholderSrc) {
      setCurrentSrc(`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width || 300} ${height || 200}'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3C/svg%3E`);
      setIsPlaceholder(true);
    }
    
    return () => {
      // Clean up
      image.onload = null;
    };
  }, [src, placeholderSrc, width, height]);

  return (
    <ImageContainer 
      $width={width} 
      $height={height} 
      className={className} 
      style={style}
    >
      {currentSrc && (
        <StyledImage
          src={currentSrc}
          alt={alt}
          $loaded={true} // Always show the current image (placeholder or final)
          $blur={isPlaceholder}
          onLoad={() => {
            // Only set loaded to true when the final image is loaded
            if (currentSrc === src) {
              setIsLoaded(true);
            }
          }}
        />
      )}
    </ImageContainer>
  );
};

export default React.memo(ProgressiveImage); 