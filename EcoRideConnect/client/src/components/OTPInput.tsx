import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  length?: number;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  className?: string;
};

export default function OTPInput({ length = 6, onComplete, disabled, className }: Props) {
  const [values, setValues] = useState<string[]>(Array.from({ length }, () => ""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    const code = values.join("");
    if (code.length === length && !code.includes("")) {
      onComplete?.(code);
    }
  }, [values]);

  const onChange = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    setValues((prev) => {
      const next = [...prev];
      next[idx] = val || "";
      return next;
    });
    if (val && idx < length - 1) inputsRef.current[idx + 1]?.focus();
  };

  const onKeyDown = (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (values[idx]) {
        setValues((prev) => {
          const next = [...prev];
          next[idx] = "";
          return next;
        });
      } else if (idx > 0) {
        inputsRef.current[idx - 1]?.focus();
        setValues((prev) => {
          const next = [...prev];
          next[idx - 1] = "";
          return next;
        });
      }
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    const arr = text.split("").concat(Array.from({ length: Math.max(0, length - text.length) }, () => ""));
    setValues(arr.slice(0, length));
    const nextIndex = Math.min(text.length, length - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  const boxes = useMemo(() => Array.from({ length }, (_, i) => i), [length]);

  return (
    <div className={`flex gap-2 justify-center ${className || ""}`}>
      {boxes.map((idx) => (
        <input
          key={idx}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          className="w-10 h-12 rounded-md border bg-white text-center text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-900 dark:border-gray-700"
          value={values[idx]}
          onChange={onChange(idx)}
          onKeyDown={onKeyDown(idx)}
          onPaste={onPaste}
          maxLength={1}
          disabled={disabled}
          ref={(el) => (inputsRef.current[idx] = el)}
        />
      ))}
    </div>
  );
}
