import { calendar_v3 } from '@googleapis/calendar';
import { googleAuth } from './google-auth';
import { supabase } from './supabaseClient';
import { Event, GoogleCalendar, SyncResult } from '@/types';

export class GoogleCalendarSyncService {
  private calendar: calendar_v3.Calendar | null = null;

  /**
   * Initialize Google Calendar API client
   */
  private async initializeCalendar(): Promise<boolean> {
    try {
      const authClient = await googleAuth.getAuthenticatedClient();
      if (!authClient) {
        console.error('Failed to get authenticated client');
        return false;
      }

      this.calendar = new calendar_v3.Calendar({ auth: authClient });
      return true;
    } catch (error) {
      console.error('Error initializing calendar:', error);
      return false;
    }
  }

  /**
   * Fetch and save user's Google calendars
   */
  async fetchCalendars(): Promise<GoogleCalendar[]> {
    if (!await this.initializeCalendar() || !this.calendar) {
      throw new Error('Failed to initialize Google Calendar');
    }

    try {
      // Get config
      const { data: config } = await supabase
        .from('google_calendar_config')
        .select('id')
        .single();

      if (!config) {
        throw new Error('No Google Calendar configuration found');
      }

      // Fetch calendars from Google
      const response = await this.calendar.calendarList.list();
      const calendars = response.data.items || [];

      // Save calendars to database
      const savedCalendars: GoogleCalendar[] = [];
      
      for (const cal of calendars) {
        if (!cal.id || !cal.summary) continue;

        const calendarData = {
          id: cal.id,
          config_id: config.id,
          summary: cal.summary,
          description: cal.description || null,
          time_zone: cal.timeZone || null,
          is_primary: cal.primary || false,
          access_role: cal.accessRole || 'reader',
          background_color: cal.backgroundColor || null,
          foreground_color: cal.foregroundColor || null,
          selected: cal.primary || false, // Auto-select primary calendar
        };

        const { data, error } = await supabase
          .from('google_calendars')
          .upsert(calendarData)
          .select()
          .single();

        if (!error && data) {
          savedCalendars.push({
            id: data.id,
            summary: data.summary,
            description: data.description,
            timeZone: data.time_zone,
            primary: data.is_primary,
            accessRole: data.access_role,
            backgroundColor: data.background_color,
            foregroundColor: data.foreground_color,
          });
        }
      }

      return savedCalendars;
    } catch (error) {
      console.error('Error fetching calendars:', error);
      throw error;
    }
  }

  /**
   * Sync events from selected Google calendars
   */
  async syncEvents(calendarId?: string): Promise<SyncResult> {
    if (!await this.initializeCalendar() || !this.calendar) {
      throw new Error('Failed to initialize Google Calendar');
    }

    const result: SyncResult = {
      imported: 0,
      updated: 0,
      errors: 0,
      conflicts: [],
      lastSync: new Date().toISOString(),
    };

    try {
      // Start sync log
      const { data: syncLog } = await supabase
        .from('google_sync_log')
        .insert({
          sync_type: 'manual',
          status: 'started',
        })
        .select()
        .single();

      // Get calendars to sync
      let calendarsToSync;
      if (calendarId) {
        calendarsToSync = await supabase
          .from('google_calendars')
          .select('*')
          .eq('id', calendarId);
      } else {
        calendarsToSync = await supabase
          .from('google_calendars')
          .select('*')
          .eq('selected', true);
      }

      if (!calendarsToSync.data || calendarsToSync.data.length === 0) {
        throw new Error('No calendars selected for sync');
      }

      // Sync each calendar
      for (const cal of calendarsToSync.data) {
        try {
          await this.syncCalendarEvents(cal.id, result);
        } catch (error) {
          console.error(`Error syncing calendar ${cal.id}:`, error);
          result.errors++;
        }
      }

      // Update sync log
      if (syncLog) {
        await supabase
          .from('google_sync_log')
          .update({
            status: 'completed',
            imported_count: result.imported,
            updated_count: result.updated,
            error_count: result.errors,
            conflicts: result.conflicts,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLog.id);
      }

      // Update last sync time
      const { data: config } = await supabase
        .from('google_calendar_config')
        .select('id')
        .single();
      
      if (config) {
        await supabase
          .from('google_calendar_config')
          .update({ last_sync: result.lastSync })
          .eq('id', config.id);
      }

      return result;
    } catch (error) {
      console.error('Error syncing events:', error);
      throw error;
    }
  }

  /**
   * Sync events from a specific calendar
   */
  private async syncCalendarEvents(calendarId: string, result: SyncResult) {
    if (!this.calendar) return;

    try {
      // Fetch events from Google Calendar (last 3 months to next 6 months)
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 3);
      
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 6);

      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
      });

      const events = response.data.items || [];

      for (const googleEvent of events) {
        try {
          await this.syncSingleEvent(googleEvent, calendarId, result);
        } catch (error) {
          console.error(`Error syncing event ${googleEvent.id}:`, error);
          result.errors++;
        }
      }

      // Update calendar last sync time
      await supabase
        .from('google_calendars')
        .update({ last_synced: new Date().toISOString() })
        .eq('id', calendarId);
    } catch (error) {
      console.error(`Error fetching events from calendar ${calendarId}:`, error);
      throw error;
    }
  }

  /**
   * Sync a single event
   */
  private async syncSingleEvent(
    googleEvent: calendar_v3.Schema$Event,
    calendarId: string,
    result: SyncResult
  ) {
    if (!googleEvent.id || !googleEvent.summary) return;

    // Parse event times
    const startTime = googleEvent.start?.dateTime || googleEvent.start?.date;
    const endTime = googleEvent.end?.dateTime || googleEvent.end?.date;
    
    if (!startTime || !endTime) return;

    // Check if event already exists
    const { data: existingEvent } = await supabase
      .from('events')
      .select('*')
      .eq('google_event_id', googleEvent.id)
      .single();

    const eventData: Partial<Event> = {
      title: googleEvent.summary,
      description: googleEvent.description || undefined,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      location: googleEvent.location || undefined,
      all_day: !googleEvent.start?.dateTime,
      google_event_id: googleEvent.id,
      google_calendar_id: calendarId,
      google_etag: googleEvent.etag || undefined,
      sync_status: 'synced',
      last_synced: new Date().toISOString(),
      priority: 'medium', // Default priority
    };

    // Handle reminders
    if (googleEvent.reminders?.overrides?.length) {
      const reminder = googleEvent.reminders.overrides[0];
      eventData.reminder_minutes = reminder.minutes;
    }

    if (existingEvent) {
      // Check for conflicts
      if (existingEvent.google_etag && existingEvent.google_etag !== googleEvent.etag) {
        // Event was modified both locally and in Google
        if (existingEvent.updated_at > existingEvent.last_synced!) {
          // Local changes are newer - this is a conflict
          result.conflicts.push(`${existingEvent.title} (${existingEvent.id})`);
          
          // Update sync status to conflict
          await supabase
            .from('events')
            .update({ sync_status: 'conflict' })
            .eq('id', existingEvent.id);
          
          return;
        }
      }

      // Update existing event
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', existingEvent.id);

      if (!error) {
        result.updated++;
      } else {
        result.errors++;
      }
    } else {
      // Create new event
      const { error } = await supabase
        .from('events')
        .insert(eventData);

      if (!error) {
        result.imported++;
      } else {
        result.errors++;
      }
    }
  }

  /**
   * Export local event to Google Calendar
   */
  async exportEvent(eventId: string, calendarId?: string): Promise<boolean> {
    if (!await this.initializeCalendar() || !this.calendar) {
      throw new Error('Failed to initialize Google Calendar');
    }

    try {
      // Get event from database
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !event) {
        throw new Error('Event not found');
      }

      // Use provided calendar ID or get primary calendar
      let targetCalendarId = calendarId;
      if (!targetCalendarId) {
        const { data: primaryCalendar } = await supabase
          .from('google_calendars')
          .select('id')
          .eq('is_primary', true)
          .single();
        
        targetCalendarId = primaryCalendar?.id || 'primary';
      }

      // Convert to Google Calendar format
      const googleEvent: calendar_v3.Schema$Event = {
        summary: event.title,
        description: event.description || undefined,
        location: event.location || undefined,
        start: event.all_day
          ? { date: event.start_time.split('T')[0] }
          : { dateTime: event.start_time },
        end: event.all_day
          ? { date: event.end_time.split('T')[0] }
          : { dateTime: event.end_time },
        reminders: event.reminder_minutes
          ? {
              useDefault: false,
              overrides: [{ method: 'popup', minutes: event.reminder_minutes }],
            }
          : { useDefault: true },
      };

      let googleEventId: string | undefined;

      if (event.google_event_id) {
        // Update existing Google event
        const response = await this.calendar.events.update({
          calendarId: targetCalendarId,
          eventId: event.google_event_id,
          requestBody: googleEvent,
        });
        googleEventId = response.data.id;
      } else {
        // Create new Google event
        const response = await this.calendar.events.insert({
          calendarId: targetCalendarId,
          requestBody: googleEvent,
        });
        googleEventId = response.data.id;
      }

      // Update local event with Google info
      if (googleEventId) {
        await supabase
          .from('events')
          .update({
            google_event_id: googleEventId,
            google_calendar_id: targetCalendarId,
            sync_status: 'synced',
            last_synced: new Date().toISOString(),
          })
          .eq('id', eventId);
      }

      return true;
    } catch (error) {
      console.error('Error exporting event:', error);
      return false;
    }
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteGoogleEvent(eventId: string): Promise<boolean> {
    if (!await this.initializeCalendar() || !this.calendar) {
      throw new Error('Failed to initialize Google Calendar');
    }

    try {
      // Get event from database
      const { data: event } = await supabase
        .from('events')
        .select('google_event_id, google_calendar_id')
        .eq('id', eventId)
        .single();

      if (!event?.google_event_id || !event?.google_calendar_id) {
        return true; // Not synced to Google
      }

      // Delete from Google Calendar
      await this.calendar.events.delete({
        calendarId: event.google_calendar_id,
        eventId: event.google_event_id,
      });

      // Clear Google sync fields
      await supabase
        .from('events')
        .update({
          google_event_id: null,
          google_calendar_id: null,
          sync_status: null,
          last_synced: null,
          google_etag: null,
        })
        .eq('id', eventId);

      return true;
    } catch (error) {
      console.error('Error deleting Google event:', error);
      return false;
    }
  }
}

// Export singleton instance
export const googleCalendarSync = new GoogleCalendarSyncService();