import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  RotateCcw,
  FastForward,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserSummaryData } from '../types/github';

interface StickmanFightModalProps {
  isOpen: boolean;
  onClose: () => void;
  userA: UserSummaryData;
  userB: UserSummaryData;
  winsA: number;
  winsB: number;
}

type FightPhase =
  | 'intro'
  | 'dash_clash'
  | 'combo_flurry'
  | 'star_barrage'
  | 'finisher_charge'
  | 'hyper_beam'
  | 'ko'
  | 'victory';

// Procedural Retro Arcade Web Audio Synthesizer
class RetroArcadeAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playWhoosh() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }

  playClash() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // Metallic sword strike
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  }

  playPunch() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  playEnergyCharge() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } catch {}
  }

  playHyperBeam() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // Powerful futuristic laser burst
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }

  playKO() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // Low heavy sub-bass explosion
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.65, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }

  playVictory() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + idx * 0.1;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {}
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape?: 'spark' | 'ring' | 'star';
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  scale: number;
}

export const StickmanFightModal: React.FC<StickmanFightModalProps> = ({
  isOpen,
  onClose,
  userA,
  userB,
  winsA,
  winsB,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<RetroArcadeAudio>(new RetroArcadeAudio());

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2>(1);
  const [phase, setPhase] = useState<FightPhase>('intro');
  const [hpA, setHpA] = useState(100);
  const [hpB, setHpB] = useState(100);
  const [damageLagA, setDamageLagA] = useState(100);
  const [damageLagB, setDamageLagB] = useState(100);
  const [actionText, setActionText] = useState('ROUND 1: FIGHT!');
  const [screenShake, setScreenShake] = useState(0);

  const startTimeRef = useRef<number>(Date.now());
  const fightTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const lastSoundEventRef = useRef<Record<string, number>>({});

  const winner: 'A' | 'B' | 'TIE' =
    winsA > winsB ? 'A' : winsB > winsA ? 'B' : 'TIE';

  const triggerSound = useCallback((type: 'whoosh' | 'clash' | 'punch' | 'energy' | 'beam' | 'ko' | 'victory') => {
    const now = Date.now();
    const last = lastSoundEventRef.current[type] || 0;
    if (now - last < 80) return; // Throttle duplicate sounds
    lastSoundEventRef.current[type] = now;

    const audio = audioRef.current;
    if (type === 'whoosh') audio.playWhoosh();
    else if (type === 'clash') audio.playClash();
    else if (type === 'punch') audio.playPunch();
    else if (type === 'energy') audio.playEnergyCharge();
    else if (type === 'beam') audio.playHyperBeam();
    else if (type === 'ko') audio.playKO();
    else if (type === 'victory') audio.playVictory();
  }, []);

  const addParticles = useCallback(
    (x: number, y: number, count: number, color: string, speed = 4, shape: 'spark' | 'ring' | 'star' = 'spark') => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s = Math.random() * speed + 1;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s - (shape === 'spark' ? 1.5 : 0),
          life: 1,
          maxLife: 20 + Math.random() * 25,
          color,
          size: Math.random() * 3 + 2,
          shape,
        });
      }
    },
    []
  );

  const addFloatingText = useCallback((text: string, x: number, y: number, color: string) => {
    floatingTextsRef.current.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      life: 1,
      scale: 1.4,
    });
  }, []);

  const resetFight = useCallback(() => {
    setPhase('intro');
    setHpA(100);
    setHpB(100);
    setDamageLagA(100);
    setDamageLagB(100);
    setActionText('ROUND 1: FIGHT!');
    setScreenShake(0);
    particlesRef.current = [];
    floatingTextsRef.current = [];
    startTimeRef.current = Date.now();
    fightTimeRef.current = 0;
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      audioRef.current.enabled = !prev;
      return !prev;
    });
  };

  const handleSkipToFinisher = () => {
    // Jump directly to finisher phase (6.5s in normal time)
    const targetSimulated = 6.4;
    startTimeRef.current = Date.now() - (targetSimulated / speedMultiplier) * 1000;
  };

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    if (!isOpen) return;
    resetFight();

    let hasTriggeredKO = false;
    let hasTriggeredVictory = false;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const now = Date.now();
      const rawElapsed = (now - startTimeRef.current) / 1000;
      const t = rawElapsed * speedMultiplier;
      fightTimeRef.current = t;

      // Arena Canvas Geometry
      const width = canvas.width;
      const height = canvas.height;
      const groundY = height * 0.76;

      // Determine Phase and Combat Stats
      let currentPhase: FightPhase = 'intro';
      let text = 'READY... FIGHT!';
      let targetHpA = 100;
      let targetHpB = 100;

      // 0.0s - 1.2s: INTRO DASH
      if (t < 1.2) {
        currentPhase = 'intro';
        text = t < 0.6 ? 'READY...' : 'ROUND 1: FIGHT!';
        targetHpA = 100;
        targetHpB = 100;
      }
      // 1.2s - 2.8s: DASH & SWORD CLASH
      else if (t < 2.8) {
        currentPhase = 'dash_clash';
        text = 'CYBER BLADE CLASH!';
        if (winner === 'A') {
          targetHpA = 92;
          targetHpB = Math.max(75, 100 - (t - 1.2) * 15);
        } else if (winner === 'B') {
          targetHpB = 92;
          targetHpA = Math.max(75, 100 - (t - 1.2) * 15);
        } else {
          targetHpA = 85;
          targetHpB = 85;
        }
      }
      // 2.8s - 4.8s: RAPID COMMIT COMBO
      else if (t < 4.8) {
        currentPhase = 'combo_flurry';
        text = 'COMMIT MULTI-STRIKE x8!';
        if (winner === 'A') {
          targetHpA = 80;
          targetHpB = Math.max(45, 75 - (t - 2.8) * 15);
        } else if (winner === 'B') {
          targetHpB = 80;
          targetHpA = Math.max(45, 75 - (t - 2.8) * 15);
        } else {
          targetHpA = 60;
          targetHpB = 60;
        }
      }
      // 4.8s - 6.5s: STAR SHURIKENS & COUNTER
      else if (t < 6.5) {
        currentPhase = 'star_barrage';
        text = 'STAR BARRAGE & TELEPORT!';
        if (winner === 'A') {
          targetHpA = 70;
          targetHpB = Math.max(25, 45 - (t - 4.8) * 12);
        } else if (winner === 'B') {
          targetHpB = 70;
          targetHpA = Math.max(25, 45 - (t - 4.8) * 12);
        } else {
          targetHpA = 35;
          targetHpB = 35;
        }
      }
      // 6.5s - 7.5s: CHARGE HYPER BEAM
      else if (t < 7.5) {
        currentPhase = 'finisher_charge';
        text = 'SPECIAL: GIT PUSH --FORCE!';
        if (winner === 'A') targetHpB = 25;
        else if (winner === 'B') targetHpA = 25;
      }
      // 7.5s - 8.8s: UNLEASH HYPER BEAM
      else if (t < 8.8) {
        currentPhase = 'hyper_beam';
        text = 'SUPER FINISHER: OBLITERATION!';
        if (winner === 'A') targetHpB = Math.max(0, 25 - (t - 7.5) * 20);
        else if (winner === 'B') targetHpA = Math.max(0, 25 - (t - 7.5) * 20);
        else {
          targetHpA = 0;
          targetHpB = 0;
        }
      }
      // 8.8s - 10.2s: K.O. MOMENT
      else if (t < 10.2) {
        currentPhase = 'ko';
        text = winner === 'TIE' ? 'DOUBLE K.O.!' : 'CRITICAL K.O.!';
        if (winner === 'A') targetHpB = 0;
        else if (winner === 'B') targetHpA = 0;
        else {
          targetHpA = 0;
          targetHpB = 0;
        }

        if (!hasTriggeredKO) {
          hasTriggeredKO = true;
          triggerSound('ko');
          setScreenShake(14);
          addFloatingText('K.O.!', width / 2, height * 0.35, '#fbbf24');
        }
      }
      // 10.2s+: VICTORY POSE
      else {
        currentPhase = 'victory';
        text =
          winner === 'A'
            ? `@${userA.user.login} VICTORIOUS!`
            : winner === 'B'
            ? `@${userB.user.login} VICTORIOUS!`
            : 'STALEMATE DRAW!';

        if (!hasTriggeredVictory) {
          hasTriggeredVictory = true;
          triggerSound('victory');
          confetti({
            particleCount: 75,
            spread: 80,
            origin: { y: 0.55 },
          });
        }
      }

      setPhase(currentPhase);
      setActionText(text);
      setHpA(targetHpA);
      setHpB(targetHpB);

      // Smooth lag bar decay
      setDamageLagA((prev) => Math.max(targetHpA, prev - 0.4));
      setDamageLagB((prev) => Math.max(targetHpB, prev - 0.4));

      // Calculate Fighter Coordinates & Poses
      let xA = width * 0.28;
      let yA = groundY;
      let xB = width * 0.72;
      let yB = groundY;
      let swordAngleA = 0;
      let swordAngleB = 0;
      let armAngleA = 0;
      let armAngleB = 0;
      let legAngleA = 0;
      let legAngleB = 0;

      // Shake attenuation
      setScreenShake((prev) => Math.max(0, prev * 0.9));

      ctx.save();

      // Screen Shake Transform
      if (screenShake > 0.5) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Draw Deep Cyber Battle Stage
      ctx.fillStyle = '#070a12';
      ctx.fillRect(0, 0, width, height);

      // Cyber Grid Stage Background
      const grad = ctx.createLinearGradient(0, groundY - 120, 0, groundY);
      grad.addColorStop(0, 'rgba(41, 151, 255, 0.0)');
      grad.addColorStop(1, 'rgba(41, 151, 255, 0.12)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, groundY - 120, width, 120);

      // Neon Horizon Line
      ctx.strokeStyle = 'rgba(41, 151, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      // Floor Grid Lines
      ctx.strokeStyle = 'rgba(41, 151, 255, 0.15)';
      ctx.lineWidth = 1;
      const numLines = 14;
      for (let i = 0; i <= numLines; i++) {
        const xPos = (width / numLines) * i;
        ctx.beginPath();
        ctx.moveTo(xPos, groundY);
        ctx.lineTo(xPos + (i - numLines / 2) * 18, height);
        ctx.stroke();
      }

      // Stage Spotlights
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const spotA = ctx.createRadialGradient(xA, groundY, 10, xA, groundY, 140);
      spotA.addColorStop(0, 'rgba(41, 151, 255, 0.25)');
      spotA.addColorStop(1, 'rgba(41, 151, 255, 0)');
      ctx.fillStyle = spotA;
      ctx.beginPath();
      ctx.ellipse(xA, groundY + 6, 90, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      const spotB = ctx.createRadialGradient(xB, groundY, 10, xB, groundY, 140);
      spotB.addColorStop(0, 'rgba(192, 132, 252, 0.25)');
      spotB.addColorStop(1, 'rgba(192, 132, 252, 0)');
      ctx.fillStyle = spotB;
      ctx.beginPath();
      ctx.ellipse(xB, groundY + 6, 90, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Animate Movement Based On Phase
      if (currentPhase === 'intro') {
        xA = width * 0.15 + (width * 0.18) * Math.min(1, t / 1.0);
        xB = width * 0.85 - (width * 0.18) * Math.min(1, t / 1.0);
        legAngleA = Math.sin(t * 16) * 0.45;
        legAngleB = Math.sin(t * 16) * 0.45;
        swordAngleA = -0.3;
        swordAngleB = 0.3;
      } else if (currentPhase === 'dash_clash') {
        // High speed leap and weapons clash in the center
        const cycle = Math.sin((t - 1.2) * 8);
        xA = width * 0.44 + cycle * 25;
        xB = width * 0.56 - cycle * 25;
        yA = groundY - Math.abs(Math.sin((t - 1.2) * 4)) * 32;
        yB = groundY - Math.abs(Math.sin((t - 1.2) * 4)) * 32;
        swordAngleA = 1.1;
        swordAngleB = -1.1;
        armAngleA = 0.6;
        armAngleB = -0.6;

        // Sound & Clash Sparks
        if (Math.abs(cycle) < 0.15) {
          triggerSound('clash');
          addParticles((xA + xB) / 2, yA - 30, 3, '#ffffff', 5, 'spark');
          addParticles((xA + xB) / 2, yA - 30, 2, '#38bdf8', 4, 'ring');
          setScreenShake(4);
        }
      } else if (currentPhase === 'combo_flurry') {
        // Blinding-fast boxing / sword flurry
        const flurrySpeed = 22;
        const offset = Math.sin(t * flurrySpeed);
        xA = width * 0.42 + offset * 12;
        xB = width * 0.58 - offset * 12;
        armAngleA = Math.sin(t * 30) * 1.2;
        armAngleB = Math.cos(t * 30) * 1.2;
        swordAngleA = Math.sin(t * 26) * 0.8;
        swordAngleB = -Math.cos(t * 26) * 0.8;

        if (Math.random() < 0.35) {
          triggerSound('punch');
          const hitX = (xA + xB) / 2 + (Math.random() - 0.5) * 20;
          const hitY = groundY - 35 + (Math.random() - 0.5) * 30;
          addParticles(hitX, hitY, 4, winner === 'A' ? '#38bdf8' : '#c084fc', 4);
          setScreenShake(3);
        }
      } else if (currentPhase === 'star_barrage') {
        // Flash step teleportation & flying star shurikens
        const cycle = Math.sin((t - 4.8) * 3.5);
        if (winner === 'A') {
          xA = width * 0.36;
          xB = width * 0.68 + cycle * 15;
          armAngleA = 0.8;
          // Spawn flying gold star shurikens from A to B
          if (Math.random() < 0.25) {
            triggerSound('whoosh');
            addParticles(xA + 20, groundY - 40, 1, '#fbbf24', 9, 'star');
            addFloatingText('STAR CRIT!', xB, groundY - 60, '#fbbf24');
          }
        } else {
          xA = width * 0.32 + cycle * 15;
          xB = width * 0.64;
          armAngleB = -0.8;
          if (Math.random() < 0.25) {
            triggerSound('whoosh');
            addParticles(xB - 20, groundY - 40, 1, '#fbbf24', 9, 'star');
            addFloatingText('STAR CRIT!', xA, groundY - 60, '#fbbf24');
          }
        }
      } else if (currentPhase === 'finisher_charge') {
        // Energy charge pose with aura flames
        triggerSound('energy');
        setScreenShake(2);
        if (winner === 'A') {
          xA = width * 0.28;
          xB = width * 0.72;
          addParticles(xA + 22, groundY - 38, 3, '#38bdf8', 3, 'ring');
        } else {
          xA = width * 0.28;
          xB = width * 0.72;
          addParticles(xB - 22, groundY - 38, 3, '#c084fc', 3, 'ring');
        }
      } else if (currentPhase === 'hyper_beam') {
        triggerSound('beam');
        setScreenShake(9);
        if (winner === 'A') {
          xA = width * 0.24;
          xB = width * 0.78;
          // Massive Hyper Beam from A to B
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const beamGrad = ctx.createLinearGradient(xA + 30, 0, xB, 0);
          beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
          beamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
          beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0.85)');

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.roundRect(xA + 28, groundY - 52, xB - xA - 15, 30, 8);
          ctx.fill();

          // Outer Beam Glow
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.fillRect(xA + 20, groundY - 62, xB - xA + 10, 50);

          // Impact Sparks at target B
          addParticles(xB, groundY - 38, 8, '#ffffff', 8, 'spark');
          addParticles(xB, groundY - 38, 4, '#38bdf8', 6, 'ring');
          ctx.restore();
        } else {
          xA = width * 0.22;
          xB = width * 0.76;
          // Beam from B to A
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const beamGrad = ctx.createLinearGradient(xB - 30, 0, xA, 0);
          beamGrad.addColorStop(0, 'rgba(192, 132, 252, 0.95)');
          beamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
          beamGrad.addColorStop(1, 'rgba(192, 132, 252, 0.85)');

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.roundRect(xA + 10, groundY - 52, xB - xA - 28, 30, 8);
          ctx.fill();

          ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
          ctx.fillRect(xA - 5, groundY - 62, xB - xA + 10, 50);

          addParticles(xA, groundY - 38, 8, '#ffffff', 8, 'spark');
          addParticles(xA, groundY - 38, 4, '#c084fc', 6, 'ring');
          ctx.restore();
        }
      } else {
        // K.O. & Victory Stance
        if (winner === 'A') {
          xA = width * 0.38;
          xB = width * 0.84;
          yB = groundY + 8; // Knocked down
        } else if (winner === 'B') {
          xA = width * 0.16;
          yA = groundY + 8; // Knocked down
          xB = width * 0.62;
        } else {
          xA = width * 0.25;
          xB = width * 0.75;
          yA = groundY + 8;
          yB = groundY + 8;
        }
      }

      // Draw Stickman Function
      const drawStickman = (
        x: number,
        y: number,
        isPlayerA: boolean,
        isKO: boolean,
        isVictory: boolean,
        isCharging: boolean,
        armAngle: number = 0,
        swordAngle: number = 0
      ) => {
        const color = isPlayerA ? '#38bdf8' : '#c084fc';
        const darkColor = isPlayerA ? '#0284c7' : '#9333ea';
        const facing = isPlayerA ? 1 : -1;

        ctx.save();
        ctx.translate(x, y);

        // Burning Energy Aura
        if (isCharging || isVictory) {
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const auraGrad = ctx.createRadialGradient(0, -35, 15, 0, -35, 65);
          auraGrad.addColorStop(0, isPlayerA ? 'rgba(56, 189, 248, 0.45)' : 'rgba(192, 132, 252, 0.45)');
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(0, -35, 65, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (isKO) {
          // Flattened knocked-out stickman pose
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';

          // Body flat on floor
          ctx.beginPath();
          ctx.moveTo(-20 * facing, 0);
          ctx.lineTo(15 * facing, 0);
          ctx.stroke();

          // Head on ground
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(22 * facing, -4, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Limbs splayed
          ctx.beginPath();
          ctx.moveTo(-10 * facing, 0);
          ctx.lineTo(-24 * facing, -12);
          ctx.moveTo(5 * facing, 0);
          ctx.lineTo(14 * facing, -14);
          ctx.stroke();

          // Dizzy stars floating
          ctx.font = '14px sans-serif';
          ctx.fillText('💫', 12 * facing, -24);
          ctx.restore();
          return;
        }

        // Stickman Body Dimensions
        const headR = 10;
        const headY = -52;
        const neckY = -42;
        const hipY = -18;

        // Shadow under feet
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Limbs & Torso Lines
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 3.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Spine
        ctx.beginPath();
        ctx.moveTo(0, neckY);
        ctx.lineTo(0, hipY);
        ctx.stroke();

        // Legs
        if (isVictory) {
          // Confident Stance
          ctx.beginPath();
          ctx.moveTo(0, hipY);
          ctx.lineTo(-14, 0);
          ctx.moveTo(0, hipY);
          ctx.lineTo(14, 0);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, hipY);
          ctx.lineTo(-10 * facing + Math.sin(legAngleA) * 12, 0);
          ctx.moveTo(0, hipY);
          ctx.lineTo(12 * facing - Math.sin(legAngleB) * 12, 0);
          ctx.stroke();
        }

        // Arms & Weapon
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;

        if (isVictory) {
          // Arms raised holding golden champion trophy
          ctx.beginPath();
          ctx.moveTo(0, neckY + 4);
          ctx.lineTo(-16, neckY - 20);
          ctx.moveTo(0, neckY + 4);
          ctx.lineTo(16, neckY - 20);
          ctx.stroke();

          // Golden Trophy Cup
          ctx.fillStyle = '#fbbf24';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, neckY - 28, 9, 0, Math.PI, false);
          ctx.lineTo(0, neckY - 18);
          ctx.fill();
          ctx.stroke();
        } else {
          // Combat Stance Arms
          const armReach = isCharging ? 28 : 20;
          ctx.beginPath();
          ctx.moveTo(0, neckY + 4);
          ctx.lineTo(armReach * facing, neckY - 8 + armAngle * 8);
          ctx.stroke();

          // Energy Blade Katana
          ctx.save();
          ctx.translate(armReach * facing, neckY - 8 + armAngle * 8);
          ctx.rotate((swordAngle || 0.4) * facing);

          // Blade Glow
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(34 * facing, -16);
          ctx.stroke();

          // Neon Edge
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(34 * facing, -16);
          ctx.stroke();
          ctx.restore();
        }

        // Head
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, headY, headR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Headband Ribbon Flying In Wind
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-headR * facing, headY);
        ctx.quadraticCurveTo(
          -22 * facing,
          headY - 6 + Math.sin(t * 12) * 5,
          -34 * facing,
          headY - 12 + Math.cos(t * 14) * 6
        );
        ctx.stroke();

        ctx.restore();
      };

      // Draw Both Fighters
      drawStickman(
        xA,
        yA,
        true,
        targetHpA <= 0,
        currentPhase === 'victory' && winner === 'A',
        currentPhase === 'finisher_charge' && winner === 'A',
        armAngleA,
        swordAngleA
      );

      drawStickman(
        xB,
        yB,
        false,
        targetHpB <= 0,
        currentPhase === 'victory' && winner === 'B',
        currentPhase === 'finisher_charge' && winner === 'B',
        armAngleB,
        swordAngleB
      );

      // 2. Update & Draw Particles (Sparks, Rings, Energy Stars)
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1 / p.maxLife;

        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);

        if (p.shape === 'ring') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (1 - p.life) * 28 + 4, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.shape === 'star') {
          ctx.fillStyle = p.color;
          ctx.font = '16px sans-serif';
          ctx.fillText('★', p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // 3. Floating Combat Hit Text
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= 1.2;
        ft.life -= 0.025;
        ft.scale = Math.max(1, ft.scale * 0.96);

        if (ft.life <= 0) {
          floatingTextsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 8;
        ctx.font = `bold ${Math.round(14 * ft.scale)}px ui-monospace, SFMono-Regular, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore(); // Restore shake transform

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, speedMultiplier, winner, userA, userB, triggerSound, addParticles, addFloatingText, resetFight, screenShake]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0c1017] border border-white/15 shadow-2xl p-4 sm:p-6 overflow-hidden">
        {/* Top Floating Arcade HUD */}
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Fighter 1 (Blue Cyber Ninja) */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img
              src={userA.user.avatar_url}
              alt={userA.user.login}
              className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl border-2 border-[#38bdf8] object-cover shrink-0 shadow-md shadow-blue-500/20"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-[#38bdf8] truncate">@{userA.user.login}</span>
                <span className="text-white text-[10px]">{Math.round(hpA)}%</span>
              </div>
              {/* Dual-layer Health Bar with Damage Lag */}
              <div className="relative h-2.5 sm:h-3 w-full bg-black/70 rounded-full overflow-hidden p-0.5 border border-white/10 mt-0.5">
                {/* Damage Lag Underlayer */}
                <div
                  className="absolute top-0.5 left-0.5 bottom-0.5 bg-rose-500/60 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, damageLagA)}%` }}
                />
                {/* Main Health Bar */}
                <div
                  className="relative h-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] rounded-full transition-all duration-75 shadow-xs shadow-blue-400"
                  style={{ width: `${Math.max(0, hpA)}%` }}
                />
              </div>
            </div>
          </div>

          {/* VS Center Badge & Round Status */}
          <div className="shrink-0 flex flex-col items-center px-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-black shadow-xs font-mono tracking-wider">
                VS
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#8b949e] mt-0.5">
              {Math.max(0, Math.floor(10.5 - fightTimeRef.current))}s
            </span>
          </div>

          {/* Fighter 2 (Purple Void Ronin) */}
          <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-white text-[10px]">{Math.round(hpB)}%</span>
                <span className="text-[#c084fc] truncate">@{userB.user.login}</span>
              </div>
              {/* Dual-layer Health Bar with Damage Lag */}
              <div className="relative h-2.5 sm:h-3 w-full bg-black/70 rounded-full overflow-hidden p-0.5 border border-white/10 mt-0.5 flex justify-end">
                {/* Damage Lag Underlayer */}
                <div
                  className="absolute top-0.5 right-0.5 bottom-0.5 bg-rose-500/60 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, damageLagB)}%` }}
                />
                {/* Main Health Bar */}
                <div
                  className="relative h-full bg-gradient-to-l from-[#9333ea] to-[#c084fc] rounded-full transition-all duration-75 shadow-xs shadow-purple-400"
                  style={{ width: `${Math.max(0, hpB)}%` }}
                />
              </div>
            </div>
            <img
              src={userB.user.avatar_url}
              alt={userB.user.login}
              className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl border-2 border-[#c084fc] object-cover shrink-0 shadow-md shadow-purple-500/20"
            />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8b949e] hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
            aria-label="Close Fight Arena"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 60 FPS HTML5 Dynamic Canvas Screen */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={720}
            height={360}
            className="w-full h-full object-cover select-none"
          />

          {/* Action Text Banner Overlay */}
          <div className="absolute top-3 inset-x-0 flex flex-col items-center pointer-events-none z-20">
            <span
              className={`font-black uppercase tracking-widest text-center px-4 py-1 rounded-full text-xs sm:text-sm shadow-xl transition-all transform duration-200 ${
                phase === 'ko' || phase === 'victory'
                  ? 'bg-amber-400 text-black scale-110 font-mono shadow-amber-400/30'
                  : phase === 'hyper_beam'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-black/70 backdrop-blur-md text-[#38bdf8] border border-white/15'
              }`}
            >
              {actionText}
            </span>
          </div>

          {/* Arcade Sound & Speed Quick Overlays */}
          <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 z-20">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 border border-white/10 text-white text-xs transition-all active:scale-90 cursor-pointer"
              title={soundEnabled ? 'Mute arcade SFX' : 'Enable arcade SFX'}
              aria-label="Toggle Sound Effects"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
            </button>

            <button
              onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : 1))}
              className="px-2 py-1 rounded-lg bg-black/60 hover:bg-black/90 border border-white/10 text-white text-[11px] font-mono font-bold transition-all active:scale-90 cursor-pointer"
              title="Toggle game speed"
            >
              {speedMultiplier}x
            </button>
          </div>
        </div>

        {/* Bottom Arena Footer Controls */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              {winner === 'A'
                ? `@${userA.user.login} Dominates (${winsA} – ${winsB})`
                : winner === 'B'
                ? `@${userB.user.login} Dominates (${winsB} – ${winsA})`
                : `Epic Deadlock Draw (${winsA} – ${winsB})`}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={resetFight}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all active:scale-95 cursor-pointer min-h-[40px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Battle</span>
            </button>

            {phase !== 'victory' && phase !== 'ko' && (
              <button
                onClick={handleSkipToFinisher}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#8b949e] hover:text-white border border-white/10 transition-all active:scale-95 cursor-pointer min-h-[40px]"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Skip to Finisher</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-[#2997ff] hover:bg-[#3ea3ff] text-white transition-all active:scale-95 cursor-pointer min-h-[40px]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
