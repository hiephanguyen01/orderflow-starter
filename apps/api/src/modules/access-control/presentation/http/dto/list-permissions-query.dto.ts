import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

function transformBoolean({ value }: { value: unknown }): unknown {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}

export class ListPermissionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  module?: string;

  @IsOptional()
  @Transform(transformBoolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(transformBoolean)
  @IsBoolean()
  isSystem?: boolean;
}
