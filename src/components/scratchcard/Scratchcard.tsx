import { useState, useEffect, useRef } from 'react';

interface BannerSettings {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
}

// Scratch Card Component
export const ScratchCard = ({ code }: { code: string }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scratched, setScratched] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 60;

    ctx.fillStyle = '#c0c0c0'; // Gold scratch layer
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Scratch Here', canvas.width / 2, canvas.height / 2 + 6);

    const handleScratch = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x =
        'touches' in e
          ? e.touches[0].clientX - rect.left
          : (e as MouseEvent).clientX - rect.left;
      const y =
        'touches' in e
          ? e.touches[0].clientY - rect.top
          : (e as MouseEvent).clientY - rect.top;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let cleared = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) cleared++;
      }
      if (cleared > imageData.data.length / 8) {
        setScratched(true);
      }
    };

    const events = ['mousedown', 'touchstart', 'mousemove', 'touchmove'];
    events.forEach((event) => {
      canvas.addEventListener(event, handleScratch);
    });

    return () => {
      events.forEach((event) => {
        canvas.removeEventListener(event, handleScratch);
      });
    };
  }, []);

  return (
    <div className="mt-4">
      {!scratched ? (
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-md cursor-pointer"
          style={{ width: '200px', height: '60px' }}
        />
      ) : (
        <button
          className="bg-green-500 text-white p-3 rounded-lg font-bold text-lg shadow-md"
          style={{ width: '200px', height: '60px' }}
        >
          {code}
        </button>
      )}
    </div>
  );
};

