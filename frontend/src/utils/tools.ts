/** Calculadoras avulsas, acessíveis em /ferramentas/<path>. */
export const TOOLS = [
  { path: 'mostura', label: 'Mostura', icon: '🌾', description: 'Água de mostura, lavagem e capacidade da panela' },
  { path: 'gravidade', label: 'Gravidade', icon: '🧪', description: 'Esperado vs. medido, correção de OG, eficiência, SG ↔ Plato' },
  { path: 'lupulo', label: 'Lúpulo', icon: '🌿', description: 'IBU e ajuste de lúpulo pelo tempo de fervura' },
  { path: 'agua', label: 'Água', icon: '💧', description: 'Sais e ácido ascórbico por perfil' },
  { path: 'estilos', label: 'Estilos', icon: '🏷️', description: 'Guia BJCP e validação de parâmetros' },
] as const

export type ToolPath = (typeof TOOLS)[number]['path']
