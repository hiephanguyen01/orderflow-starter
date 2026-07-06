import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsIn, IsUUID, ValidateNested } from 'class-validator';

export class DirectPermissionItemDto {
  @IsUUID('4')
  permissionId!: string;

  @IsIn(['ALLOW', 'DENY'])
  effect!: 'ALLOW' | 'DENY';
}

export class ReplaceUserPermissionsDto {
  @IsArray()
  @ArrayUnique((item: DirectPermissionItemDto) => item.permissionId)
  @ValidateNested({ each: true })
  @Type(() => DirectPermissionItemDto)
  permissions!: DirectPermissionItemDto[];
}
