import { OAuth2Client } from 'google-auth-library';
import { GoogleCalendarConfig } from '@/types';
import { supabase } from './supabaseClient';

// Google OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

// Scopes needed for Google Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar',
];

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      REDIRECT_URI
    );
  }

  /**
   * Generate the Google OAuth2 authentication URL
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force consent screen to ensure refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Save tokens to database
   */
  async saveTokens(tokens: any): Promise<GoogleCalendarConfig | null> {
    try {
      const config: Partial<GoogleCalendarConfig> = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
        sync_enabled: true,
        sync_interval_minutes: 15,
      };

      // Check if config already exists
      const { data: existingConfig } = await supabase
        .from('google_calendar_config')
        .select('*')
        .single();

      let result;
      if (existingConfig) {
        // Update existing config
        result = await supabase
          .from('google_calendar_config')
          .update(config)
          .eq('id', existingConfig.id)
          .select()
          .single();
      } else {
        // Create new config
        result = await supabase
          .from('google_calendar_config')
          .insert(config)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving tokens:', result.error);
        return null;
      }

      return result.data;
    } catch (error) {
      console.error('Error in saveTokens:', error);
      return null;
    }
  }

  /**
   * Get authenticated OAuth2 client
   */
  async getAuthenticatedClient(): Promise<OAuth2Client | null> {
    try {
      // Get tokens from database
      const { data: config, error } = await supabase
        .from('google_calendar_config')
        .select('*')
        .single();

      if (error || !config) {
        console.error('No Google Calendar configuration found');
        return null;
      }

      // Set credentials
      this.oauth2Client.setCredentials({
        access_token: config.access_token,
        refresh_token: config.refresh_token,
        expiry_date: config.token_expiry ? new Date(config.token_expiry).getTime() : undefined,
      });

      // Check if token is expired and refresh if needed
      const tokenInfo = await this.oauth2Client.getAccessToken();
      if (!tokenInfo.token) {
        console.error('Failed to get access token');
        return null;
      }

      // Update token in database if it was refreshed
      if (tokenInfo.token !== config.access_token) {
        await supabase
          .from('google_calendar_config')
          .update({
            access_token: tokenInfo.token,
            token_expiry: this.oauth2Client.credentials.expiry_date 
              ? new Date(this.oauth2Client.credentials.expiry_date).toISOString() 
              : undefined,
          })
          .eq('id', config.id);
      }

      return this.oauth2Client;
    } catch (error) {
      console.error('Error getting authenticated client:', error);
      return null;
    }
  }

  /**
   * Revoke Google authorization
   */
  async revokeAuthorization(): Promise<boolean> {
    try {
      const { data: config } = await supabase
        .from('google_calendar_config')
        .select('*')
        .single();

      if (!config) {
        return true; // Already disconnected
      }

      // Revoke the token
      if (config.access_token) {
        await this.oauth2Client.revokeToken(config.access_token);
      }

      // Delete config from database
      await supabase
        .from('google_calendar_config')
        .delete()
        .eq('id', config.id);

      // Delete associated calendars
      await supabase
        .from('google_calendars')
        .delete()
        .eq('config_id', config.id);

      // Clear Google-related fields from events
      await supabase
        .from('events')
        .update({
          google_event_id: null,
          google_calendar_id: null,
          sync_status: null,
          last_synced: null,
          google_etag: null,
        })
        .not('google_event_id', 'is', null);

      return true;
    } catch (error) {
      console.error('Error revoking authorization:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated with Google
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: config, error } = await supabase
        .from('google_calendar_config')
        .select('id, access_token')
        .single();

      return !error && !!config?.access_token;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const googleAuth = new GoogleAuthService();