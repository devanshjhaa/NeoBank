import { useEffect, useCallback, useRef } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void;
          prompt: (momentListener?: (notification: PromptMomentNotification) => void) => void;
          cancel: () => void;
          renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
        };
      };
    };
    __gsi_loaded?: boolean;
    __gsi_loading?: boolean;
  }
}

interface GoogleInitConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  use_fedcm_for_prompt?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonConfig {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with";
  width?: number;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface PromptMomentNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

let gsiErrorFilterInstalled = false;

function installGsiErrorFilter() {
  if (gsiErrorFilterInstalled) return;
  gsiErrorFilterInstalled = true;

  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (msg.includes("[GSI_LOGGER]") && msg.includes("FedCM")) return;
    originalError.apply(console, args);
  };
}

function loadGsiScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.__gsi_loaded && window.google?.accounts) {
      resolve();
      return;
    }

    if (window.__gsi_loading) {
      const check = setInterval(() => {
        if (window.__gsi_loaded && window.google?.accounts) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }

    window.__gsi_loading = true;
    installGsiErrorFilter();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.__gsi_loaded = true;
      window.__gsi_loading = false;
      resolve();
    };
    document.head.appendChild(script);
  });
}

export function useGoogleAuth(onToken: (idToken: string) => void) {
  const callbackRef = useRef(onToken);
  const initializedRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    return () => {
      if (initializedRef.current) {
        window.google?.accounts.id.cancel();
        initializedRef.current = false;
      }
    };
  }, []);

  const triggerGoogleLogin = useCallback(async () => {
    await loadGsiScript();

    if (!initializedRef.current) {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: GoogleCredentialResponse) => {
          callbackRef.current(response.credential);
        },
        use_fedcm_for_prompt: false,
        cancel_on_tap_outside: false,
      });
      initializedRef.current = true;
    }

    window.google?.accounts.id.cancel();
    window.google?.accounts.id.prompt();
  }, []);

  return { triggerGoogleLogin };
}
