import { Type } from "class-transformer";
import { IsDefined, IsInt, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class RoleDto {

    @IsDefined({ message: 'message.role.is-required' })
    @Type(() => Number)
    @IsInt({ message: "message.role.must-is-number" })
    id: number

    @IsDefined({ message: 'message.role.is-required' })
    @IsString({ message: "message.role.must-is-string" })
    @IsNotEmpty({ message: "message.role.name-not-empty" })
    @MaxLength(32, { message: "message.role.max-length-is-32" })
    name: string;

}