import type { PaymentRequest, PaymentResponse } from '@/types';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;

export class PaymentService {
  /**
   * Format phone number to 2547XXXXXXXX format (12 digits starting with 2547)
   * Validates that the final format matches M-Pesa requirements
   */
  private static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let formatted = phone.replace(/\D/g, '');

    // Handle standard cases
    if (formatted.startsWith('254')) {
      formatted = formatted;
    } else if (formatted.startsWith('0')) {
      formatted = `254${formatted.substring(1)}`;
    } else if (formatted.startsWith('7') || formatted.startsWith('1')) {
      formatted = `254${formatted}`;
    }

    // Validate final format: must be 254[7|1]XXXXXXXX (12 digits, starts with 2547 or 2541)
    if (!/^254[17]\d{8}$/.test(formatted)) {
      throw new Error(`Invalid phone number format. Expected 2547XXXXXXXX or 2541XXXXXXXX (12 digits), got: ${formatted}`);
    }

    return formatted;
  }

  /**
   * Initiate M-Pesa payment via Paystack (mobile_money channel)
   */
  static async initiateMpesaPayment(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    if (!request.phone) {
      return {
        success: false,
        error: 'Phone number is required for M-Pesa payment',
      };
    }

    let formattedPhone: string;
    try {
      formattedPhone = this.formatPhoneNumber(request.phone);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid phone number format',
      };
    }

    try {
      const email = request.email || `${formattedPhone}@customer.leeztruestyles.com`;

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: request.amount * 100, // Convert to cents
          currency: 'KES',
          channels: ['mobile_money'],
          callback_url: request.callback_url,
          reference: `order_${request.order_id}_${Date.now()}`,
          metadata: {
            order_id: request.order_id,
            phone: `+${formattedPhone}`,
            custom_fields: [
              {
                display_name: 'Order ID',
                variable_name: 'order_id',
                value: request.order_id,
              },
            ],
          },
        }),
      });

      const data = await response.json();
      console.log('Paystack M-Pesa response:', JSON.stringify(data));

      if (data.status) {
        return {
          success: true,
          reference: data.data.reference,
          authorization_url: data.data.authorization_url,
          message: data.message || 'Redirecting to M-Pesa payment...',
        };
      }

      return {
        success: false,
        error: data.message || 'M-Pesa payment initialization failed',
      };
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      return {
        success: false,
        error: 'Failed to initiate M-Pesa payment',
      };
    }
  }

  /**
   * Initiate card payment via Paystack
   */
  static async initiateCardPayment(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email!,
          amount: request.amount * 100, // Convert to kobo/cents
          currency: 'KES',
          callback_url: request.callback_url,
          reference: `order_${request.order_id}_${Date.now()}`,
          metadata: {
            order_id: request.order_id,
            custom_fields: [
              {
                display_name: 'Order ID',
                variable_name: 'order_id',
                value: request.order_id,
              },
            ],
          },
        }),
      });

      const data = await response.json();

      if (data.status) {
        return {
          success: true,
          reference: data.data.reference,
          authorization_url: data.data.authorization_url,
          message: data.message || 'Payment initialized successfully',
        };
      }

      return {
        success: false,
        error: data.message || 'Payment initialization failed',
      };
    } catch (error) {
      console.error('Card payment error:', error);
      return {
        success: false,
        error: 'Failed to initialize payment',
      };
    }
  }

  /**
   * Verify payment status
   */
  static async verifyPayment(reference: string): Promise<{
    success: boolean;
    status: 'success' | 'failed' | 'pending';
    data?: any;
  }> {
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (data.status && data.data.status === 'success') {
        return {
          success: true,
          status: 'success',
          data: data.data,
        };
      }

      return {
        success: false,
        status: data.data?.status || 'failed',
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        status: 'failed',
      };
    }
  }
}

