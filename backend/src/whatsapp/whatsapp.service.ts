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
    const buttonIndex = process.env.WHATSAPP_OTP_BUTTON_INDEX ?? '0';
    const components: Array<Record<string, unknown>> = [
      {
        type: 'body',
        parameters: [{ type: 'text', text: otp }],
      },
    ];

    if (buttonIndex !== '') {
      if (!/^\d+$/.test(buttonIndex)) {
        throw new ServiceUnavailableException('WHATSAPP_OTP_BUTTON_INDEX must be a non-negative integer or empty.');
      }
      components.push({
        type: 'button',
        sub_type: 'url',
        index: buttonIndex,
        parameters: [{ type: 'text', text: otp }],
      });
    }

    return this.sendTemplate(toPhoneNumber, templateName, components);
  }

  async sendRegistrationConfirmation(
    toPhoneNumber: string,
    candidateName: string,
    registrationRef: string,
    designation: string,
  ): Promise<string> {
    const templateName = process.env.WHATSAPP_REGISTRATION_TEMPLATE || 'driver_registration_confirmation';
    return this.sendTemplate(toPhoneNumber, templateName, [{
      type: 'body',
      parameters: [
        { type: 'text', text: candidateName },
        { type: 'text', text: registrationRef },
        { type: 'text', text: designation },
      ],
    }], process.env.WHATSAPP_REGISTRATION_TEMPLATE_LANGUAGE);
  }

  private async sendTemplate(
    toPhoneNumber: string,
    templateName: string,
    components: Array<Record<string, unknown>>,
    templateLanguage?: string,
  ): Promise<string> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new ServiceUnavailableException('WhatsApp Cloud API credentials are not configured.');
    }

    const formattedNumber = this.formatPhoneNumber(toPhoneNumber);
    const language = templateLanguage
      || process.env.WHATSAPP_TEMPLATE_LANGUAGE
      || 'en';
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
            components,
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
        `Error sending WhatsApp template "${templateName}" (${language})`,
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
