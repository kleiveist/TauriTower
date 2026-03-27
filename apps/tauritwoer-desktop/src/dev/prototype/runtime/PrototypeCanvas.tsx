import { useEffect, useRef } from "react";
import gameIconUrl from "../../../assets/game-icon.png";
import { createPrototypeController } from "./controller";

export function PrototypeCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const controller = createPrototypeController({
      canvas,
      seed: 20260327,
      iconSrc: gameIconUrl,
    });

    const resizeCanvas = (): void => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const pixelWidth = Math.max(1, Math.floor(rect.width * dpr));
      const pixelHeight = Math.max(1, Math.floor(rect.height * dpr));
      controller.resize(pixelWidth, pixelHeight);
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    controller.start();
    resizeObserver.observe(canvas);
    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      resizeObserver.disconnect();
      controller.stop();
    };
  }, []);

  return (
    <section className="prototype-app-shell" aria-label="TauriTwoer tower defense prototype">
      <canvas className="prototype-canvas" ref={canvasRef} />
    </section>
  );
}
