import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { Prisma } from '@prisma/client';

@Injectable()
export class PokemonService {
  POKEMON_BASEURL: string = 'https://pokeapi.co/api/v2/pokemon';
  constructor(private prisma: PrismaService) {}

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

  private filterSprites(sprites: any): { [key: string]: string } {
    const filteredSprites: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(sprites)) {
      if (typeof value === 'string') {
        filteredSprites[key] = value;
      }
    }
    return filteredSprites;
  }
}
