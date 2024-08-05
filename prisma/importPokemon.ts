import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PokemonService } from '../src/pokemon/pokemon.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const pokemonService = app.get(PokemonService);

  try {
    await pokemonService.importPokemonData();
  } catch (error) {
    console.error('Error importing Pokemon:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
