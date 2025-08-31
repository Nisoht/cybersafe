import { supabase } from '../../integrations/supabase/clients';

export const sendWelcomeEmail = async (email: string, username: string) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    console.log('Sending welcome email to:', email, 'with username:', username);
    console.log('Session data available:', !!sessionData?.session);
    
    const response = await fetch('https://rzweiogujuwgunuailvc.supabase.co/functions/v1/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, username }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to send welcome email. Status:', response.status, 'Error:', errorData);
    } else {
      console.log('Welcome email sent successfully');
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

export const sendConfirmationEmail = async (email: string, username: string) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    console.log('Sending confirmation email to:', email, 'with username:', username);
    console.log('Session data available:', !!sessionData?.session);
    
    const response = await fetch('https://rzweiogujuwgunuailvc.supabase.co/functions/v1/send-confirmation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, username }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to send confirmation email. Status:', response.status, 'Error:', errorData);
    } else {
      console.log('Confirmation email sent successfully');
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};
