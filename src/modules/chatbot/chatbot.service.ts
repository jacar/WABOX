import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotState } from './entities/chatbot-state.entity';
import { RESTAURANT_CONFIG, MenuItem, RestaurantConfig } from './menu-config';
import { MessageService } from '../message/message.service';
import { HookManager } from '../../core/hooks';
import { createLogger } from '../../common/services/logger.service';
import * as fs from 'fs';
import * as path from 'path';

interface OrderItemInfo {
  item: MenuItem;
  quantity: number;
}

@Injectable()
export class ChatbotService implements OnModuleInit {
  private readonly logger = createLogger('ChatbotService');
  private restaurantConfig: RestaurantConfig;
  private readonly configPath = path.join(process.cwd(), 'data', 'menu-config.json');

  constructor(
    @InjectRepository(ChatbotState, 'data')
    private readonly chatbotStateRepository: Repository<ChatbotState>,
    private readonly messageService: MessageService,
    private readonly hookManager: HookManager,
  ) {
    this.loadConfig();
  }

  /**
   * Carga la configuración del restaurante desde el archivo JSON local.
   * Si no existe o hay algún error, utiliza la configuración por defecto de menu-config.ts.
   */
  public loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContent = fs.readFileSync(this.configPath, 'utf8');
        this.restaurantConfig = JSON.parse(fileContent);
        this.logger.log('Configuración de menú cargada con éxito desde data/menu-config.json 📂');
      } else {
        this.restaurantConfig = RESTAURANT_CONFIG;
        this.logger.warn('Archivo data/menu-config.json no encontrado. Usando configuración estática.');
      }
    } catch (error) {
      this.logger.error(
        'Error al cargar menu-config.json. Cargando configuración por defecto.',
        error instanceof Error ? error.message : String(error),
      );
      this.restaurantConfig = RESTAURANT_CONFIG;
    }
  }

  /**
   * Retorna la configuración de menú activa.
   */
  public getConfig(): RestaurantConfig {
    return this.restaurantConfig;
  }

  /**
   * Guarda una nueva configuración tanto en el archivo JSON local como en memoria caliente.
   */
  public async updateConfig(newConfig: RestaurantConfig): Promise<void> {
    try {
      // Asegurarse de que el directorio data existe
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Escribir archivo formateado
      fs.writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2), 'utf8');
      
      // Actualizar en memoria caliente
      this.restaurantConfig = newConfig;
      this.logger.log(`Configuración del restaurante "${newConfig.name}" actualizada en tiempo real con éxito ⚡`);
    } catch (error) {
      this.logger.error(
        'Error al actualizar la configuración de menú',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  onModuleInit(): void {
    // Registramos nuestro bot local en el hook 'message:received' de OpenWA
    this.hookManager.register(
      'restaurant-chatbot',
      'message:received',
      async (ctx) => {
        try {
          const message = ctx.data as any;

          // Ignorar mensajes enviados por nosotros mismos (salientes) o mensajes en grupos
          if (!message || message.fromMe || message.from.endsWith('@g.us')) {
            return { continue: true };
          }

          const chatId = message.from;
          const text = (message.body || '').trim();
          const sessionId = ctx.sessionId;

          if (!sessionId) {
            return { continue: true };
          }

          // Procesar mensaje
          const handled = await this.handleIncomingMessage(sessionId, chatId, text);
          if (handled) {
            // El bot manejó y respondió el mensaje.
            // Retornamos continue: true para que se registre en el historial del dashboard
            return { continue: true };
          }
        } catch (error) {
          this.logger.error(
            'Error al procesar el mensaje en el chatbot de restaurante',
            error instanceof Error ? error.message : String(error),
          );
        }

        return { continue: true };
      },
      10, // Prioridad alta para responder rápido antes que otros ganchos
    );

    this.logger.log(`Bot de Restaurante "${this.restaurantConfig.name}" inicializado con éxito 🍔🍕`);
  }

  private async handleIncomingMessage(sessionId: string, chatId: string, text: string): Promise<boolean> {
    const textLower = text.toLowerCase();

    // Obtener o crear estado actual del cliente
    let chatbotState = await this.chatbotStateRepository.findOne({ where: { chatId } });
    if (!chatbotState) {
      chatbotState = this.chatbotStateRepository.create({
        chatId,
        state: 'START',
        sessionName: sessionId,
        metadata: '{}',
      });
      await this.chatbotStateRepository.save(chatbotState);
    }

    // Comandos de escape globales
    if (textLower === 'cancelar' || textLower === 'humano' || textLower === 'salir' || textLower === 'volver') {
      chatbotState.state = 'START';
      chatbotState.metadata = '{}';
      await this.chatbotStateRepository.save(chatbotState);

      await this.messageService.sendText(sessionId, {
        chatId,
        text: `🔄 *Acción cancelada.* Volvimos al menú principal de *${this.restaurantConfig.name}*.\n\nEscribe *Hola* en cualquier momento para ver las opciones disponibles.`,
      });
      return true;
    }

    // Autómata de Estados
    switch (chatbotState.state) {
      case 'START':
        return await this.handleStartState(sessionId, chatId, text, chatbotState);

      case 'ORDER_ITEMS':
        return await this.handleOrderItemsState(sessionId, chatId, text, chatbotState);

      case 'ORDER_ADDRESS':
        return await this.handleOrderAddressState(sessionId, chatId, text, chatbotState);

      case 'ORDER_CONFIRM':
        return await this.handleOrderConfirmState(sessionId, chatId, text, chatbotState);

      default:
        // Si cae en un estado desconocido, reiniciar
        chatbotState.state = 'START';
        chatbotState.metadata = '{}';
        await this.chatbotStateRepository.save(chatbotState);
        return await this.handleStartState(sessionId, chatId, 'hola', chatbotState);
    }
  }

  private async handleStartState(
    sessionId: string,
    chatId: string,
    text: string,
    stateEntity: ChatbotState,
  ): Promise<boolean> {
    const option = text.trim();

    if (option === '1') {
      // Opción 1: Enviar menú/carta
      let menuText = `📖 *MENÚ DE ${this.restaurantConfig.name.toUpperCase()}* 📖\n`;
      menuText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      for (const cat of this.restaurantConfig.menu) {
        menuText += `*${cat.category}*\n`;
        for (const item of cat.items) {
          menuText += `• *${item.name}* - _$${item.price.toLocaleString('es-CO')}_\n`;
          menuText += `  _${item.description}_\n\n`;
        }
        menuText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      }

      menuText += `👉 Puedes ver fotos, ingredientes y armar tu carrito directamente en nuestro *Catálogo de WhatsApp* aquí:\n🔗 ${this.restaurantConfig.catalogUrl}\n\n`;
      menuText += `Escribe *2* para iniciar tu pedido 🛍️ o escríbenos tu duda.`;

      await this.messageService.sendText(sessionId, { chatId, text: menuText });
      return true;
    }

    if (option === '2') {
      // Opción 2: Hacer pedido
      stateEntity.state = 'ORDER_ITEMS';
      await this.chatbotStateRepository.save(stateEntity);

      const reply = `🛒 *¡Excelente elección! Vamos a tomar tu pedido.* 🛒\n\nPor favor, escribe en *un solo mensaje* los platos que deseas ordenar y las cantidades.\n\n*Ejemplo:*\n_2 Hamburguesas Especiales, 1 Papas Rústicas y 2 Coca-Colas._\n\n*(Escribe "cancelar" en cualquier paso para anular el pedido)*`;
      await this.messageService.sendText(sessionId, { chatId, text: reply });
      return true;
    }

    if (option === '3') {
      // Opción 3: Dirección y horarios
      const reply = `📍 *INFORMACIÓN DE ${this.restaurantConfig.name.toUpperCase()}* 📍\n\n` +
        `🏠 *Dirección:* ${this.restaurantConfig.address}\n` +
        `🗺️ *Google Maps:* ${this.restaurantConfig.mapsUrl}\n` +
        `🕒 *Horarios:* ${this.restaurantConfig.hours}\n\n` +
        `Escribe *1* para ver la carta 📖 o *2* para hacer un pedido 🛍️.`;

      await this.messageService.sendText(sessionId, { chatId, text: reply });
      return true;
    }

    // Saludo inicial por defecto (si escribe cualquier otra cosa)
    const welcome = `👋 *¡Hola! Bienvenido a ${this.restaurantConfig.name}* 🍔🍕\n\n` +
      `Soy tu asistente virtual 🤖 y estoy listo para ayudarte de forma rápida y gratuita.\n\n` +
      `Por favor, selecciona una opción escribiendo el número correspondiente:\n\n` +
      `*1* - Ver la Carta / Menú 📖\n` +
      `*2* - Hacer un Pedido a domicilio 🛍️\n` +
      `*3* - Ver Horarios y Ubicación 📍\n\n` +
      `_Escribe *cancelar* en cualquier momento para hablar con un humano._`;

    await this.messageService.sendText(sessionId, { chatId, text: welcome });
    return true;
  }

  private async handleOrderItemsState(
    sessionId: string,
    chatId: string,
    text: string,
    stateEntity: ChatbotState,
  ): Promise<boolean> {
    if (!text) {
      await this.messageService.sendText(sessionId, {
        chatId,
        text: 'Por favor, escribe lo que deseas ordenar. O escribe "cancelar" para anular.',
      });
      return true;
    }

    // Guardar los platos escritos por el cliente en la metadata
    const metadata = { itemsText: text };
    stateEntity.metadata = JSON.stringify(metadata);
    stateEntity.state = 'ORDER_ADDRESS';
    await this.chatbotStateRepository.save(stateEntity);

    const reply = `📍 *¡Excelente! He anotado tus platos.* 📝\n\nAhora, por favor escribe la **dirección física exacta** a donde enviaremos tu pedido.\n\n*(Ejemplo: Calle 45 # 12-34, Apto 302, Edificio Los Girasoles, Barrio El Poblado)*`;
    await this.messageService.sendText(sessionId, { chatId, text: reply });
    return true;
  }

  private async handleOrderAddressState(
    sessionId: string,
    chatId: string,
    text: string,
    stateEntity: ChatbotState,
  ): Promise<boolean> {
    if (!text) {
      await this.messageService.sendText(sessionId, {
        chatId,
        text: 'Por favor, escribe tu dirección de entrega exacta para continuar.',
      });
      return true;
    }

    // Recuperar metadata y guardar dirección
    const metadata = JSON.parse(stateEntity.metadata);
    metadata.address = text;

    // Calcular cotización simulada basada en los items
    const parsedOrder = this.parseDishesFromText(metadata.itemsText);
    let total = 0;
    let itemsSummary = '';

    if (parsedOrder.length > 0) {
      itemsSummary = parsedOrder
        .map((o) => {
          const subtotal = o.item.price * o.quantity;
          total += subtotal;
          return `• ${o.quantity}x *${o.item.name}* (_$${subtotal.toLocaleString('es-CO')}_)`;
        })
        .join('\n');
    } else {
      // Si no pudimos parsear platos exactos, mostramos el texto literal y estimamos un valor base
      itemsSummary = `• ${metadata.itemsText}`;
      total = 0; // Se definirá al entregar
    }

    metadata.total = total;
    metadata.itemsSummary = itemsSummary;

    stateEntity.metadata = JSON.stringify(metadata);
    stateEntity.state = 'ORDER_CONFIRM';
    await this.chatbotStateRepository.save(stateEntity);

    let summaryMessage = `📝 *RESUMEN DE TU COMANDA* 📝\n`;
    summaryMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    summaryMessage += `🛒 *Detalle de tu orden:*\n${itemsSummary}\n\n`;
    summaryMessage += `📍 *Dirección de envío:*\n_${text}_\n\n`;
    if (total > 0) {
      summaryMessage += `💰 *Valor aproximado platos:* *$${total.toLocaleString('es-CO')} COP*\n`;
      summaryMessage += `🛵 _(El costo de domicilio se calcula según tu zona al entregar)_\n\n`;
    } else {
      summaryMessage += `💰 *Valor de platos:* _A confirmar por el restaurante_\n\n`;
    }
    summaryMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    summaryMessage += `¿La información es correcta? Escribe *SÍ* para enviar a la cocina y despachar, o *NO* para empezar de nuevo.`;

    await this.messageService.sendText(sessionId, { chatId, text: summaryMessage });
    return true;
  }

  private async handleOrderConfirmState(
    sessionId: string,
    chatId: string,
    text: string,
    stateEntity: ChatbotState,
  ): Promise<boolean> {
    const textClean = text.trim().toLowerCase();

    if (textClean === 'si' || textClean === 'sí' || textClean === 'confirmar' || textClean === 's') {
      const metadata = JSON.parse(stateEntity.metadata);

      // Limpiar estado
      stateEntity.state = 'START';
      stateEntity.metadata = '{}';
      await this.chatbotStateRepository.save(stateEntity);

      let finalReply = `🍳🔥 *¡Felicidades! Tu pedido ha sido CONFIRMADO.* 🍳🔥\n\n`;
      finalReply += `La cocina de *${this.restaurantConfig.name}* ya ha empezado a preparar tu orden. 👨‍🍳\n\n`;
      finalReply += `📍 *Dirección:* _${metadata.address}_\n`;
      if (metadata.total > 0) {
        finalReply += `💰 *Subtotal:* _$${metadata.total.toLocaleString('es-CO')} COP_\n`;
      }
      finalReply += `⏰ *Tiempo estimado:* _35 a 50 minutos._\n\n`;
      finalReply += `¡Muchas gracias por tu compra! Escribe *Hola* cuando gustes para un nuevo pedido. 💖`;

      await this.messageService.sendText(sessionId, { chatId, text: finalReply });

      // Opcional: Loguear en la consola del servidor con la comanda para el cocinero
      this.logger.log(
        `🚨 NUEVO PEDIDO CONFIRMADO por WhatsApp de ${chatId}:\n` +
          `----------------------------------------------\n` +
          `ORDEN:\n${metadata.itemsSummary}\n` +
          `DIRECCIÓN: ${metadata.address}\n` +
          `TOTAL PLATOS: $${metadata.total.toLocaleString('es-CO')} COP\n` +
          `----------------------------------------------`,
      );

      return true;
    }

    if (textClean === 'no' || textClean === 'n') {
      stateEntity.state = 'START';
      stateEntity.metadata = '{}';
      await this.chatbotStateRepository.save(stateEntity);

      await this.messageService.sendText(sessionId, {
        chatId,
        text: '❌ *Pedido descartado.* Volvimos al menú de inicio. Escribe *Hola* para volver a ver las opciones.',
      });
      return true;
    }

    // Respuesta ante inputs inválidos en la confirmación
    await this.messageService.sendText(sessionId, {
      chatId,
      text: 'Por favor, responde *SÍ* si los datos del pedido son correctos, o *NO* si deseas cancelarlo.',
    });
    return true;
  }

  /**
   * Helper ultra inteligente para parsear platos y cantidades del texto libre del usuario
   */
  private parseDishesFromText(userText: string): OrderItemInfo[] {
    const orderItems: OrderItemInfo[] = [];
    const textLower = userText.toLowerCase();

    // Recorremos todas las categorías y platos de la carta
    for (const category of this.restaurantConfig.menu) {
      for (const item of category.items) {
        const dishNameLower = item.name.toLowerCase();

        // Buscar palabras clave específicas para evitar fallos de coincidencia parcial
        // Ej: si el nombre es "Hamburguesa Clásica", buscamos "clásica" o "clasica"
        const keywords = this.getKeywordsForDish(dishNameLower);
        let matched = false;

        for (const kw of keywords) {
          if (textLower.includes(kw)) {
            matched = true;
            break;
          }
        }

        if (matched) {
          // Intentar deducir la cantidad buscando un número cerca del plato en el texto
          const quantity = this.deduceQuantity(textLower, keywords[0]);
          orderItems.push({
            item,
            quantity,
          });
        }
      }
    }

    return orderItems;
  }

  private getKeywordsForDish(name: string): string[] {
    if (name.includes('hamburguesa clásica')) return ['clásica', 'clasica', 'hamburguesa clasica'];
    if (name.includes('hamburguesa especial')) return ['especial', 'hamburguesa especial'];
    if (name.includes('doble carne')) return ['doble', 'doble carne'];
    if (name.includes('pepperoni')) return ['pepperoni', 'peperoni'];
    if (name.includes('hawaiana')) return ['hawaiana', 'hawayana'];
    if (name.includes('suprema')) return ['suprema'];
    if (name.includes('papas fritas')) return ['fritas', 'papas fritas', 'francesa'];
    if (name.includes('papas rústicas')) return ['rústicas', 'rusticas'];
    if (name.includes('coca-cola')) return ['coca', 'coca-cola', 'gaseosa'];
    if (name.includes('jugo natural')) return ['jugo', 'jugos'];
    return [name];
  }

  private deduceQuantity(text: string, keyword: string): number {
    const index = text.indexOf(keyword);
    if (index === -1) return 1;

    // Tomamos la porción de texto justo antes de la palabra clave (hasta 10 caracteres antes)
    const start = Math.max(0, index - 10);
    const beforeText = text.substring(start, index).trim();

    // Buscar números representados en dígitos (1, 2, 3...)
    const digitMatch = beforeText.match(/(\d+)\s*$/);
    if (digitMatch) {
      return parseInt(digitMatch[1], 10);
    }

    // Buscar números representados en palabras comunes en español
    if (beforeText.endsWith('un') || beforeText.endsWith('uno') || beforeText.endsWith('una')) return 1;
    if (beforeText.endsWith('dos')) return 2;
    if (beforeText.endsWith('tres')) return 3;
    if (beforeText.endsWith('cuatro')) return 4;
    if (beforeText.endsWith('cinco')) return 5;

    return 1; // Cantidad por defecto si no se encuentra
  }
}
