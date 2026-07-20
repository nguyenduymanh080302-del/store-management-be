import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CreateImportBodyDto } from 'common/dto/import.dto';
import { JwtAccessGuard } from 'common/guards/jwt-access.guard';
import { ApiResponse } from 'src/types';
import { ImportService } from './import.service';

@Controller('import')
export class ImportController {
    constructor(private readonly importService: ImportService) { }

    @UseGuards(JwtAccessGuard)
    @Post()
    async createImport(@Body() data: CreateImportBodyDto): Promise<ApiResponse<unknown>> {
        const result = await this.importService.createImport(data);
        return { status: HttpStatus.CREATED, message: 'message.import.created', data: result };
    }
}
