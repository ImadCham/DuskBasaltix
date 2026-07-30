export function getGoogleCalendarUrl() {
  const title = encodeURIComponent("DUSK EVE × BASALTE");
  const details = encodeURIComponent(
    "Soirée Collaboration Exclusive: DUSK EVE SOUNDS × BASALTE\nCHI Restaurant Bar — 3977 Boul. Saint-Laurent, Montréal, QC\nPrésente ton QR Code à l'entrée. Arrive tôt, repars tard!"
  );
  const location = encodeURIComponent("CHI Restaurant Bar, 3977 Boul. Saint-Laurent, Montréal, QC");
  // 2026-08-14 22:00:00 to 2026-08-15 03:00:00 UTC-4 -> 20260815T020000Z to 20260815T070000Z
  const dates = "20260815T020000Z/20260815T070000Z";

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

export function downloadIcsFile() {
  const csData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Dusk Eve x Basalte//NONGNS
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
SUMMARY:DUSK EVE × BASALTE
DESCRIPTION:Soirée Collaboration Exclusive: DUSK EVE SOUNDS × BASALTE\\nCHI Restaurant Bar — 3977 Boul. Saint-Laurent\\, Montréal\\, QC\\nPrésente ton QR Code à l'entrée. Arrive tôt\\, repars tard!
LOCATION:CHI Restaurant Bar\\, 3977 Boul. Saint-Laurent\\, Montréal\\, QC
DTSTART:20260815T020000Z
DTEND:20260815T070000Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([csData], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "dusk-eve-x-basalte.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
