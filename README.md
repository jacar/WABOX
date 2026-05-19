<p align="center">
  <img src="docs/logo/openwa_logo.webp" alt="OpenWA Logo" width="200"/>
</p>

<h1 align="center">OpenWA</h1>
<p align="center">
  <strong>Pasarela API de WhatsApp de Código Abierto (Open Source)</strong>
</p>

<p align="center">
  <a href="#-por-qué-openwa">Por qué OpenWA</a> •
  <a href="#-características">Características</a> •
  <a href="#-inicio-rápido">Inicio Rápido</a> •
  <a href="#-documentación">Docs</a> •
  <a href="#-ejemplos-de-api">API</a> •
  <a href="#-contribuciones">Contribuciones</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.6-blue.svg" alt="Versión"/>
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="Licencia"/>
  <img src="https://img.shields.io/badge/node-22_LTS-brightgreen.svg" alt="Node"/>
  <img src="https://img.shields.io/badge/NestJS-11.x-red.svg" alt="NestJS"/>
  <img src="https://img.shields.io/badge/docker-ready-blue.svg" alt="Docker"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg" alt="TypeScript"/>
</p>

---

## ✨ ¿Por qué OpenWA?

**OpenWA** es una pasarela API de WhatsApp (API Gateway) gratuita y de código abierto, diseñada para desarrolladores que necesitan un control total sobre su infraestructura de mensajería, sin dependencias de proveedores (vendor lock-in) ni tarifas ocultas.

Construido sobre una **arquitectura modular y enchufable**, OpenWA te permite intercambiar motores de bases de datos (SQLite/PostgreSQL), backends de almacenamiento (Local/S3) y capas de caché (Memoria/Redis) sin cambiar una sola línea de código de la aplicación.

|                               |                                                              |
| ----------------------------- | ------------------------------------------------------------ |
| 🔓 **100% Código Abierto**    | Sin tarifas de licencia, sin funciones bloqueadas, acceso total al código fuente. |
| 🏗️ **Arquitectura Enchufable**| Intercambia adaptadores de base de datos, almacenamiento y caché mediante configuración. |
| 🖥️ **Panel de Control Total** | Interfaz moderna en React para la gestión de sesiones, webhooks y claves API. |
| 🔹 **Soporte Multi-Sesión**   | Ejecuta múltiples sesiones de WhatsApp simultáneamente en una sola instancia. |
| 🐳 **Nativo en Docker**       | Listo para producción con cero configuración inicial.       |
| 🔗 **Integración con n8n**    | Nodos comunitarios para la automatización de flujos de trabajo. |

---

## 🎯 Características

### Características Principales

| Característica | Estado | Descripción |
| -------------- | ------ | ----------- |
| API REST       | ✅     | API completa de WhatsApp mediante endpoints HTTP |
| Multi-Sesión   | ✅     | Gestión de múltiples cuentas de WhatsApp |
| Webhooks       | ✅     | Eventos en tiempo real con firma HMAC |
| Panel Web      | ✅     | Interfaz visual de administración |
| Autenticación  | ✅     | Autenticación segura mediante API Key |
| Docs Swagger   | ✅     | Documentación interactiva de la API |

### Mensajería

| Característica       | Estado | Descripción |
| -------------------- | ------ | ----------- |
| Mensajes de Texto    | ✅     | Envío y recepción de mensajes de texto |
| Mensajes Multimedia  | ✅     | Imágenes, videos, documentos y audio |
| Reacciones           | ✅     | Reaccionar a los mensajes con emojis |
| Mensajes Masivos     | ✅     | Envío a múltiples destinatarios |
| Estado del Mensaje   | ✅     | Seguimiento de confirmaciones de entrega y lectura |

### Avanzado

| Característica       | Estado | Descripción |
| -------------------- | ------ | ----------- |
| API de Grupos        | ✅     | Crear, gestionar y enviar mensajes a grupos |
| Canales/Newsletter   | ✅     | Soporte para Canales de WhatsApp |
| Gestión de Etiquetas | ✅     | Organizar chats mediante etiquetas |
| Soporte de Proxy     | ✅     | Configuración de proxy por cada sesión |
| Límite de Peticiones | ✅     | Límites de solicitudes (Rate Limiting) configurables |
| Listas Blancas CIDR  | ✅     | Control de acceso basado en IP |
| Registro de Auditoría| ✅     | Seguimiento e historial de todas las operaciones de la API |

### Infraestructura

| Característica   | Estado | Descripción |
| ---------------- | ------ | ----------- |
| SQLite           | ✅     | Base de datos embebida sin configuración |
| PostgreSQL       | ✅     | Base de datos de nivel de producción |
| Caché con Redis  | ✅     | Caché de rendimiento opcional |
| Almacenamiento S3| ✅     | Almacenamiento multimedia escalable (S3/MinIO) |
| Docker           | ✅     | Despliegue con un solo comando |
| Health Checks    | ✅     | Sondas de estado listas para Kubernetes |
| Migración de Datos| ✅     | Exportación/importación entre diferentes backends |

---

## 🚀 Inicio Rápido

### Opción A: Docker (Recomendado)

```bash
# Clonar e iniciar
git clone [https://github.com/jacar/OpenWA.git](https://github.com/jacar/OpenWA.git)
cd OpenWA
docker compose -f docker-compose.dev.yml up -d

# Acceso
# Panel de Control: http://localhost:2886
# API: http://localhost:2785/api
# Swagger: http://localhost:2785/api/docs
