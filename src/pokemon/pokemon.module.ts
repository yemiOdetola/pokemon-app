import { Module } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PokemonService],
  exports: [PokemonService],
})
export class PokemonModule {}
