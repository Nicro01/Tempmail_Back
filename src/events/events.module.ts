// src/events/events.module.ts
import { Module, forwardRef } from '@nestjs/common'; // Importe forwardRef
import { EventsGateway } from './events.gateway';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    forwardRef(() => MailModule), // <--- Use forwardRef aqui
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
