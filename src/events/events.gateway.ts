// src/events/events.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MailService } from '../mail/mail.service'; // Injete o MailService

@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, restrinja ao seu domínio do frontend (ex: http://localhost:5173)
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly mailService: MailService) {} // Injeção de dependência

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    // Aqui você pode adicionar lógica para limpar recursos se o cliente se desconectar,
    // embora a expiração do Redis já vá cuidar dos dados.
  }

  @SubscribeMessage('generateEmail')
  async handleGenerateEmail(
    @ConnectedSocket() client: Socket,
  ): Promise<{ email: string; existingEmails: any[] }> {
    const emailAddress = await this.mailService.generateNewMailbox();
    client.join(emailAddress); // Cliente entra na sala com o nome do seu e-mail
    console.log(`Cliente ${client.id} inscrito na sala ${emailAddress}`);

    // Opcional: carregar e-mails existentes se houver (improvável para e-mail novo, mas possível se reconectar)
    const existingEmails =
      await this.mailService.getEmailsForMailbox(emailAddress);
    return { email: emailAddress, existingEmails };
  }

  // Esta função será chamada internamente quando um novo e-mail for recebido/processado
  public notifyNewEmail(targetEmailAddress: string, emailData: any) {
    console.log(
      `Notificando novo e-mail para sala/cliente: ${targetEmailAddress}`,
    );
    this.server.to(targetEmailAddress).emit('newEmail', emailData);
  }
}
