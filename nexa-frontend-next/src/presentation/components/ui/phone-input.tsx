import React, { useEffect, useRef } from "react";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCountryChange?: (country: string) => void;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, onCountryChange, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const itiRef = useRef<any>(null);

    useEffect(() => {
      if (inputRef.current) {
        itiRef.current = intlTelInput(inputRef.current, {
          initialCountry: "br",
          loadUtils: () => import("intl-tel-input/utils"),
          separateDialCode: true,
        });

        inputRef.current.addEventListener("countrychange", () => {
            if (onCountryChange) {
                const countryData = itiRef.current?.getSelectedCountryData();
                onCountryChange(countryData?.iso2 || "br");
            }
        });
      }

      return () => {
        itiRef.current?.destroy();
      };
    }, []);

    // Sync external value changes if needed (handling controlled input might need more care with intl-tel-input)
    
    return (
      <div className="relative">
        <Input
          ref={(node) => {
            // Maintain both refs
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          type="tel"
          className={cn("pl-14", className)} // Adjust padding for flag
          value={value}
          onChange={onChange}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
