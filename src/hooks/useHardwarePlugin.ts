import { useState, useEffect } from "react";
import { getHardwarePlugin, connectHardwarePlugin } from "@/lib/hardwarePlugin";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export function useHardwarePlugin() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const plugin = getHardwarePlugin();

    // Handlers para eventos
    const handleConnected = () => {
      setIsConnected(true);
      setIsConnecting(false);
      console.log('✅ Hardware plugin conectado');
      if (!isMobile) {
        toast.success("Plugin de hardware conectado!", { duration: 2000 });
      }
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      console.log('❌ Hardware plugin desconectado');
      if (!isMobile) {
        toast.warning("Plugin de hardware desconectado", { duration: 2000 });
      }
    };

    const handleError = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    // Verificar conexão inicial
    checkConnection();

    // Adicionar listeners
    plugin.on('connected', handleConnected);
    plugin.on('disconnected', handleDisconnected);
    plugin.on('error', handleError);

    return () => {
      // Remover listeners
      plugin.off('connected', handleConnected);
      plugin.off('disconnected', handleDisconnected);
      plugin.off('error', handleError);
    };
  }, [isMobile]);

  const checkConnection = async () => {
    const plugin = getHardwarePlugin();
    if (!plugin.isConnected()) {
      setIsConnecting(true);
      try {
        await connectHardwarePlugin();
        setIsConnected(true);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsConnecting(false);
      }
    } else {
      setIsConnected(true);
    }
  };

  const printReceipt = async (content: string) => {
    if (!isConnected) {
      if (!isMobile) {
        toast.error("Plugin de hardware não conectado");
      }
      return { success: false, error: "Não conectado" };
    }

    try {
      const plugin = getHardwarePlugin();
      const result = await plugin.printReceipt(content);

      if (result.success) {
        if (!isMobile) {
          toast.success("Recibo impresso com sucesso!");
        }
      } else {
        if (!isMobile) {
          toast.error(`Erro ao imprimir: ${result.error}`);
        }
      }

      return result;
    } catch (error: any) {
      if (!isMobile) {
        toast.error(`Erro ao imprimir: ${error.message}`);
      }
      return { success: false, error: error.message };
    }
  };

  const openCashDrawer = async (port?: string) => {
    if (!isConnected) {
      if (!isMobile) {
        toast.error("Plugin de hardware não conectado");
      }
      return { success: false, error: "Não conectado" };
    }

    try {
      const plugin = getHardwarePlugin();
      const result = await plugin.openCashDrawer(port);

      if (result.success) {
        if (!isMobile) {
          toast.success("Gaveta aberta!");
        }
      } else {
        if (!isMobile) {
          toast.warning(`Gaveta não disponível: ${result.error}`);
        }
      }

      return result;
    } catch (error: any) {
      if (!isMobile) {
        toast.error(`Erro ao abrir gaveta: ${error.message}`);
      }
      return { success: false, error: error.message };
    }
  };

  return {
    isConnected,
    isConnecting,
    printReceipt,
    openCashDrawer,
    reconnect: checkConnection,
  };
}

