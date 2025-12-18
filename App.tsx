import React, { useEffect } from 'react';
import { Scene } from './components/Scene';
import { UIOverlay } from './components/UIOverlay';
import { useStore } from './store';

const App = () => {
  const { removeSelection } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Delete or Backspace key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Safety check: Don't delete objects if the user is typing in an input field
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;
        
        removeSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup listener on unmount
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeSelection]);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-slate-100">
        {/* 3D Scene Layer */}
        <div className="absolute inset-0 z-0">
            <Scene />
        </div>
        
        {/* UI Overlay Layer */}
        <div className="absolute inset-0 z-10 pointer-events-none">
            <UIOverlay />
        </div>
    </div>
  );
};

export default App;