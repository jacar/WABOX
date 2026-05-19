import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotState } from './entities/chatbot-state.entity';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { MessageModule } from '../message/message.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatbotState], 'data'),
    MessageModule,
    SessionModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
