# Guía de Diseño Minimalista - Live Platform

Esta guía define el estándar visual estricto para toda la aplicación. Cualquier desviación de estos principios será considerada un error.

## 1. Paleta de Colores
Solo se permiten los siguientes colores. No usar degradados ni colores vibrantes excepto para estados de error muy específicos.

- **Fondo Principal**: `#FAFAFA` (Gris muy claro) o `#FFFFFF` (Blanco)
- **Fondo Secundario (Cards/Inputs)**: `#FFFFFF` (Blanco)
- **Texto Principal**: `#171717` (Negro casi puro)
- **Texto Secundario**: `#737373` (Gris medio)
- **Bordes**: `#E5E5E5` (Gris claro)
- **Acentos (Solo si es necesario)**:
  - Error/Danger: `#EF4444` (Rojo)
  - Success: `#10B981` (Verde) - Usar con moderación

## 2. Tipografía
- Fuente: Inter o Sans-serif del sistema.
- **Títulos**: Negrita (`font-weight: 600/700`), Tracking ajustado (`letter-spacing: -0.025em`).
- **Cuerpo**: Regular (`font-weight: 400`), tamaño `0.875rem` o `1rem`.
- **Botones/Etiquetas**: Uppercase (`text-transform: uppercase`), tamaño pequeño (`0.75rem`), tracking amplio (`letter-spacing: 0.05em`).

## 3. Componentes UI

### Cards / Contenedores
- **Sin Sombras**: `box-shadow: none`.
- **Bordes**: `border: 1px solid #E5E5E5`.
- **Radio**: `border-radius: 8px` (No usar radios muy grandes).

### Botones
- **Estilo Flat**: Sin degradados, sin sombras.
- **Borde**: `1px solid` o `2px solid` (dependiendo de la variante).
- **Variantes**:
  - `Primary`: Fondo Negro, Texto Blanco.
  - `Secondary`: Fondo Blanco, Borde Gris, Texto Negro.
  - `Danger`: Fondo Blanco, Borde Rojo, Texto Rojo (o Fondo Rojo, Texto Blanco).

### Inputs
- Fondo: `#FFFFFF` o `#FAFAFA`.
- Borde: `1px solid #E5E5E5`.
- Focus: Borde Negro (`#171717`) o Gris Oscuro. Sin "glow" azul.

## 4. Layout
- **Espaciado**: Generoso (`padding: 2rem`).
- **Alineación**: Centrada o justificada a la izquierda.
- **Estructura**: Header simple con borde inferior, contenido en contenedor central.

---
**REGLA DE ORO**: Si parece "diseñado" o "decorativo", elimínalo. La funcionalidad y la claridad son la prioridad. Menos es más.
