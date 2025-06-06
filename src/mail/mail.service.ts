// src/mail/mail.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

// Defina uma interface para os dados do e-mail
interface StoredEmailData {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string; // Ou Date, se você converter ao buscar
}

@Injectable()
export class MailService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClientType;
  private readonly EMAIL_LIFETIME_SECONDS = 60 * 60; // 1 hora
  private readonly DOMAIN = 'meutempmail.pro'; // Ou pegue de uma config

  async onModuleInit() {
    this.redisClient = createClient({
      // url: 'redis://localhost:6379'
    });
    this.redisClient.on('error', (err) =>
      console.error('Redis Client Error', err),
    );
    await this.redisClient.connect();
    console.log('Conectado ao Redis com sucesso!');
  }

  async onModuleDestroy() {
    if (this.redisClient && this.redisClient.isOpen) {
      await this.redisClient.quit();
    }
  }

  generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async generateNewMailbox(): Promise<string> {
    const localPart = this.generateRandomString(10);
    const emailAddress = `${localPart}@${this.DOMAIN}`;

    await this.redisClient.set(`mailbox:${emailAddress}`, 'active', {
      EX: this.EMAIL_LIFETIME_SECONDS,
    });
    console.log(
      `Caixa de e-mail ${emailAddress} criada com expiração de ${this.EMAIL_LIFETIME_SECONDS}s.`,
    );
    return emailAddress;
  }

  // A assinatura da função storeReceivedEmail pode esperar um objeto que corresponda a StoredEmailData
  // ou a um DTO específico. Para simplicidade, vou usar 'any' para emailData aqui, mas o ideal seria um DTO.
  async storeReceivedEmail(
    toEmailAddress: string,
    emailData: any,
  ): Promise<string | null> {
    const mailboxExists = await this.redisClient.exists(
      `mailbox:${toEmailAddress}`,
    );
    if (!mailboxExists) {
      console.log(
        `Caixa ${toEmailAddress} não existe ou expirou. E-mail descartado.`,
      );
      return null;
    }

    // Certifique-se que o emailData tenha um 'id' ou gere um aqui se necessário
    const emailId = emailData.id || `email:${this.generateRandomString(16)}`;
    const emailToStore: StoredEmailData = {
      // Garante que estamos armazenando a estrutura esperada
      id: emailId,
      from: emailData.from,
      to: toEmailAddress, // Sobrescreve 'to' se presente em emailData, ou usa o parâmetro
      subject: emailData.subject,
      body: emailData.body,
      receivedAt: emailData.receivedAt || new Date().toISOString(),
    };

    await this.redisClient.set(emailId, JSON.stringify(emailToStore), {
      EX: this.EMAIL_LIFETIME_SECONDS,
    });

    const listKey = `inbox_list:${toEmailAddress}`;
    await this.redisClient.lPush(listKey, emailId);
    await this.redisClient.expire(listKey, this.EMAIL_LIFETIME_SECONDS);

    console.log(`E-mail ${emailId} armazenado para ${toEmailAddress}.`);
    return emailId;
  }

  async getEmailsForMailbox(emailAddress: string): Promise<StoredEmailData[]> {
    // CORREÇÃO AQUI
    const listKey = `inbox_list:${emailAddress}`;
    const emailIds = await this.redisClient.lRange(listKey, 0, -1);

    if (!emailIds || emailIds.length === 0) {
      return [];
    }

    const emails: StoredEmailData[] = []; // CORREÇÃO AQUI: Define o tipo do array
    for (const emailId of emailIds) {
      const emailJson = await this.redisClient.get(emailId);
      if (emailJson) {
        // Agora o TypeScript sabe que estamos adicionando StoredEmailData ao array emails
        emails.push(JSON.parse(emailJson) as StoredEmailData); // CORREÇÃO AQUI: Adiciona um type assertion
      }
    }
    return emails.reverse();
  }
}
    