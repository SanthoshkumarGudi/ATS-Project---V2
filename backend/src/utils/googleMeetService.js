// backend/utils/googleMeetService.js
const { google } = require('googleapis');
const path = require('path');

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,   
  "http://localhost:5000"
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

// createGoogleMeetEvent creates a Google Meet event and returns the meeting link
async function createGoogleMeetEvent({
  summary,
  description = "Interview via ATS Pro",
  startTime,   // ISO format
  endTime,     // ISO format
}) {
  try {
    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: startTime,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: endTime,
        timeZone: "Asia/Kolkata",
      },
      conferenceData: {
        createRequest: {
          requestId: `ats-meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet" // This specifies that we want a Google Meet link
          },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    // hangoutLink is the Google Meet link
    const meetingLink = response.data.hangoutLink;

    if (!meetingLink) {
      throw new Error("No Google Meet link was generated");
    }

    console.log("Google Meet link created successfully:", meetingLink);

    return { meetingLink };

  } catch (error) {
    console.error("Google Meet creation error:", error.message);
    if (error.response?.data) {
      console.error("Google API Error:", JSON.stringify(error.response.data, null, 2));
    }
    throw new Error("Failed to create Google Meet link: " + error.message);
  }
}

module.exports = { createGoogleMeetEvent };