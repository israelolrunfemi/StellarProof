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

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFreighterInstalled, setIsFreighterInstalled] = useState<boolean>(false);
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
      const address = await walletService.getAddress();
      if (address) {
        setPublicKey(address);
        setIsConnected(true);
        setConnectError(null);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, address);
          localStorage.setItem("walletConnected", "true");
        }
      } else {
        throw new Error("Failed to get address.");
      }
    } catch (err: unknown) {
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

  // Auto-connect effect
  useEffect(() => {
    if (!mounted) return;
    
    const isStoredConnected = typeof window !== "undefined" ? localStorage.getItem("walletConnected") === "true" : false;
    if (!isStoredConnected) return;

    // Check if installed before trying to auto-connect
    walletService.isInstalled().then((installed) => {
      if (installed) {
         walletService.getAddress().then((address) => {
            if (address) {
              setPublicKey(address);
              setIsConnected(true);
            } else {
               // If we can't get address despite stored connection, clear storage
               disconnect();
            }
         }).catch(() => disconnect());
      }
    });
  }, [mounted, disconnect]);

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
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
