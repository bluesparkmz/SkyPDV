import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LockClosed24Regular, Delete24Regular } from "@fluentui/react-icons";
import { verifyDrawerPin } from "@/lib/drawerPin";
import { toast } from "sonner";

interface DrawerPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DrawerPinDialog({ open, onOpenChange, onSuccess }: DrawerPinDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setError(false);
      setErrorMessage("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError(false);
    setErrorMessage("");

    if (nextPin.length === 4) {
      validatePin(nextPin);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage("");
  };

  const handleClear = () => {
    setPin("");
    setError(false);
    setErrorMessage("");
  };

  const validatePin = (pinToValidate: string) => {
    if (verifyDrawerPin(pinToValidate)) {
      onOpenChange(false);
      setPin("");
      onSuccess();
    } else {
      setError(true);
      setErrorMessage("PIN incorreto. Tente novamente.");
      toast.error("PIN da gaveta incorreto!");
      setTimeout(() => {
        setPin("");
      }, 350);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= "0" && e.key <= "9") {
      handleDigit(e.key);
    } else if (e.key === "Backspace") {
      handleDelete();
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[360px] p-6 text-center"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
            <LockClosed24Regular className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold">Autorização da Gaveta</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Digite o PIN de 4 dígitos para abrir a gaveta de dinheiro
          </DialogDescription>
        </DialogHeader>

        {/* Hidden input — only exists to receive keyboard focus */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={() => {/* handled by onKeyDown on DialogContent */}}
          className="sr-only"
          autoComplete="off"
          readOnly
        />

        {/* PIN Circles Display */}
        <div className={`flex justify-center gap-4 my-4 ${error ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  error
                    ? "border-destructive bg-destructive"
                    : hasDigit
                    ? "border-primary bg-primary scale-110"
                    : "border-muted-foreground/30 bg-transparent"
                }`}
              />
            );
          })}
        </div>

        {errorMessage && (
          <p className="text-xs font-semibold text-destructive mb-2">{errorMessage}</p>
        )}

        {/* Virtual Numeric Keypad for touchscreens */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <Button
              key={num}
              type="button"
              variant="outline"
              onClick={() => handleDigit(num)}
              className="h-12 text-lg font-semibold hover:bg-primary/10 hover:text-primary active:scale-95 transition-all"
            >
              {num}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            className="h-12 text-xs text-muted-foreground hover:text-foreground active:scale-95"
          >
            Limpar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDigit("0")}
            className="h-12 text-lg font-semibold hover:bg-primary/10 hover:text-primary active:scale-95 transition-all"
          >
            0
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            className="h-12 flex items-center justify-center text-muted-foreground hover:text-destructive active:scale-95"
          >
            <Delete24Regular className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
