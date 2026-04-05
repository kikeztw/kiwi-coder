// Theme colors for the terminal UI - Redesigned with better contrast
export const colors = {
  // Backgrounds
  bgPrimary: '#0F172A',      // Azul oscuro principal
  bgSecondary: '#1E293B',    // Fondo de burbujas
  bgUser: '#1E3A5F',         // Burbuja usuario (azul)
  bgAgent: '#1F2937',        // Burbuja agente (gris azulado)
  bgThinking: '#2D1F3F',     // Burbuja thinking (púrpura oscuro)
  
  // Textos
  textPrimary: '#F1F5F9',    // Blanco suave
  textSecondary: '#94A3B8',  // Gris claro
  textMuted: '#64748B',      // Gris medio
  
  // Acentos por rol
  accentUser: '#38BDF8',     // Cyan brillante
  accentAgent: '#34D399',    // Verde menta
  accentThinking: '#A78BFA', // Púrpura thinking
  accentSystem: '#F59E0B',   // Ámbar para system
  accentError: '#EF4444',    // Rojo errores
  accentTool: '#FCD34D',     // Amarillo tools
  
  // Bordes
  borderSubtle: '#334155',   // Borde sutil
  borderUser: '#0EA5E9',     // Borde usuario
  borderAgent: '#10B981',    // Borde agente
  borderThinking: '#8B5CF6', // Borde thinking
  
  // UI elements (legacy compatibility)
  primary: '#00D4AA',
  secondary: '#7B61FF',
  accent: '#FF6B6B',
  border: '#374151',
  background: '#0F172A',
  highlight: '#A855F7',
  
  // Message colors (legacy compatibility)
  user: '#38BDF8',
  agent: '#34D399',
  tool: '#FCD34D',
  system: '#94A3B8',
  error: '#EF4444',
  
  // Status colors
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
};

// Color helpers for Ink
export const getColor = (type: keyof typeof colors): string => colors[type];

// New semantic color helpers for bubble theme
export const bubbleTheme = {
  user: { bg: colors.bgUser, border: colors.borderUser, text: colors.accentUser, icon: '> ' },
  agent: { bg: colors.bgAgent, border: colors.borderAgent, text: colors.accentAgent, icon: '• ' },
  thinking: { bg: colors.bgThinking, border: colors.borderThinking, text: colors.accentThinking, icon: '💭 ' },
  system: { bg: colors.bgSecondary, border: colors.borderSubtle, text: colors.accentSystem, icon: 'ℹ ' },
  tool: { bg: colors.bgSecondary, border: colors.accentTool, text: colors.accentTool, icon: '⚡ ' },
};
