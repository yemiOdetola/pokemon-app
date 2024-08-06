import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  Body,
  Post,
} from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { QueryPokemonDto, ToggleFavoriteDto } from './dto/query-pokemon.dto';
import { JwtGuard } from '../auth/guard/';

@Controller('pokemons')
@UseGuards(JwtGuard)
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  @Get()
  findAll(@Query() query: QueryPokemonDto) {
    return this.pokemonService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.findOne(id);
  }

  @Get(':organizationId/all')
  getPokemonForOrganization(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.pokemonService.getPokemonByOrganization({
      organizationId,
      page,
      limit,
    });
  }

  @Post(':id/favorite')
  async toggleFavorite(
    @Param('id') pokemonId: number,
    @Body() body: ToggleFavoriteDto,
  ) {
    const { userId, liked } = body;
    const payload = { userId, pokemonId, liked };
    return this.pokemonService.toggleFavorite(payload);
  }

  @Get(':id/:userId/favorite')
  async getFavoriteStatus(
    @Param('id') pokemonId: number,
    @Param('userId') userId: number,
  ) {
    return this.pokemonService.getFavoriteStatus(userId, pokemonId);
  }
}
