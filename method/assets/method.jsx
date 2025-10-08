import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const VideoSynthesisDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [particles, setParticles] = useState([]);
  const [selectedParticle, setSelectedParticle] = useState(0);
  const canvasRef = useRef(null);
  
  const numParticles = 4;
  const canvasWidth = 600;
  const canvasHeight = 250;
  const padding = 60;

  // ---- Shared initial Gaussian for all experts ----
  const initialMean = { x: canvasWidth * 0.5, y: canvasHeight * 0.65 };
  // A "standard-ish" visual std relative to canvas size (tweakable)
  const initialStd = Math.min(canvasWidth, canvasHeight) * 0.5;

  // Expert targets (final centers of score fields)
  const textTarget    = { x: canvasWidth * 0.30, y: canvasHeight * 0.90 }; // Model 1
  const cameraTarget  = { x: canvasWidth * 0.85, y: canvasHeight * 0.50 }; // Model 2
  const depthTarget   = { x: canvasWidth * 0.60, y: canvasHeight * 0.30 }; // Model 3
  const contextTarget = { x: canvasWidth * 0.70, y: canvasHeight * 0.70 }; // Context

  // Smooth easing for center motion (0->1)
  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpPoint = (p0, p1, t) => ({ x: lerp(p0.x, p1.x, t), y: lerp(p0.y, p1.y, t) });

  // Moving centers as a function of progress
  const getCenters = (progress) => {
    const u = easeInOutCubic(Math.min(Math.max(progress, 0), 1));
    return {
      text:    lerpPoint(initialMean, textTarget, u),
      camera:  lerpPoint(initialMean, cameraTarget, u),
      depth:   lerpPoint(initialMean, depthTarget, u),
      context: contextTarget, // Fixed
    };
  };

  // Gaussian sampler (Box–Muller)
  const sampleGaussian2D = (mean, std) => {
    // x
    let u1 = 1 - Math.random();
    let u2 = 1 - Math.random();
    let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    // y
    u1 = 1 - Math.random();
    u2 = 1 - Math.random();
    let z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    return { x: mean.x + z0 * std, y: mean.y + z1 * std };
  };

  const clampPad = (v, min, max) => Math.max(min, Math.min(max, v));

  const initializeParticles = () => {
    return Array(numParticles).fill(0).map(() => {
      const { x, y } = sampleGaussian2D(initialMean, initialStd);
      return {
        x: clampPad(x, padding, canvasWidth - padding),
        y: clampPad(y, padding, canvasHeight - padding),
        size: 6,
        opacity: 0.9,
        forces: {},
        trail: []
      };
    });
  };
  
  // Initialize particles on mount
  useEffect(() => {
    setParticles(initializeParticles());
  }, []);
  
  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setStep(s => {
        const newStep = (s + 1) % 300;
        if (newStep === 0) {
          setParticles(initializeParticles());
        }
        return newStep;
      });
      
      setParticles(prevParticles => {
        // Use the *next* step's progress to reduce lag
        const nextProgress = ((step + 1) % 300) / 300;
        const centers = getCenters(nextProgress);
        const annealing = Math.max(0.02, 1 - nextProgress * 1.2);

        return prevParticles.map((p, idx) => {
          // Expert forces (score gradients ∇log p^(i)) toward the *moving* centers
          const textForce = {
            x: (centers.text.x - p.x) * 0.008,
            y: (centers.text.y - p.y) * 0.008
          };
          const cameraForce = {
            x: (centers.camera.x - p.x) * 0.008,
            y: (centers.camera.y - p.y) * 0.008
          };
          const depthForce = {
            x: (centers.depth.x - p.x) * 0.008,
            y: (centers.depth.y - p.y) * 0.008
          };
          // Context has stronger pull late in annealing (as before)
          const contextForce = {
            x: (centers.context.x - p.x) * 0.015 * Math.pow(1 - annealing, 2),
            y: (centers.context.y - p.y) * 0.015 * Math.pow(1 - annealing, 2)
          };
          
          // SVGD repulsion
          let repulsionX = 0, repulsionY = 0;
          prevParticles.forEach((other, otherIdx) => {
            if (idx !== otherIdx) {
              const dx = p.x - other.x;
              const dy = p.y - other.y;
              const dist = Math.sqrt(dx * dx + dy * dy) + 1;
              const force = 120 / (dist * dist);
              repulsionX += (dx / dist) * force;
              repulsionY += (dy / dist) * force;
            }
          });
          
          const repulsionForce = { x: repulsionX * 0.12, y: repulsionY * 0.12 };
          
          // Compose forces
          const attractiveForceX = textForce.x + cameraForce.x + depthForce.x + contextForce.x;
          const attractiveForceY = textForce.y + cameraForce.y + depthForce.y + contextForce.y;
          
          const totalForceX = attractiveForceX + repulsionForce.x;
          const totalForceY = attractiveForceY + repulsionForce.y;
          
          // Noise (annealed)
          const noiseX = (Math.random() - 0.5) * annealing * 3;
          const noiseY = (Math.random() - 0.5) * annealing * 3;
          
          const newX = clampPad(p.x + totalForceX + noiseX, padding, canvasWidth - padding);
          const newY = clampPad(p.y + totalForceY + noiseY, padding, canvasHeight - padding);
          
          // Update trail
          const newTrail = [...(p.trail || []), { x: p.x, y: p.y }];
          if (newTrail.length > 40) newTrail.shift();
          
          return {
            ...p,
            x: newX,
            y: newY,
            trail: newTrail,
            opacity: 0.85,
            forces: {
              text: textForce,
              camera: cameraForce,
              depth: depthForce,
              context: contextForce,
              repulsion: repulsionForce,
              total: { x: totalForceX, y: totalForceY },
              attractive: { x: attractiveForceX, y: attractiveForceY }
            }
          };
        });
      });
    }, 35);
    
    return () => clearInterval(interval);
  }, [isPlaying, step]);
  
  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Setup high-DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    const progress = step / 300;
    const annealing = Math.max(0.02, 1 - progress * 1.2);
    const annealing_capped = annealing * 0.5 + 0.5;

    // Use moving centers for drawing the score fields too
    const centers = getCenters(progress);

    // Draw score field contours for each expert
    const drawScoreField = (cx, cy, color, label = '') => {
      // The std visually shrinks via annealing_capped as before
      for (let r = 15; r < 200; r += 24) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * annealing_capped, 0, Math.PI * 2);
        const alpha = (1 - r / 200) * 0.18 * annealing_capped;
        ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      
      // Filled center region to show high density
      ctx.beginPath();
      ctx.arc(cx, cy, 12 * annealing_capped, 0, Math.PI * 2);
      ctx.fillStyle = color + '15';
      ctx.fill();
      
      // Label the score field
      ctx.fillStyle = color;
      ctx.font = 'bold 13px ui-monospace, monospace';
      ctx.textAlign = 'center';
      
      if (label === 'Model 1') {
        ctx.fillText('p⁽¹⁾(x|y⁽¹⁾;t)', textTarget.x - 35, textTarget.y + 4);
      } else if (label === 'Model 2') {
        ctx.fillText('p⁽²⁾(x|y⁽²⁾;t)', cameraTarget.x + 35, cameraTarget.y + 4);
      } else if (label === 'Model 3') {
        ctx.fillText('p⁽³⁾(x|y⁽³⁾;t)', depthTarget.x, depthTarget.y - 18);
      }
    };
    
    // Expert score fields with MOVING centers
    drawScoreField(centers.text.x,   centers.text.y,   '#2563eb', 'Model 1');
    drawScoreField(centers.camera.x, centers.camera.y, '#7c3aed', 'Model 2');
    drawScoreField(centers.depth.x,  centers.depth.y,  '#db2777', 'Model 3');
    
    // Context score field (also moves from shared Gaussian toward its target)
    const contextAlpha = 0.22 * annealing_capped;
    for (let r = 15; r < 140; r += 24) {
      ctx.beginPath();
      ctx.arc(centers.context.x, centers.context.y, r * 0.8 * annealing_capped, 0, Math.PI * 2);
      const alpha = (1 - r / 140) * contextAlpha;
      ctx.strokeStyle = '#059669' + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(centers.context.x, centers.context.y, 10 * annealing_capped, 0, Math.PI * 2);
    ctx.fillStyle = '#059669' + '15';
    ctx.fill();
    
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 13px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('p_context(x;t)', centers.context.x, centers.context.y + 25);
    
    // Draw particle trails
    particles.forEach((particle, idx) => {
      if (particle.trail && particle.trail.length > 1) {
        for (let i = 1; i < particle.trail.length; i++) {
          const alpha = (i / particle.trail.length) * 0.3;
          ctx.beginPath();
          ctx.moveTo(particle.trail[i - 1].x, particle.trail[i - 1].y);
          ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
          ctx.strokeStyle = `rgba(234, 88, 12, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    });
    
    // Draw score vectors
    const drawVector = (particle, fx, fy, color, scale = 25, lineWidth = 1.5, dash = []) => {
      if (Math.abs(fx) < 0.001 && Math.abs(fy) < 0.001) return;
      
      const length = Math.sqrt(fx * fx + fy * fy);
      const nx = (fx / length) * scale;
      const ny = (fy / length) * scale;
      
      ctx.beginPath();
      ctx.setLineDash(dash);
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x + nx, particle.y + ny);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      
      // Arrowhead
      const arrowSize = 5;
      const angle = Math.atan2(ny, nx);
      ctx.beginPath();
      ctx.moveTo(particle.x + nx, particle.y + ny);
      ctx.lineTo(
        particle.x + nx - arrowSize * Math.cos(angle - Math.PI / 6),
        particle.y + ny - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        particle.x + nx - arrowSize * Math.cos(angle + Math.PI / 6),
        particle.y + ny - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.setLineDash([]);
    };
    
    // Draw vectors for selected particle
    const selected = particles[selectedParticle];
    if (selected && selected.forces) {
      drawVector(selected, selected.forces.text?.x || 0, selected.forces.text?.y || 0, '#2563eb', 32, 1.5);
      drawVector(selected, selected.forces.camera?.x || 0, selected.forces.camera?.y || 0, '#7c3aed', 32, 1.5);
      drawVector(selected, selected.forces.depth?.x || 0, selected.forces.depth?.y || 0, '#db2777', 32, 1.5);
      drawVector(selected, selected.forces.context?.x || 0, selected.forces.context?.y || 0, '#059669', 32, 1.5);
      drawVector(selected, selected.forces.repulsion?.x || 0, selected.forces.repulsion?.y || 0, '#ea580c', 32, 1.5);
      drawVector(selected, selected.forces.total?.x || 0, selected.forces.total?.y || 0, '#ea580c', 48, 1.5, [4, 4]);
    }
    
    // Draw particles
    particles.forEach((particle, idx) => {
      const isSelected = idx === selectedParticle;
      
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(234, 88, 12, 0.2)';
        ctx.fill();
      }
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#ea580c' : '#f97316';
      ctx.fill();
      
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.stroke();
    });
    
  }, [particles, step, selectedParticle]);
  
  const progress = step / 300;
  const annealing = Math.max(0.02, 1 - progress * 1.2);
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl shadow-xl">
      {/* <div className="text-center mb-3" /> */}
      {/* Equation */}
      <div className="bg-white rounded-xl p-3 mb-1 border border-gray-200">
        <div className="text-center font-mono text-sm">
          φ(x; t) = 𝔼[k(x',x)
          <span className="text-blue-600">∇ log p*(x'; t)</span> + <span className="text-amber-600">∇k(x',x)</span>]
        </div>
        <div className="text-center text-xs mt-1">
          <span className="text-blue-600">Composed score from experts (hill climbing)</span>; 
          <span className="text-amber-600"> Kernel gradient (diversity)</span>
        </div>
      </div>
      
      
      <div className="relative bg-white rounded-lg p-3 mb-3 shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full rounded cursor-pointer"
          style={{ display: 'block' }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * canvasWidth;
            const y = ((e.clientY - rect.top) / rect.height) * canvasHeight;
            
            let minDist = Infinity;
            let closestIdx = 0;
            particles.forEach((p, idx) => {
              const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
              if (dist < minDist) {
                minDist = dist;
                closestIdx = idx;
              }
            });
            setSelectedParticle(closestIdx);
          }}
        />
        
        {/* HTML Legend Overlay - High Resolution */}
        <div className="absolute top-4 left-4 bg-white/98 rounded-lg shadow-lg border border-gray-200 p-3 backdrop-blur-sm">
          <div className="font-semibold text-gray-800 text-sm mb-2">
            Density Fields
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-2.5 rounded border-2 border-blue-600 bg-blue-100"></div>
              <span className="text-xs text-gray-700">Expert Model p⁽¹⁾</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-2.5 rounded border-2 border-purple-600 bg-purple-100"></div>
              <span className="text-xs text-gray-700">Expert Model p⁽²⁾</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-2.5 rounded border-2 border-pink-600 bg-pink-100"></div>
              <span className="text-xs text-gray-700">Expert Model p⁽³⁾</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-2.5 rounded border-2 border-emerald-600 bg-emerald-100"></div>
              <span className="text-xs text-gray-700">Context Conditional</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Annealing Progress</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-2 font-mono">
          <span>time t = {progress.toFixed(2)}</span>
          <span>noise std σ = {annealing.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Description */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-2.5 mb-3 border border-orange-100">
        <div className="text-xs text-gray-700 leading-snug">
          {progress < 0.35 && (
            <><strong className="text-orange-700">Initialization:</strong> Start from Gaussian prior</>
          )}
          {progress >= 0.35 && progress < 0.7 && (
            <><strong className="text-amber-700">Annealing:</strong> Scores guide particles; ∇k prevents mode collapsing</>
          )}
          {progress >= 0.7 && (
            <><strong className="text-emerald-700">Convergence:</strong> Particles converge to the final target</>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex gap-2 justify-center mb-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={() => {
            setStep(0);
            setIsPlaying(false);
            setParticles(initializeParticles());
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>
      
      <div className="text-center text-[10px] text-gray-500">
        Click particle to see its score vectors. Dashed vector is the sum.
      </div>
    </div>
  );
};

export default VideoSynthesisDemo;