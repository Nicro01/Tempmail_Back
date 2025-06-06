// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    EventsModule,
    MailModule,
    // Outros módulos como ConfigModule para variáveis de ambiente podem ser adicionados aqui
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
