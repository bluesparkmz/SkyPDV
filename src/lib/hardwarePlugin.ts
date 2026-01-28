/**
 * Cliente WebSocket para comunicação com o plugin de hardware local
 */
class HardwarePluginClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();

  constructor(port: number = 8000) {
    this.url = `ws://localhost:${port}/ws`;
  }

  /**
   * Conecta ao plugin local
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ Conectado ao plugin de hardware');
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Erro ao processar mensagem:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Erro no WebSocket:', error);
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Conexão com plugin fechada');
          this.emit('disconnected');
          this.ws = null;
          
          // Tentar reconectar
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.reconnectDelay);
          } else {
            console.error('Máximo de tentativas de reconexão atingido');
            this.emit('reconnect_failed');
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Desconecta do plugin
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Envia mensagem para o plugin
   */
  private send(message: any): void {
    if (!this.isConnected()) {
      throw new Error('Não conectado ao plugin de hardware');
    }
    this.ws!.send(JSON.stringify(message));
  }

  /**
   * Processa mensagens recebidas
   */
  private handleMessage(data: any): void {
    const { type, request_id } = data;

    // Resolve requisições pendentes
    if (request_id && this.pendingRequests.has(request_id)) {
      const { resolve, timeout } = this.pendingRequests.get(request_id)!;
      clearTimeout(timeout);
      this.pendingRequests.delete(request_id);
      resolve(data);
      return;
    }

    // Emite eventos
    this.emit(type, data);
  }

  /**
   * Envia requisição e aguarda resposta
   */
  private request(type: string, payload: any = {}, timeout: number = 10000): Promise<any> {
    return new Promise((resolve, reject) => {
      const request_id = `${type}_${Date.now()}_${Math.random()}`;
      
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(request_id);
        reject(new Error(`Timeout na requisição: ${type}`));
      }, timeout);

      this.pendingRequests.set(request_id, { resolve, reject, timeout: timeoutId });

      this.send({
        type,
        request_id,
        ...payload
      });
    });
  }

  /**
   * Imprime um recibo
   */
  async printReceipt(content: string, printerName?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Se uma impressora específica foi fornecida, definir antes de imprimir
      if (printerName) {
        await this.setPrinter(printerName);
      } else {
        // Tentar usar a impressora salva no localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          const savedPrinter = localStorage.getItem("skypdv_selected_printer");
          if (savedPrinter) {
            await this.setPrinter(savedPrinter);
          }
        }
      }
      
      const response = await this.request('print', { content });
      return {
        success: response.success || false,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao imprimir'
      };
    }
  }

  /**
   * Abre a gaveta de dinheiro
   */
  async openCashDrawer(port?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await this.request('open_drawer', port ? { port } : {});
      return {
        success: response.success || false,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao abrir gaveta'
      };
    }
  }

  /**
   * Lista impressoras disponíveis
   */
  async listPrinters(): Promise<{ success: boolean; printers?: any[]; error?: string }> {
    try {
      const response = await this.request('list_printers');
      return {
        success: response.success || false,
        printers: response.printers,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao listar impressoras'
      };
    }
  }

  /**
   * Lista portas seriais disponíveis
   */
  async listSerialPorts(): Promise<{ success: boolean; ports?: any[]; error?: string }> {
    try {
      const response = await this.request('list_ports');
      return {
        success: response.success || false,
        ports: response.ports,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao listar portas seriais'
      };
    }
  }

  /**
   * Define a impressora padrão
   */
  async setPrinter(printerName: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await this.request('set_printer', { printer_name: printerName });
      return {
        success: response.success || false,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao definir impressora'
      };
    }
  }

  /**
   * Adiciona listener para eventos
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove listener
   */
  off(event: string, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emite evento
   */
  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

// Instância singleton
let hardwarePlugin: HardwarePluginClient | null = null;

/**
 * Obtém ou cria a instância do cliente de hardware
 */
export function getHardwarePlugin(port: number = 8000): HardwarePluginClient {
  if (!hardwarePlugin) {
    hardwarePlugin = new HardwarePluginClient(port);
  }
  return hardwarePlugin;
}

/**
 * Conecta ao plugin de hardware
 */
export async function connectHardwarePlugin(port: number = 8000): Promise<HardwarePluginClient> {
  const plugin = getHardwarePlugin(port);
  
  if (!plugin.isConnected()) {
    await plugin.connect();
  }
  
  return plugin;
}

