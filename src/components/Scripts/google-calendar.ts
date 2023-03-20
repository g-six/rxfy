export function handleBookClick() {}

/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
export function listUpcomingEvents() {
  return `async function listUpcomingEvents() {
        let response;
        try {
        const request = {
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 10,
            'orderBy': 'startTime',
        };
        response = await gapi.client.calendar.events.list(request);
        } catch (err) {
        document.getElementById('content').innerText = err.message;
        return;
        }

        const events = response.result.items;
        if (!events || events.length == 0) {
        document.getElementById('content').innerText = 'No events found.';
        return;
        }
        // Flatten to string to display
        const output = events.reduce(
            (str, event) => ${'${str}${event.summary} (${event.start.dateTime || event.start.date})\n'},
            'Events:\n');
        document.getElementById('content').innerText = output;
    }
    `;
}
