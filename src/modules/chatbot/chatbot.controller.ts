import { Controller, Get, Put, Body, UseGuards, Post, UseInterceptors, UploadedFile, Res, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { RestaurantConfig } from './menu-config';
import { FileInterceptor } from '@nestjs/platform-express';
// @ts-ignore
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream } from 'fs';
import { Response } from 'express';

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('config')
  @ApiOperation({ summary: 'Obtener la configuración y el menú actual del restaurante' })
  @ApiResponse({ status: 200, description: 'Configuración cargada con éxito' })
  getConfig(): RestaurantConfig {
    return this.chatbotService.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Actualizar la configuración y el menú del restaurante' })
  @ApiResponse({ status: 200, description: 'Configuración actualizada con éxito' })
  async updateConfig(@Body() newConfig: RestaurantConfig): Promise<{ success: boolean; data: RestaurantConfig }> {
    await this.chatbotService.updateConfig(newConfig);
    return {
      success: true,
      data: this.chatbotService.getConfig(),
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Subir una imagen para un producto' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './data/uploads',
      filename: (req: any, file: any, cb: any) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadFile(@UploadedFile() file: any) {
    return {
      imageUrl: `/api/chatbot/uploads/${file.filename}`
    };
  }

  @Get('uploads/:filename')
  @ApiOperation({ summary: 'Obtener una imagen subida' })
  async getUploadedFile(@Param('filename') filename: string, @Res() res: any) {
    const file = createReadStream(join(process.cwd(), 'data', 'uploads', filename));
    file.pipe(res);
  }
}
