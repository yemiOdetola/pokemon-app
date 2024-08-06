import { Module } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PokemonController } from './pokemon.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PokemonController],
  providers: [PokemonService],
  exports: [PokemonService],
})
export class PokemonModule {}
