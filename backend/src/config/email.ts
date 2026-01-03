import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@battechno.com',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
  
  const html = `
    <h2>Verify your email</h2>
    <p>Click the link below to verify your email:</p>
    <a href="${verifyUrl}">${verifyUrl}</a>
  `;
  
  await sendEmail(email, 'Verify your email', html);
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
  
  const html = `
    <h2>Reset your password</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link expires in 1 hour.</p>
  `;
  
  await sendEmail(email, 'Reset your password', html);
};

export const sendAppointmentConfirmationEmail = async (
  email: string,
  appointment: {
    mode: string;
    dateLocal: string;
    timeLocal: string;
  }
): Promise<void> => {
  const html = `
    <h2>Appointment Confirmed</h2>
    <p>Your appointment has been confirmed:</p>
    <ul>
      <li>Mode: ${appointment.mode}</li>
      <li>Date: ${appointment.dateLocal}</li>
      <li>Time: ${appointment.timeLocal}</li>
    </ul>
  `;
  
  await sendEmail(email, 'Appointment Confirmed', html);
};

export const sendAppointmentCancelEmail = async (
  email: string,
  appointment: {
    dateLocal: string;
    timeLocal: string;
  }
): Promise<void> => {
  const html = `
    <h2>Appointment Cancelled</h2>
    <p>Your appointment has been cancelled:</p>
    <ul>
      <li>Date: ${appointment.dateLocal}</li>
      <li>Time: ${appointment.timeLocal}</li>
    </ul>
  `;
  
  await sendEmail(email, 'Appointment Cancelled', html);
};

export const sendAppointmentReminderEmail = async (
  email: string,
  appointment: {
    mode: string;
    dateLocal: string;
    timeLocal: string;
  }
): Promise<void> => {
  const html = `
    <h2>Appointment Reminder</h2>
    <p>You have an upcoming appointment:</p>
    <ul>
      <li>Mode: ${appointment.mode}</li>
      <li>Date: ${appointment.dateLocal}</li>
      <li>Time: ${appointment.timeLocal}</li>
    </ul>
  `;
  
  await sendEmail(email, 'Appointment Reminder', html);
};

// Function to send WhatsApp notification for appointment confirmation
export const sendAppointmentConfirmationWhatsApp = async (
  appointment: {
    mode: string;
    dateLocal: string;
    timeLocal: string;
    note?: string;
  }
): Promise<void> => {
  try {
    // Format the WhatsApp message
    let message = `New Appointment Confirmed:\n\n`;
    message += `Mode: ${appointment.mode}\n`;
    message += `Date: ${appointment.dateLocal}\n`;
    message += `Time: ${appointment.timeLocal}\n`;
    
    if (appointment.note) {
      message += `Note: ${appointment.note}\n`;
    }
    
    message += `\nThis message was automatically sent from the appointment system.`;
    
    // Encode the message for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/962791433341?text=${encodedMessage}`;
    
    console.log('WhatsApp notification prepared. URL to send message:', whatsappUrl);
    
    // In a real implementation, you would use a WhatsApp Business API service like:
    // - Twilio WhatsApp API
    // - Meta's WhatsApp Business API
    // - Or open the URL for manual sending
    
    // For now, we'll just log the URL that can be used to send the message
    // In production, you would integrate with a proper WhatsApp API service
    
  } catch (error) {
    console.error('Error preparing WhatsApp notification:', error);
  }
};

