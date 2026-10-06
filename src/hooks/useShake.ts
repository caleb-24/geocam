import { useEffect, useRef, useState } from 'react';
import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';

interface UseShakeOptions {
  threshold?: number;
  cooldownMs?: number;
  /** Cuando es false no se suscribe al acelerómetro (p. ej. pantalla sin foco). */
  enabled?: boolean;
}

interface UseShakeResult {
  isAvailable: boolean | null;
  error: string | null;
}

export function useShake(
  onShake: () => void,
  options: UseShakeOptions = {}
): UseShakeResult {
  const { threshold = 2.5, cooldownMs = 1000, enabled = true } = options;
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastShakeRef = useRef<number>(0);
  const onShakeRef = useRef(onShake);

  useEffect(() => {
    onShakeRef.current = onShake;
  });

  useEffect(() => {
    let mounted = true;

    const checkAvailability = async (): Promise<void> => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (mounted) {
          setIsAvailable(available);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setIsAvailable(false);
          setError(e instanceof Error ? e.message : 'Acelerómetro no disponible');
        }
      }
    };

    void checkAvailability();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAvailable || !enabled) return;

    Accelerometer.setUpdateInterval(100);

    const handleMeasurement = ({ x, y, z }: AccelerometerMeasurement): void => {
      const now = Date.now();
      if (now - lastShakeRef.current < cooldownMs) return;

      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude > threshold) {
        lastShakeRef.current = now;
        onShakeRef.current();
      }
    };

    const subscription = Accelerometer.addListener(handleMeasurement);

    return () => {
      subscription.remove();
    };
  }, [isAvailable, enabled, threshold, cooldownMs]);

  return { isAvailable, error };
}
