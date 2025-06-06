// src/mail/mail.module.ts
import { Module, forwardRef } from '@nestjs/common'; // Importe forwardRef
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    forwardRef(() => EventsModule), // <--- Use forwardRef aqui
  ],
  providers: [MailService],
  controllers: [MailController],
  exports: [MailService],
})
export class MailModule {}
