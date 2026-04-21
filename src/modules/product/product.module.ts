import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ImageService } from './image.service';

@Module({
    controllers: [ProductController],
    providers: [ProductService, ImageService],
})
export class ProductModule { }
