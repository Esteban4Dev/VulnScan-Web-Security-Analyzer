# 🛡️ VulnScan

> Analizador de seguridad web que detecta tecnologías y verifica headers HTTP en segundos.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-20+-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Tests](#-tests)
- [Docker](#-docker)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

- 🔍 **Detección de Tecnologías** - Identifica +30 tecnologías (React, Vue, WordPress, Cloudflare, etc.)
- 🛡️ **Análisis de Headers** - Verifica 6 headers de seguridad críticos (CSP, HSTS, X-Frame-Options...)
- 📊 **Puntaje de Seguridad** - Calificación 0-100 con barra visual
- 🌐 **Bilingüe** - Soporte Español/Inglés
- 📄 **Exportación** - Reportes en PDF y JSON
- 🚀 **Rápido** - Análisis en segundos con Puppeteer
- 🐳 **Dockerizado** - Fácil despliegue en cualquier entorno

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | Node.js + Express |
| **Scraping** | Puppeteer (Headless Chromium) |
| **Frontend** | Vanilla JS + CSS Custom |
| **Tests** | Jest + Supertest |
| **Despliegue** | Docker |

---

## 📦 Requisitos

- Node.js 18+ (recomendado 20 LTS)
- npm o yarn
- Docker (opcional)

---

## 🚀 Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/vulnscan.git
cd vulnscan

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
