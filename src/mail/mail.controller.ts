// src/mail/mail.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { MailService } from './mail.service';
import { EventsGateway } from '../events/events.gateway'; // Injete o Gateway

interface SimulateEmailDto {
  from: string;
  subject: string;
  body: string;
}

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly eventsGateway: EventsGateway, // Injeção
  ) {}

  @Post('simulate-receive/:emailAddress')
  async simulateReceiveEmail(
    @Param('emailAddress') emailAddress: string,
    @Body() emailDto: SimulateEmailDto,
  ) {
    if (!emailAddress.includes('@')) {
      throw new BadRequestException('Formato de e-mail inválido.');
    }
    console.log(
      `Simulando recebimento de e-mail para: ${emailAddress}`,
      emailDto,
    );

    const emailDataToStore = {
      ...emailDto,
      to: emailAddress,
      receivedAt: new Date().toISOString(),
      id: `simulated-${this.mailService.generateRandomString(8)}`, // ID simulado
    };

    const storedEmailId = await this.mailService.storeReceivedEmail(
      emailAddress,
      emailDataToStore,
    );

    if (storedEmailId) {
      // Notifica o cliente via WebSocket
      this.eventsGateway.notifyNewEmail(emailAddress, emailDataToStore);
      return {
        message: 'E-mail simulado recebido e notificado.',
        emailId: storedEmailId,
      };
    } else {
      return {
        message:
          'Caixa de e-mail não encontrada ou expirada. E-mail descartado.',
      };
    }
  }
}
