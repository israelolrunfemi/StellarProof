"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { walletService } from "@/services/wallet";

const STORAGE_KEY = "freighter_public_key";

interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
  isFreighterInstalled: boolean | null;
  isConnecting: boolean;
  connectError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTx: (xdr: string) => Promise<string>;
  clearError: () => void;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFreighterInstalled, setIsFreighterInstalled] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    walletService.isInstalled().then((installed) => {
      if (!cancelled) setIsFreighterInstalled(installed);
    });
    setMounted(true);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;

    async function autoConnect() {
      const isStoredConnected = typeof window !== "undefined" ? localStorage.getItem("walletConnected") === "true" : false;
      if (!isStoredConnected) return;

      setIsConnecting(true);

      try {
        const installed = await walletService.isInstalled();
        if (!installed) {
          if (!cancelled) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem("walletConnected");
          }
          return;
        }

        const address = await walletService.getAddress();
        if (!cancelled) {
          if (address) {
            setPublicKey(address);
            setIsConnected(true);
            localStorage.setItem(STORAGE_KEY, address);
            localStorage.setItem("walletConnected", "true");
          } else {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem("walletConnected");
          }
        }
      } catch (err) {
        if (!cancelled) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem("walletConnected");
        }
      } finally {
        if (!cancelled) {
          setIsConnecting(false);
        }
      }
    }

    autoConnect();

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  const clearError = useCallback(() => setConnectError(null), []);

  const connect = useCallback(async () => {
    setConnectError(null);
    const installed = await walletService.isInstalled();
    if (!installed) {
      setConnectError("Freighter is not installed.");
      return;
    }
    setIsConnecting(true);
    try {
      const result = await walletService.requestAccess();
      if (result.error) {
        setConnectError(
          result.error.toLowerCase().includes("declined") ? "Connection was declined." : result.error
        );
        return;
      }
      if (result.address) {
        setPublicKey(result.address);
        setIsConnected(true);
        setConnectError(null);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, result.address);
          localStorage.setItem("walletConnected", "true");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect.";
      setConnectError(message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setIsConnected(false);
    setConnectError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("walletConnected");
    }
  }, []);

  const signTx = useCallback(async (_xdr: string): Promise<string> => {
    return "";
  }, []);

  const value: WalletState = {
    publicKey,
    isConnected: mounted && isConnected,
    isFreighterInstalled,
    isConnecting,
    connectError,
    connect,
    disconnect,
    signTx,
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
