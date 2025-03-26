import { GetServerSideProps } from 'next';
import { useRouter } from "next/router";
import Image from "next/image";
import { useState, useEffect } from 'react';

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

interface HomeProps {
  initialTypes: PokemonType[];
  initialPokemons: Pokemon[];
  totalPages: number;
}

export default function SSRHome({ initialTypes, initialPokemons, totalPages }: HomeProps) {
  const router = useRouter();
  const { type, page = "1" } = router.query;
  const [pokemons, setPokemons] = useState(initialPokemons);
  const [loading, setLoading] = useState(true);

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
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
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

  useEffect(() => {
    const loadPokemonDetails = async () => {
      setLoading(true);
      const pokemonsWithDetails = await Promise.all(
        initialPokemons.map(async (pokemon) => {
          const details = await fetchPokemonDetails(pokemon.url);
          return {
            ...pokemon,
            ...details
          };
        })
      );
      setPokemons(pokemonsWithDetails);
      setLoading(false);
    };

    loadPokemonDetails();
  }, [initialPokemons]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">宝可梦图鉴 (SSR版本)</h1>
        
        {/* 类型选择 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">类型</h2>
          <div className="flex flex-wrap gap-2">
            {initialTypes.map((type) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            Array(24).fill(0).map((_, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="relative w-full h-48 mb-4 bg-gray-100">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">加载中...</div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))
          ) : (
            pokemons.map((pokemon) => (
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
            ))
          )}
        </div>

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

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { type, page = "1" } = query;
  const offset = (parseInt(page as string) - 1) * 24;

  // 获取类型列表
  const typesResponse = await fetch('https://pokeapi.co/api/v2/type');
  const typesData = await typesResponse.json();
  const types = typesData.results.map((result: { name: string; url: string }, index: number) => ({
    id: index,
    name: result.name,
    url: result.url,
  }));

  // 获取宝可梦列表
  let pokemonsData;
  if (type) {
    const currentTypes = type ? (typeof type === "string" ? type.split(",") : type) : [];
    let pokemons: Array<{ name: string; url: string }> = [];
    
    for (let i = 0; i < currentTypes.length; i++) {
      const response = await fetch(`https://pokeapi.co/api/v2/type/${currentTypes[i]}`);
      const results = await response.json();
      const pokemonsItem = results.pokemon.map((pokemon: { pokemon: { name: string; url: string } }) => ({
        name: pokemon.pokemon.name,
        url: pokemon.pokemon.url,
      }));
      
      if (i !== 0) {
        pokemons = pokemons.filter(item1 => 
          pokemonsItem.some((item2: { name: string; url: string }) => item2.name === item1.name)
        );
      } else {
        pokemons = pokemonsItem;
      }
    }
    
    pokemonsData = {
      results: pokemons.slice(offset, offset + 24),
      count: pokemons.length
    };
  } else {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=24&offset=${offset}`);
    pokemonsData = await response.json();
  }

  return {
    props: {
      initialTypes: types,
      initialPokemons: pokemonsData.results,
      totalPages: Math.ceil(pokemonsData.count / 24),
    },
  };
};

// 添加客户端获取宝可梦详情的函数
const fetchPokemonDetails = async (url: string) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return {
      imageUrl: data.sprites.other['official-artwork'].front_default,
      types: data.types.map((type: any) => type.type.name)
    };
  } catch (error) {
    console.error('Error fetching pokemon details:', error);
    return null;
  }
};