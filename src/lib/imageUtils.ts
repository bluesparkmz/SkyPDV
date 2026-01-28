const BASE_URL = "https://api.skyvenda.com";

/**
 * Verifica se uma string é um emoji válido (não é URL ou caminho de arquivo)
 */
export function isEmoji(str: string | null | undefined): boolean {
  if (!str) return false;
  
  // URLs completas não são emojis
  if (str.startsWith('http') || str.startsWith('data:')) {
    return false;
  }
  
  // Caminhos de arquivo não são emojis
  if (str.startsWith('/') || str.startsWith('\\')) {
    return false;
  }
  
  // Extensões de imagem indicam que é um arquivo
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(str)) {
    return false;
  }
  
  // Se for muito longo, provavelmente é um caminho quebrado
  if (str.length > 50) {
    return false;
  }
  
  // Se contém barras ou pontos, provavelmente é um caminho
  if (str.includes('/') || str.includes('\\') || (str.includes('.') && str.length > 10)) {
    return false;
  }
  
  return true;
}

/**
 * Converte caminho relativo de imagem para URL completa
 */
export function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  
  // Se já for URL completa ou base64, retorna como está
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  // Se começar com /, adiciona base URL
  if (imagePath.startsWith('/')) {
    return `${BASE_URL}${imagePath}`;
  }
  
  // Remove barras duplicadas e constrói URL
  const cleanPath = imagePath.replace(/^\/+/, '');
  return `${BASE_URL}/${cleanPath}`;
}

/**
 * Obtém o conteúdo a ser exibido (emoji ou URL de imagem)
 */
export function getDisplayContent(
  emoji: string | null | undefined,
  image: string | null | undefined
): { type: 'emoji' | 'image'; value: string } {
  // Prioriza emoji se existir e for válido
  if (emoji && isEmoji(emoji)) {
    return { type: 'emoji', value: emoji };
  }
  
  // Se image existe e é emoji válido
  if (image && isEmoji(image)) {
    return { type: 'emoji', value: image };
  }
  
  // Se image existe e parece ser uma URL/caminho válido
  if (image && !isEmoji(image)) {
    const imageUrl = getImageUrl(image);
    if (imageUrl) {
      return { type: 'image', value: imageUrl };
    }
  }
  
  // Fallback para emoji padrão
  return { type: 'emoji', value: '📦' };
}

