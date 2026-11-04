import React, { useEffect, useState, useCallback } from "react";
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Chip,
  Tooltip,
  Button,
} from "@heroui/react";
import { Network, RefreshCw, BookOpen } from "lucide-react";
import { ThemeToggle } from "../common/ThemeToggle";
import { HealthResponse } from "../../types/mlp";

interface NavbarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenGuideModal?: () => void;
  onOpenGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  onOpenGuideModal,
  onOpenGuide,
}) => {
  const handleOpenGuide = onOpenGuideModal || onOpenGuide;
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
      className="bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-slate-200/80 dark:border-default-200/50 sticky top-0 z-40"
    >
      <NavbarBrand className="gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
          <Network className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-inherit text-base tracking-tight leading-snug">
              MLP Visualizer
            </span>
            <Chip
              size="sm"
              variant="flat"
              color="primary"
              className="text-[10px] h-4 px-1 font-mono hidden sm:inline-flex"
            >
              Edu v1.0
            </Chip>
          </div>
          <span className="text-xs text-default-500 font-medium">
            Estúdio Didático de Rede Neural
          </span>
        </div>
      </NavbarBrand>

      <NavbarContent justify="end" className="gap-2.5">
        {/* Educational Guide Button */}
        {handleOpenGuide && (
          <NavbarItem>
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<BookOpen className="h-4 w-4 text-primary" />}
              onClick={handleOpenGuide}
              className="font-semibold text-xs rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
            >
              <span className="hidden sm:inline">💡 O que é MLP? (Guia)</span>
              <span className="sm:hidden">Guia MLP</span>
            </Button>
          </NavbarItem>
        )}

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
                  className="rounded-xl text-xs"
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
                  className="font-medium text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl"
                >
                  API Online
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
                  className="font-medium text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl"
                >
                  {isChecking ? "Reverificando..." : "API Offline"}
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
