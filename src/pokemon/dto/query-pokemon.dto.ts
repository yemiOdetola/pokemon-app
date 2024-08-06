import { IsOptional, IsInt, Min, IsNotEmpty, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPokemonDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  organizationId?: number;
}

export class ToggleFavoriteDto {
  @IsBoolean()
  @Type(() => Boolean)
  @IsNotEmpty()
  liked: boolean;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  pokemonId: number;
}
