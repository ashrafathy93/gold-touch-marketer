
import React, { useEffect, useState, useRef } from 'react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    setPosition({ x: newX, y: newY });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.005;
    const newScale = Math.max(1, Math.min(scale + delta, 8));

    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        
        // mouse position relative to container
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Where on the image the mouse is pointing
        const imageX = (mouseX - position.x) / scale;
        const imageY = (mouseY - position.y) / scale;

        const newX = mouseX - imageX * newScale;
        const newY = mouseY - imageY * newScale;

        setPosition({ x: newX, y: newY });
    }
    
    setScale(newScale);

    if (newScale <= 1) {
      handleReset();
    }
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Add touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    handleMouseDown({
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
    } as any);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    handleMouseMove({
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
    } as any);
  };
  
  const handleTouchEnd = () => {
    handleMouseUp();
  };


  useEffect(() => {
    const handleMouseUpGlobal = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    window.addEventListener('mouseup', handleMouseUpGlobal);
    window.addEventListener('touchend', handleMouseUpGlobal);

    return () => {
      window.removeEventListener('mouseup', handleMouseUpGlobal);
      window.removeEventListener('touchend', handleMouseUpGlobal);
    };
  }, [isDragging]);

  const cursorStyle = scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default';

  const handleZoomButtonClick = (direction: 'in' | 'out') => {
    const fakeEvent = {
        deltaY: direction === 'in' ? -100 : 100,
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2,
        preventDefault: () => {},
    } as React.WheelEvent;
    handleWheel(fakeEvent);
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={containerRef}
        className="relative max-w-5xl max-h-full w-full h-full flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Enlarged design view"
          className="max-w-none max-h-none object-contain rounded-lg shadow-2xl transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: cursorStyle,
            touchAction: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          draggable="false"
        />
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full p-2 text-white font-bold">
        <button
            onClick={() => handleZoomButtonClick('out')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-xl"
            aria-label="Zoom out"
        >
            -
        </button>
        <span className="text-sm font-mono w-16 text-center cursor-pointer" onClick={handleReset} title="Reset zoom">
            {Math.round(scale * 100)}%
        </span>
        <button
            onClick={() => handleZoomButtonClick('in')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-xl"
            aria-label="Zoom in"
        >
            +
        </button>
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/40 transition-colors duration-200 text-2xl"
        aria-label="Close image view"
      >
        &times;
      </button>
    </div>
  );
};
