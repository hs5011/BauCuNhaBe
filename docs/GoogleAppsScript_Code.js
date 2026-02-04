/**
 * Google Apps Script - Gắn vào 1 file Google Sheet làm backend cho Hệ thống Bầu cử.
 *
 * HƯỚNG DẪN:
 * 1. Tạo 1 Google Sheet mới (drive.google.com → Trống).
 * 2. Đặt tên file tùy ý (VD: "BauCuNhaBe Data").
 * 3. Tạo đúng 4 sheet con bên dưới với tên CHÍNH XÁC: Users, Voters, VotingAreas, ElectionSettings.
 * 4. Trong Sheet: Mở Extensions → Apps Script, xóa code mặc định và dán toàn bộ file này vào.
 * 5. Lưu (Ctrl+S), chọn tên project (VD: "BauCu Backend").
 * 6. Deploy: Deploy → New deployment → Loại "Web app":
 *    - Execute as: Me (Thực thi với tài khoản: Tôi)
 *    - Who has access: Anyone (Quyền truy cập: BẤT KỲ AI — bắt buộc, nếu chọn "Chỉ mình tôi" sẽ bị lỗi 403 khi gọi từ app)
 * 7. Authorize (đăng nhập Google khi được hỏi), sau đó copy "Web app URL" và dán vào app (Cấu hình → Google Sheet).
 *
 * Cấu trúc từng sheet (dòng 1 = tiêu đề):
 *
 * - Users: id | fullName | position | email | phone | username | password | role | votingArea
 * - Voters: id | fullName | idCard | address | neighborhood | constituency | votingGroup | votingArea | hasVoted | votedAt
 * - VotingAreas: id | name
 * - ElectionSettings: key | value  (ví dụ: election_end_time | 2026-05-23T17:00:00)
 */

function getSheetByName(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function readSheetAsObjects(sheetName) {
  var sheet = getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function readElectionSettings() {
  var sheet = getSheetByName('ElectionSettings');
  var data = sheet.getDataRange().getValues();
  var out = { election_end_time: '' };
  if (data && data.length >= 2) {
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'election_end_time') {
        out.election_end_time = data[i][1] || '';
        break;
      }
    }
  }
  return out;
}

function writeSheetFromObjects(sheetName, objects, headers) {
  var sheet = getSheetByName(sheetName);
  sheet.clear();
  if (!objects || objects.length === 0) {
    if (headers && headers.length) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  var rows = [headers];
  for (var i = 0; i < objects.length; i++) {
    var row = [];
    for (var j = 0; j < headers.length; j++) {
      row.push(objects[i][headers[j]] !== undefined ? objects[i][headers[j]] : '');
    }
    rows.push(row);
  }
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
}

function writeElectionSettings(settings) {
  var sheet = getSheetByName('ElectionSettings');
  sheet.clear();
  var rows = [['key', 'value']];
  if (settings && settings.election_end_time !== undefined) {
    rows.push(['election_end_time', settings.election_end_time]);
  }
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
}

function ensureHeaders(sheetName, headers) {
  var sheet = getSheetByName(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var ok = true;
  for (var i = 0; i < headers.length; i++) {
    if (String(firstRow[i] || '') !== headers[i]) { ok = false; break; }
  }
  if (!ok) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function appendObjects(sheetName, objects, headers) {
  var sheet = getSheetByName(sheetName);
  ensureHeaders(sheetName, headers);
  if (!objects || objects.length === 0) return { ok: true, appended: 0 };
  var rows = [];
  for (var i = 0; i < objects.length; i++) {
    var row = [];
    for (var j = 0; j < headers.length; j++) {
      row.push(objects[i][headers[j]] !== undefined ? objects[i][headers[j]] : '');
    }
    rows.push(row);
  }
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, headers.length).setValues(rows);
  return { ok: true, appended: rows.length };
}

function doGet(e) {
  var result = {
    users: [],
    voters: [],
    votingAreas: [],
    election_end_time: ''
  };

  if (e && e.parameter && e.parameter.all === '1') {
    result.users = readSheetAsObjects('Users');
    result.voters = readSheetAsObjects('Voters');
    result.votingAreas = readSheetAsObjects('VotingAreas');
    var es = readElectionSettings();
    result.election_end_time = es.election_end_time || '';
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var payload = null;
  try {
    if (e && e.parameter && e.parameter.payload) {
      payload = JSON.parse(e.parameter.payload);
    } else if (e && e.postData && e.postData.contents) {
      var body = e.postData.contents;
      if (typeof body === 'string') {
        if (body.indexOf('payload=') === 0) {
          var raw = body.replace(/^payload=/, '');
          raw = raw.replace(/\+/g, ' ');
          payload = JSON.parse(decodeURIComponent(raw));
        } else if (body.trim().startsWith('{')) {
          payload = JSON.parse(body);
        } else {
          return ContentService
            .createTextOutput(JSON.stringify({ ok: false, error: 'Body không hợp lệ. Nhận được: ' + body.substring(0, 100) }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: false, error: 'postData.contents không phải string' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Không nhận được payload. e.parameter: ' + JSON.stringify(e && e.parameter) + ', postData: ' + (e && e.postData ? 'có' : 'không') }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'Invalid payload: ' + (err && err.message) + '. Body: ' + (e && e.postData && e.postData.contents ? String(e.postData.contents).substring(0, 200) : 'null') }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (!payload || !payload.sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'Missing sheet' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sheetName = payload.sheet;
  var data = payload.data;
  var action = payload.action || 'replace';

  try {
    if (sheetName === 'Users') {
      var userHeaders = ['id', 'fullName', 'position', 'email', 'phone', 'username', 'password', 'role', 'votingArea'];
      if (action === 'append') appendObjects('Users', Array.isArray(data) ? data : [], userHeaders);
      else writeSheetFromObjects('Users', Array.isArray(data) ? data : [], userHeaders);
    } else if (sheetName === 'Voters') {
      var voterHeaders = ['id', 'fullName', 'idCard', 'address', 'neighborhood', 'constituency', 'votingGroup', 'votingArea', 'hasVoted', 'votedAt'];
      if (action === 'append') {
        var r = appendObjects('Voters', Array.isArray(data) ? data : [], voterHeaders);
        return ContentService
          .createTextOutput(JSON.stringify({ ok: true, appended: r.appended }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        writeSheetFromObjects('Voters', Array.isArray(data) ? data : [], voterHeaders);
      }
    } else if (sheetName === 'VotingAreas') {
      var areaHeaders = ['id', 'name'];
      if (action === 'append') appendObjects('VotingAreas', Array.isArray(data) ? data : [], areaHeaders);
      else writeSheetFromObjects('VotingAreas', Array.isArray(data) ? data : [], areaHeaders);
    } else if (sheetName === 'ElectionSettings') {
      writeElectionSettings(data || {});
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Unknown sheet: ' + sheetName }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: (err && err.message) || String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
