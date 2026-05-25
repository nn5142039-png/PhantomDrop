import { useEffect, useRef } from 'react';

export default function ParticlesBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationId;
    let particles = [];
    const PARTICLE_COUNT = 60;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.opacitySpeed = (Math.random() - 0.5) * 0.005;
        // Red/orange hues
        this.hue = Math.random() > 0.7 ? 0 : (Math.random() * 30 + 350) % 360;
        this.saturation = 80 + Math.random() * 20;
        this.lightness = 45 + Math.random() * 15;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity += this.opacitySpeed;

        if (this.opacity <= 0.05 || this.opacity >= 0.6) {
          this.opacitySpeed *= -1;
        }

        if (this.x < -10 || this.x > canvas.width + 10 ||
            this.y < -10 || this.y > canvas.height + 10) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.opacity})`;
        ctx.fill();

        // Glow
        if (this.size > 1.2) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.opacity * 0.15})`;
          ctx.fill();
        }
      }
    }

    function init() {
      resize();
      particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const opacity = (1 - dist / 120) * 0.08;
            ctx.strokeStyle = `rgba(255, 45, 45, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      drawConnections();
      animationId = requestAnimationFrame(animate);
    }

    init();
    animate();

    window.addEventListener('resize', () => {
      resize();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas" />;
}
