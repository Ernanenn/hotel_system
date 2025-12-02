import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

/**
 * Hook para implementar infinite scroll
 * 
 * @param options - Opções de configuração
 * @param options.hasMore - Indica se há mais itens para carregar
 * @param options.loading - Indica se está carregando
 * @param options.onLoadMore - Função chamada quando mais itens devem ser carregados
 * @param options.threshold - Distância do final da página para disparar o carregamento (em pixels)
 */
export const useInfiniteScroll = ({
  hasMore,
  loading,
  onLoadMore,
  threshold = 200,
}: UseInfiniteScrollOptions) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading) {
            onLoadMore();
          }
        },
        {
          rootMargin: `${threshold}px`,
        }
      );
      
      if (node) observerRef.current.observe(node);
      elementRef.current = node;
    },
    [hasMore, loading, onLoadMore, threshold]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { lastElementRef };
};

