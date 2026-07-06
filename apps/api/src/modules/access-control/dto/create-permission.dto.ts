import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/)
  @MaxLength(150)
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9-]*$/)
  @MaxLength(100)
  module!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
