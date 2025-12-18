import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SigninDto {
    @IsNotEmpty() @IsString() @MinLength(2) @MaxLength(32)
    username: string;

    @IsNotEmpty() @IsString() @MinLength(2) @MaxLength(32)
    password: string;
}

export class SignupDto {
    @IsNotEmpty() @IsString() @MinLength(2) @MaxLength(64)
    name: string;

    @IsNotEmpty() @IsString() @MinLength(6) @MaxLength(32)
    username: string;

    @IsNotEmpty() @IsString() @MinLength(6) @MaxLength(64)
    password: string;

    @IsNotEmpty() @IsInt()
    roleId: number;

    // optional fields
    @IsEmail() @IsOptional()
    email?: string;

    @IsString() @IsOptional()
    avatar?: string;

    @IsString() @IsOptional()
    phone?: string;

    @IsString() @IsOptional()
    address?: string;
}
