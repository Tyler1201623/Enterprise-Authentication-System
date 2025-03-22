import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface VirtualScrollerProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  scrollingDelay?: number;
}

interface ScrollerState {
  startIndex: number;
  endIndex: number;
  scrollTop: number;
  isScrolling: boolean;
}

// Styled container for scrolling
const ScrollContainer = styled.div<{ $height: number }>`
  width: 100%;
  height: ${props => `${props.$height}px`};
  overflow-y: auto;
  position: relative;
  will-change: transform;
  -webkit-overflow-scrolling: touch; /* Smoother scrolling on iOS */
`;

const InnerContainer = styled.div<{ $totalHeight: number }>`
  width: 100%;
  height: ${props => `${props.$totalHeight}px`};
  position: relative;
`;

const ListItem = styled.div<{ $top: number; $height: number }>`
  position: absolute;
  width: 100%;
  height: ${props => `${props.$height}px`};
  top: ${props => `${props.$top}px`};
  left: 0;
  contain: content; /* Improves performance */
`;

/**
 * Custom hook for virtualized list calculations
 */
function useVirtualScroll<T>({
  items,
  height,
  itemHeight,
  overscan = 5,
  endReachedThreshold = 500,
  onEndReached,
  scrollingDelay = 150,
}: {
  items: T[];
  height: number;
  itemHeight: number;
  overscan?: number;
  endReachedThreshold?: number;
  onEndReached?: () => void;
  scrollingDelay?: number;
}): [
  ScrollerState,
  React.RefObject<HTMLDivElement>,
  (e: React.UIEvent<HTMLDivElement>) => void
] {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollerState>({
    startIndex: 0,
    endIndex: Math.min(Math.ceil(height / itemHeight) + overscan, items.length - 1),
    scrollTop: 0,
    isScrolling: false,
  });
  
  const totalHeight = items.length * itemHeight;
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastOnEndReachedCalledIndex = useRef<number>(0);

  // Update visible range based on scroll position
  const calculateRange = useCallback(
    (scrollTop: number) => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleCount = Math.ceil(height / itemHeight) + 2 * overscan;
      const endIndex = Math.min(items.length - 1, startIndex + visibleCount);
      
      setScrollState(prev => ({
        ...prev,
        startIndex,
        endIndex,
        scrollTop,
      }));
      
      // Call onEndReached if we're close to the end and haven't called it already
      if (
        onEndReached &&
        totalHeight - scrollTop - height < endReachedThreshold &&
        lastOnEndReachedCalledIndex.current !== items.length
      ) {
        lastOnEndReachedCalledIndex.current = items.length;
        onEndReached();
      }
    },
    [height, itemHeight, items.length, overscan, totalHeight, endReachedThreshold, onEndReached]
  );

  // Handle scroll events
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      
      // Set scrolling state for potential performance optimizations
      if (!scrollState.isScrolling) {
        setScrollState(prev => ({ ...prev, isScrolling: true }));
      }
      
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set timeout to stop "isScrolling" flag
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollState(prev => ({ ...prev, isScrolling: false }));
      }, scrollingDelay);
      
      calculateRange(scrollTop);
    },
    [calculateRange, scrollState.isScrolling, scrollingDelay]
  );

  // Recalculate on items or height change
  useEffect(() => {
    if (scrollRef.current) {
      calculateRange(scrollRef.current.scrollTop);
    }
    
    // Reset end reached tracking when items change
    if (items.length !== lastOnEndReachedCalledIndex.current) {
      lastOnEndReachedCalledIndex.current = 0;
    }
  }, [items, calculateRange]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return [scrollState, scrollRef, handleScroll];
}

/**
 * Custom hook for element resize observation
 */
function useResizeObserver<T extends Element>(): [
  React.RefObject<T>,
  DOMRectReadOnly | undefined
] {
  const resizeRef = useRef<T>(null);
  const [contentRect, setContentRect] = useState<DOMRectReadOnly>();

  useEffect(() => {
    if (!resizeRef.current) return;
    
    const element = resizeRef.current;
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return;
      setContentRect(entries[0].contentRect);
    });
    
    resizeObserver.observe(element);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return [resizeRef, contentRect];
}

/**
 * VirtualScroller component for efficient rendering of large lists
 */
function VirtualScroller<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className,
  onEndReached,
  endReachedThreshold = 500,
  scrollingDelay = 150,
}: VirtualScrollerProps<T>): JSX.Element {
  const [containerRef, containerRect] = useResizeObserver<HTMLDivElement>();
  
  // Use the container's width if available
  const containerWidth = containerRect?.width || 0;
  
  const [scrollState, scrollRef, handleScroll] = useVirtualScroll({
    items,
    height,
    itemHeight,
    overscan,
    onEndReached,
    endReachedThreshold,
    scrollingDelay,
  });
  
  const { startIndex, endIndex, isScrolling } = scrollState;
  const totalHeight = items.length * itemHeight;
  
  // Memoize visible items for better performance
  const visibleItems = React.useMemo(() => {
    return Array.from({ length: endIndex - startIndex + 1 }, (_, index) => {
      const itemIndex = index + startIndex;
      return (
        <ListItem
          key={itemIndex}
          $top={itemIndex * itemHeight}
          $height={itemHeight}
        >
          {renderItem(items[itemIndex], itemIndex)}
        </ListItem>
      );
    });
  }, [startIndex, endIndex, items, itemHeight, renderItem]);
  
  return (
    <ScrollContainer
      ref={(node) => {
        // Merge refs
        if (scrollRef) {
          // @ts-ignore - we know this is fine
          scrollRef.current = node;
        }
        if (containerRef) {
          // @ts-ignore - we know this is fine
          containerRef.current = node;
        }
      }}
      $height={height}
      onScroll={handleScroll}
      className={className}
      data-testid="virtual-scroller"
    >
      <InnerContainer $totalHeight={totalHeight}>
        {visibleItems}
      </InnerContainer>
    </ScrollContainer>
  );
}

export default React.memo(VirtualScroller) as typeof VirtualScroller; 