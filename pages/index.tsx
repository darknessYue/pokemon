import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

interface PokemonType {
  id: number;
  name: string;
  url: string;
}

interface Pokemon {
  name: string;
  url: string;
  imageUrl?: string;
  types?: string[];
}

export default function Home() {
  const router = useRouter();
  const { type, page = "1" } = router.query;
  const [types, setTypes] = useState<PokemonType[]>([]);
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);


  // 获取类型列表
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/type`);
        const data = await response.json();
        const { results }: { results: PokemonType[] } = data;
        const types = results.map((result, index) => ({
          id: index,
          name: result.name,
          url: result.url,
        }));
        setTypes(types);
      } catch (error) {
        console.error("Error fetching types:", error);
      }
    };
    fetchTypes();
  }, []);

  // 获取宝可梦详情
  const fetchPokemonDetails = async (pokemon: Pokemon) => {
    try {
      const response = await fetch(pokemon.url);
      const data = await response.json();
      return {
        ...pokemon,
        imageUrl: data.sprites.other['official-artwork'].front_default,
        types: data.types.map((type: any) => type.type.name)
      };
    } catch (error) {
      console.error(`Error fetching details for ${pokemon.name}:`, error);
      return pokemon;
    }
  };

  // 批量获取宝可梦详情
  const fetchPokemonDetailsBatch = async (pokemons: Pokemon[]) => {
    setLoadingImages(true);
    try {
       // 每批处理5个请求
      const batchSize = 5;
      const results: Pokemon[] = [];
      
      for (let i = 0; i < pokemons.length; i += batchSize) {
        const batch = pokemons.slice(i, i + batchSize);
        const batchPromises = batch.map(pokemon => fetchPokemonDetails(pokemon));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // 更新状态，让UI能够显示已加载的图片
        setPokemons(prev => {
          const newPokemons = [...prev];
          batchResults.forEach((result, index) => {
            const originalIndex = i + index;
            if (newPokemons[originalIndex]) {
              newPokemons[originalIndex] = result;
            }
          });
          return newPokemons;
        });
      }
    } catch (error) {
      console.error("Error fetching pokemon details:", error);
    } finally {
      setLoadingImages(false);
    }
  };

  // 获取宝可梦列表
  useEffect(() => {
    const fetchPokemons = async () => {
      if (!router.isReady) return;
      setLoading(true);
      try {
        const offset = (parseInt(page as string) - 1) * 24;
        let data;
        // 如果类型不为空，则获取类型列表
        if(type) {
          const currentTypes = type ? (typeof type === "string" ? type.split(",") : type) : [];
          let pokemons: Pokemon[] = [];
          for(let i = 0; i < currentTypes.length; i++) {
            const response = await fetch(`https://pokeapi.co/api/v2/type/${currentTypes[i]}`);
            const results = await response.json();
            const pokemonsItem: Pokemon[] = results.pokemon.map((pokemon: {pokemon: {name: string, url: string}}) => ({
              name: pokemon.pokemon.name,
              url: pokemon.pokemon.url,
            }))
            // 取交集
            if(i !== 0) {
              const pokemonsData = pokemons.filter(item1 => 
                pokemonsItem.some(item2 => item2.name === item1.name)
              );
              pokemons = pokemonsData;
            } else {
              pokemons = pokemonsItem;
            }
          }
          data = {
            results: pokemons.slice(offset, offset + 24),
            count: pokemons.length
          };
        } else {
          // 如果类型为空，则获取所有宝可梦
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=24&offset=${offset}`);
          data = await response.json();
        }
        setPokemons(data.results);
        setTotalPages(Math.ceil(data.count / 24));
        // 开始获取宝可梦详情
        fetchPokemonDetailsBatch(data.results);
      } catch (error) {
        console.error("Error fetching pokemons:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPokemons();
  }, [router.isReady, type, page]);

  const handleTypeChange = (selectedType: string) => {
    const currentTypes = type ? (typeof type === "string" ? type.split(",") : type) : [];
    const newTypes = currentTypes.includes(selectedType)
      ? currentTypes.filter((t) => t !== selectedType)
      : [...currentTypes, selectedType];
    
    router.push({
      pathname: router.pathname,
      query: { ...router.query, type: newTypes.join(","), page: "1" },
    });
  };

  const handleNextPage = () => {
    const currentPage = parseInt(page as string);
    if (currentPage < totalPages) {
      router.push({
        pathname: router.pathname,
        query: { ...router.query, page: (currentPage + 1).toString() },
      });
    }
  };

  const handlePrevPage = () => {
    const currentPage = parseInt(page as string);
    if (currentPage > 1) {
      router.push({
        pathname: router.pathname,
        query: { ...router.query, page: (currentPage - 1).toString() },
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      router.push({
        pathname: router.pathname,
        query: { ...router.query, page: newPage.toString() },
      });
    }
  };

  const getPageNumbers = () => {
    const currentPage = parseInt(page as string);
    const delta = 2; // 当前页码前后各显示2个页码
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // 第一页
        i === totalPages || // 最后一页
        (i >= currentPage - delta && i <= currentPage + delta) // 当前页码附近的页码
      ) {
        range.push(i);
      }
    }

    for (let i = 0; i < range.length; i++) {
      if (l) {
        if (range[i] - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (range[i] - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(range[i]);
      l = range[i];
    }

    return rangeWithDots;
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">宝可梦图鉴</h1>
        
        {/* 类型选择 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">类型</h2>
          <div className="flex flex-wrap gap-2">
            {types.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.name)}
                className={`px-4 py-2 rounded-full ${
                  (router.query.type as string)?.split(",").includes(type.name)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* 宝可梦列表 */}
        
        {
          loading ? (
            <div  className="w-full h-48 flex items-center justify-center text-center text-gray-400">加载中...</div>
          ) : (
            pokemons.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pokemons.map((pokemon) => (
                <div key={pokemon.name} className="border rounded-lg p-4">
                  <div className="relative w-full h-48 mb-4 bg-gray-100">
                    {pokemon.imageUrl ? (
                      <Image
                        src={pokemon.imageUrl}
                        alt={pokemon.name}
                        fill
                        sizes="100%"
                        className="object-contain"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-pulse text-gray-400">加载中...</div>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold capitalize">{pokemon.name}</h3>
                  {pokemon.types && (
                    <div className="flex gap-2 mt-2">
                      {pokemon.types.map((type) => (
                        <span
                          key={type}
                          className="px-2 py-1 bg-gray-200 rounded-full text-sm capitalize"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              </div>):(<div className="w-full h-48 flex items-center justify-center text-center text-gray-400">暂无数据</div>)
            )
          }

        {/* 分页信息 */}
        <div className="mt-8 flex justify-between items-center">
          <div>
            第 {page} 页 / 共 {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            {parseInt(page as string) > 1 && (
              <button
                onClick={handlePrevPage}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                上一页
              </button>
            )}
            <div className="flex gap-2">
              {getPageNumbers().map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`dots-${index}`} className="px-4 py-2">...</span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum as number)}
                    className={`px-4 py-2 rounded-lg ${
                      parseInt(page as string) === pageNum
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}
            </div>
            {parseInt(page as string) < totalPages && (
              <button
                onClick={handleNextPage}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                下一页
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
