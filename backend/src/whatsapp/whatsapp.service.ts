import {
  BadRequestException,
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';

type TemplateParameter = {
  type: 'text';
  text: string;
};

type WhatsAppMessageResponse = {
  messages?: Array<{ id: string }>;
  error?: { message?: string };
};

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiUrl: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    this.apiUrl = `https://graph.facebook.com/${apiVersion}`;
  }

  async sendOtp(toPhoneNumber: string, otp: string): Promise<string> {
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE || 'customer_login_otp1';
    return this.sendTemplate(toPhoneNumber, templateName, [{ type: 'text', text: otp }]);
  }

  async sendRegistrationConfirmation(
    toPhoneNumber: string,
    candidateName: string,
    registrationRef: string,
    designation: string,
  ): Promise<string> {
    const templateName = process.env.WHATSAPP_REGISTRATION_TEMPLATE || 'snp_registration_confirmed';
    return this.sendTemplate(toPhoneNumber, templateName, [
      { type: 'text', text: candidateName }, // {{1}}
      { type: 'text', text: registrationRef }, // {{2}}
      { type: 'text', text: designation }, // {{3}}
    ]);
  }

  private async sendTemplate(
    toPhoneNumber: string,
    templateName: string,
    parameters: TemplateParameter[],
  ): Promise<string> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new ServiceUnavailableException('WhatsApp Cloud API credentials are not configured.');
    }

    const formattedNumber = this.formatPhoneNumber(toPhoneNumber);
    const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';
    try {
      const response = await axios.post<WhatsAppMessageResponse>(
        `${this.apiUrl}/${encodeURIComponent(this.phoneNumberId)}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'template',
          template: {
            name: templateName,
            language: { code: language },
            components: [{ type: 'body', parameters }],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
      const messageId = response.data.messages?.[0]?.id;
      if (!messageId) {
        this.logger.error(`WhatsApp template "${templateName}" response did not contain a message ID.`);
        throw new BadGatewayException('WhatsApp service returned an invalid response.');
      }
      this.logger.log(`WhatsApp template "${templateName}" sent to ${formattedNumber}.`);
      return messageId;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      const apiError = error as AxiosError<WhatsAppMessageResponse>;
      const apiMessage = apiError.response?.data?.error?.message;
      this.logger.error(
        `Error sending WhatsApp template "${templateName}"`,
        apiMessage || apiError.message,
      );
      if (apiError.response) {
        throw new BadGatewayException(
          'WhatsApp message could not be sent. Check the template and recipient configuration.',
        );
      }
      throw new BadGatewayException('WhatsApp message could not be sent. Please try again later.');
    }
  }

  private formatPhoneNumber(phone: string) {
    const digits = String(phone || '').replace(/\D/g, '');
    const mobile = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
    if (!/^\d{10}$/.test(mobile)) {
      throw new BadRequestException('WhatsApp recipient mobile must contain exactly 10 digits.');
    }
    return `91${mobile}`;
  }
}
