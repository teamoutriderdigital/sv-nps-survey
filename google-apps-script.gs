/**
 * Supply Velocity — NPS + Core-Value Survey → Google Sheet
 * ------------------------------------------------------------------
 * Receives submissions from index.html and appends one row per
 * response to the Google Sheet this script is bound to.
 *
 * Self-adjusting: it writes a column for whatever fields the form
 * sends. If you add or remove a question in index.html later, you do
 * NOT need to touch or redeploy this script — a new column simply
 * appears the first time that field is submitted.
 *
 * SETUP (one time, ~5 min — see README.md):
 *   1. Create a Google Sheet (this becomes your responses database).
 *   2. Extensions ▸ Apps Script. Delete the sample code.
 *   3. Paste THIS whole file in.  ▸ Save (💾).
 *   4. Deploy ▸ New deployment ▸ type "Web app".
 *        - Execute as:       Me
 *        - Who has access:   Anyone      (must be "Anyone", not the domain)
 *      Deploy, authorize, COPY the Web app URL.
 *   5. Paste that URL into ENDPOINT_URL near the bottom of index.html.
 *
 * To change the code later: Save, then
 *   Deploy ▸ Manage deployments ▸ ✏️ ▸ Version: New version ▸ Deploy.
 * ------------------------------------------------------------------
 */

// Optional: email alert whenever a Detractor (NPS 0–6) responds. Blank = off.
var ALERT_EMAIL = ""; // e.g. "team@supplyvelocity.com"

// Friendly column headers for known fields, in this display order.
// Any field the form sends that isn't listed here is still saved —
// it just gets appended as a new column using its raw key name.
var FIELD_LABELS = {
  timestamp:           "Timestamp",
  score:               "NPS Score (0-10)",
  category:            "NPS Category",
  value_delivered:     "Value Delivered (1-3)",
  quality:             "Quality of Work (1-3)",
  easy_to_do_business: "Easy to Do Business (1-3)",
  reason:              "Comments",
  name:                "Name",
  company:             "Company",
  email:               "Email",
  page:                "Source Page",
  userAgent:           "User Agent"
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // serialize concurrent submissions
  try {
    var data = JSON.parse(e.postData.contents);
    data.timestamp = new Date();

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Determine the ordered list of field keys to store:
    // known fields first (in FIELD_LABELS order), then any extras.
    var keys = Object.keys(FIELD_LABELS).filter(function (k) {
      return k in data;
    });
    Object.keys(data).forEach(function (k) {
      if (keys.indexOf(k) === -1) keys.push(k);
    });

    ensureHeaders_(sheet, keys);

    // Build the row in the exact order of the current header row.
    var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = header.map(function (label) {
      var key = keyForLabel_(label);
      var v = data[key];
      return (v === undefined || v === null) ? "" : v;
    });
    sheet.appendRow(row);

    if (ALERT_EMAIL && Number(data.score) <= 6) sendDetractorAlert_(data);

    return json_({ result: "success" });
  } catch (err) {
    return json_({ result: "error", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Open the Web app URL in a browser to confirm it's live.
function doGet() {
  return json_({ status: "Supply Velocity survey endpoint is live." });
}

/* ---------- helpers ---------- */

// Make sure every key has a header column; add new ones as needed.
function ensureHeaders_(sheet, keys) {
  if (sheet.getLastRow() === 0) {
    var labels = keys.map(labelForKey_);
    sheet.getRange(1, 1, 1, labels.length).setValues([labels]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    return;
  }
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  keys.forEach(function (key) {
    var label = labelForKey_(key);
    if (header.indexOf(label) === -1) {
      sheet.getRange(1, header.length + 1)
           .setValue(label).setFontWeight("bold");
      header.push(label);
    }
  });
}

function labelForKey_(key) { return FIELD_LABELS[key] || key; }

function keyForLabel_(label) {
  for (var k in FIELD_LABELS) { if (FIELD_LABELS[k] === label) return k; }
  return label; // extra columns are keyed by their raw name
}

function sendDetractorAlert_(data) {
  var who = data.company || data.name || "Anonymous";
  var subject = "⚠️ NPS Detractor (" + data.score + ") — " + who;
  var body =
    "A client submitted a low NPS score.\n\n" +
    "NPS Score:            " + data.score + " (" + data.category + ")\n" +
    "Value delivered:      " + (data.value_delivered || "—") + "\n" +
    "Quality of work:      " + (data.quality || "—") + "\n" +
    "Easy to do business:  " + (data.easy_to_do_business || "—") + "\n" +
    "Name:                 " + (data.name || "—") + "\n" +
    "Company:              " + (data.company || "—") + "\n" +
    "Email:                " + (data.email || "—") + "\n\n" +
    "Comments:\n" + (data.reason || "—") + "\n";
  MailApp.sendEmail(ALERT_EMAIL, subject, body);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
