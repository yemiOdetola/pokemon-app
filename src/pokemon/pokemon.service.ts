import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import { QueryPokemonDto, ToggleFavoriteDto } from './dto/query-pokemon.dto';

@Injectable()
export class PokemonService {
  POKEMON_BASEURL: string = 'https://pokeapi.co/api/v2/pokemon';
  private readonly pokemonSelect: Prisma.PokemonSelect = {
    id: true,
    name: true,
    url: true,
    species: true,
    weight: true,
    abilities: true,
    sprites: true,
    favorites: true,
  };
  constructor(private prisma: PrismaService) {}

  private filterSprites(sprites: any): { [key: string]: string } {
    const filteredSprites: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(sprites)) {
      if (typeof value === 'string') {
        filteredSprites[key] = value;
      }
    }
    return filteredSprites;
  }

  async fetchPokemonFromAPI(limit: number = 100) {
    const response = await axios.get(`${this.POKEMON_BASEURL}?limit=${limit}`);
    return response.data.results;
  }

  async importPokemonData(limit: number = 100) {
    const pokemonList = await this.fetchPokemonFromAPI(limit);
    const organizations = await this.prisma.organization.findMany();

    for (const pokemon of pokemonList) {
      const detailedResponse = await axios.get(pokemon.url);
      const pokemonData = detailedResponse.data;

      // Randomly select an organization
      const randomOrg =
        organizations[Math.floor(Math.random() * organizations.length)];

      try {
        const filteredSprites = this.filterSprites(pokemonData.sprites);

        const where: Prisma.PokemonWhereUniqueInput = {
          name: pokemonData.name,
        };
        const create: Prisma.PokemonCreateInput = {
          name: pokemonData.name,
          url: `${this.POKEMON_BASEURL}/${pokemonData.id}`,
          species: pokemonData.species,
          weight: pokemonData.weight,
          cries: pokemonData.cries,
          abilities: pokemonData.abilities,
          sprites: filteredSprites,
          organization: { connect: { id: randomOrg.id } },
        };
        const update: Prisma.PokemonUpdateInput = {
          species: pokemonData.species,
          weight: pokemonData.weight,
          cries: pokemonData.cries,
          abilities: pokemonData.abilities,
          sprites: filteredSprites,
          organization: { connect: { id: randomOrg.id } },
        };

        await this.prisma.pokemon.upsert({
          where,
          create,
          update,
        });

        console.log(`Imported ${pokemonData.name}`);
      } catch (error) {
        console.error(`Error importing ${pokemonData.name}:`, error);
      }
    }

    console.log('Pokemon import completed!');
  }

  async findOne(id: number) {
    const pokemon = await this.prisma.pokemon.findUnique({
      where: { id },
      include: { organization: true },
    });
    if (!pokemon) {
      throw new NotFoundException(`Pokemon with ID ${id} not found`);
    }
    return pokemon;
  }

  async findAll(query: QueryPokemonDto) {
    const { page = 1, limit = 10, organizationId } = query;
    const skip = (page - 1) * limit;

    const where = organizationId ? { organizationId } : {};

    const [data, total] = await Promise.all([
      this.prisma.pokemon.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          organization: true,
          name: true,
          url: true,
        },
      }),
      this.prisma.pokemon.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPokemonByOrganization(query: QueryPokemonDto) {
    const { page = 1, limit = 10, organizationId } = query;
    const skip = (page - 1) * limit;

    const [pokemons, total] = await Promise.all([
      this.prisma.pokemon.findMany({
        where: { organizationId },
        skip,
        take: limit,
        select: this.pokemonSelect,
      }),
      this.prisma.pokemon.count({ where: { organizationId } }),
    ]);

    if (pokemons.length === 0) {
      throw new NotFoundException('No Pokémon found for this organization');
    }

    return {
      data: pokemons,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // async toggleFavorite(payload: ToggleFavoriteDto) {
  //   const { userId, pokemonId, liked } = payload;
  //   console.log({ userId, pokemonId, liked });
  //   const existingFavorite = await this.prisma.favorite.findUnique({
  //     where: { userId_pokemonId: { userId, pokemonId } },
  //   });

  //   if (existingFavorite) {
  //     return this.prisma.favorite.update({
  //       where: { id: existingFavorite.id },
  //       data: { liked },
  //     });
  //   } else {
  //     return this.prisma.favorite.create({
  //       data: { userId, pokemonId, liked },
  //     });
  //   }
  // }

  async toggleFavorite(payload: ToggleFavoriteDto) {
    const { userId, pokemonId, liked } = payload;
    const existingFavorite = await this.prisma.favorite.findUnique({
      where: { userId_pokemonId: { userId, pokemonId } },
    });

    if (existingFavorite) {
      if (existingFavorite.liked === liked) {
        return this.prisma.favorite.delete({
          where: { id: existingFavorite.id },
        });
      } else {
        return this.prisma.favorite.update({
          where: { id: existingFavorite.id },
          data: { liked },
        });
      }
    } else {
      return this.prisma.favorite.create({
        data: { userId, pokemonId, liked },
      });
    }
  }

  async getFavoriteStatus(userId: number, pokemonId: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_pokemonId: { userId, pokemonId } },
    });

    return favorite ? favorite.liked : null;
  }
}
