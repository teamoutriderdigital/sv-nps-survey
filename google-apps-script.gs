/**
 * Supply Velocity — NPS Survey → Google Sheet
 * ------------------------------------------------------------------
 * This script receives submissions from index.html and appends one
 * row per response to the Google Sheet it is bound to.
 *
 * SETUP (about 5 minutes — see README.md for screenshots-level detail):
 *   1. Create a Google Sheet (this becomes your responses database).
 *   2. Extensions ▸ Apps Script. Delete the sample code.
 *   3. Paste THIS file in. Save.
 *   4. Deploy ▸ New deployment ▸ type "Web app".
 *        - Execute as:  Me
 *        - Who has access:  Anyone
 *      Click Deploy, authorize, and COPY the Web app URL.
 *   5. Paste that URL into ENDPOINT_URL at the top of index.html.
 * ------------------------------------------------------------------
 */

// Optional: get an email alert whenever a Detractor (score 0–6) responds.
// Leave blank to disable.
var ALERT_EMAIL = ""; // e.g. "feedback@supplyvelocity.com"

var HEADERS = [
  "Timestamp", "Score", "Category", "Reason",
  "Name", "Company", "Email", "Page", "User Agent"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // avoid race conditions on concurrent submits
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Write header row on first run
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      data.score,
      data.category || "",
      data.reason || "",
      data.name || "",
      data.company || "",
      data.email || "",
      data.page || "",
      data.userAgent || ""
    ]);

    if (ALERT_EMAIL && Number(data.score) <= 6) {
      sendDetractorAlert(data);
    }

    return json({ result: "success" });
  } catch (err) {
    return json({ result: "error", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the Web app URL in a browser to confirm it's live.
function doGet() {
  return json({ status: "Supply Velocity NPS endpoint is live." });
}

function sendDetractorAlert(data) {
  var subject = "⚠️ NPS Detractor (" + data.score + ") — " +
                (data.company || data.name || "Anonymous");
  var body =
    "A client submitted a low NPS score.\n\n" +
    "Score:    " + data.score + " (" + data.category + ")\n" +
    "Name:     " + (data.name || "—") + "\n" +
    "Company:  " + (data.company || "—") + "\n" +
    "Email:    " + (data.email || "—") + "\n\n" +
    "Reason:\n" + (data.reason || "—") + "\n";
  MailApp.sendEmail(ALERT_EMAIL, subject, body);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
