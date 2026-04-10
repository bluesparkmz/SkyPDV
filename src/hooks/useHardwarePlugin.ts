import { useState, useEffect } from "react";
import { getHardwarePlugin, connectHardwarePlugin } from "@/lib/hardwarePlugin";

export function useHardwarePlugin() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const plugin = getHardwarePlugin();

    const handleConnected = () => {
      setIsConnected(true);
      setIsConnecting(false);
      console.log("Hardware plugin conectado");
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      console.log("Hardware plugin desconectado");
    };

    const handleError = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    checkConnection();

    plugin.on("connected", handleConnected);
    plugin.on("disconnected", handleDisconnected);
    plugin.on("error", handleError);

    return () => {
      plugin.off("connected", handleConnected);
      plugin.off("disconnected", handleDisconnected);
      plugin.off("error", handleError);
    };
  }, []);

  const checkConnection = async () => {
    const plugin = getHardwarePlugin();
    if (!plugin.isConnected()) {
      setIsConnecting(true);
      try {
        await connectHardwarePlugin();
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      } finally {
        setIsConnecting(false);
      }
    } else {
      setIsConnected(true);
    }
  };

  const printReceipt = async (content: string) => {
    const plugin = getHardwarePlugin();
    if (!plugin.isConnected()) {
      setIsConnecting(true);
      try {
        await connectHardwarePlugin();
        setIsConnected(true);
      } catch {
        setIsConnected(false);
        return { success: false, error: "Nao conectado ao plugin" };
      } finally {
        setIsConnecting(false);
      }
    }

    try {
      const result = await plugin.printReceipt(content);
      if (!result.success) {
        console.error("Erro ao imprimir:", result.error);
      }
      return result;
    } catch (error: any) {
      console.error("Erro ao imprimir:", error.message);
      return { success: false, error: error.message };
    }
  };

  const openCashDrawer = async (port?: string) => {
    const plugin = getHardwarePlugin();
    if (!plugin.isConnected()) {
      try {
        await connectHardwarePlugin();
        setIsConnected(true);
      } catch {
        return { success: false, error: "Nao conectado ao plugin" };
      }
    }

    try {
      const result = await plugin.openCashDrawer(port);
      if (!result.success) {
        console.error("Gaveta nao disponivel:", result.error);
      }
      return result;
    } catch (error: any) {
      console.error("Erro ao abrir gaveta:", error.message);
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
