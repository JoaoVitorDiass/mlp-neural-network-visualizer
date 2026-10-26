import React, { useEffect, useState, useCallback } from "react";
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Chip,
  Tooltip,
} from "@heroui/react";
import { Network, RefreshCw } from "lucide-react";
import { ThemeToggle } from "../common/ThemeToggle";
import { HealthResponse } from "../../types/mlp";

interface NavbarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/mlp/health", {
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        const data: HealthResponse = await response.json();
        setHealth(data);
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch {
      setIsOnline(false);
      setHealth(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <HeroNavbar
      maxWidth="xl"
      isBordered
      className="bg-background/70 backdrop-blur-md border-b border-default-200/50 sticky top-0 z-50"
    >
      <NavbarBrand className="gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20">
          <Network className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <p className="font-bold text-inherit text-base tracking-tight leading-snug">
            MLP Visualizer
          </p>
          <p className="text-xs text-default-500 font-mono">
            Rede Neural Artificial
          </p>
        </div>
      </NavbarBrand>

      <NavbarContent justify="end" className="gap-3">
        {/* Backend Status Badge */}
        <NavbarItem>
          <Tooltip
            content={
              isOnline
                ? `Backend Conectado: ${health?.message || "Pronto"} (${health?.timestamp || "Ativo"})`
                : "Não foi possível conectar ao backend em http://localhost:5134. Verifique se a API ASP.NET Core está em execução."
            }
            placement="bottom"
          >
            <div
              onClick={checkHealth}
              className="cursor-pointer transition-transform active:scale-95"
            >
              {isOnline === null ? (
                <Chip
                  size="sm"
                  variant="flat"
                  color="default"
                  startContent={
                    <RefreshCw className="h-3 w-3 animate-spin text-default-500 ml-1" />
                  }
                >
                  Verificando...
                </Chip>
              ) : isOnline ? (
                <Chip
                  size="sm"
                  variant="flat"
                  color="success"
                  startContent={
                    <span className="relative flex h-2 w-2 ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  }
                  className="font-medium text-xs text-emerald-600 dark:text-emerald-400"
                >
                  API Conectada
                </Chip>
              ) : (
                <Chip
                  size="sm"
                  variant="flat"
                  color="danger"
                  startContent={
                    <span className="relative flex h-2 w-2 ml-1">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  }
                  className="font-medium text-xs text-rose-600 dark:text-rose-400"
                >
                  {isChecking ? "Reverificando..." : "API Desconectada"}
                </Chip>
              )}
            </div>
          </Tooltip>
        </NavbarItem>

        <NavbarItem>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </NavbarItem>
      </NavbarContent>
    </HeroNavbar>
  );
};
