/**
 * Fridge Inventory – Google Apps Script バックエンド
 *
 * ■ セットアップ手順
 * 1. このファイルを Google Apps Script エディタに貼り付け
 * 2. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」
 *    - 実行ユーザー: 自分
 *    - アクセスできるユーザー: 全員
 * 3. 発行された URL を Vercel/Vite の環境変数 VITE_SHEETS_API_URL に設定
 */

// ─── 設定 ────────────────────────────────────────────────────────────────────
var SPREADSHEET_ID = "1XDzK2LXQzXFvAMohGRoMusp3YBY3G8HqvO6MfMn25Og";
var DRIVE_FOLDER_ID = "1e17xOkROdD3V9hRjHHeZrQWCUbx8D9R3";
var SHEET_NAME = "inventory";
var COLUMNS = [
  "id", "householdId", "locationId", "category", "imageUrl",
  "name", "quantity", "quantityCaption", "expiresAt", "note",
  "updatedAt", "source"
];
var TRANSACTION_SHEET_NAME = "transactions";
var TRANSACTION_COLUMNS = [
  "id", "householdId", "itemId", "itemName", "type", "quantity", "note", "recordedAt"
];
// ─────────────────────────────────────────────────────────────────────────────

function getSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
    sheet.setFrozenRows(1);
    return sheet;
  }
  // ヘッダー行がなければ挿入
  var firstCell = sheet.getRange(1, 1).getValue();
  if (firstCell !== "id") {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function listItems() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var items = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // id が空の行はスキップ
    var idIdx = headers.indexOf("id");
    if (!row[idIdx]) continue;
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val !== "" && val !== null && val !== undefined) {
        item[headers[j]] = val;
      }
    }
    // quantity は数値に変換
    if (item["quantity"] !== undefined) {
      item["quantity"] = Number(item["quantity"]);
    }
    items.push(item);
  }
  return items;
}

function upsertItem(itemData) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = headers.indexOf("id");

  var id = itemData.id || Utilities.getUuid();
  var now = new Date().toISOString();
  var merged = {};
  for (var k = 0; k < COLUMNS.length; k++) {
    merged[COLUMNS[k]] = "";
  }
  for (var key in itemData) {
    merged[key] = itemData[key] !== undefined ? itemData[key] : "";
  }
  merged["id"] = id;
  merged["updatedAt"] = now;
  if (!merged["source"]) merged["source"] = "manual";

  var row = COLUMNS.map(function(col) {
    var v = merged[col];
    return v !== undefined ? v : "";
  });

  // 既存行を検索して更新 or 末尾に追加
  var found = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][idIdx] === id) {
      sheet.getRange(i + 1, 1, 1, COLUMNS.length).setValues([row]);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow(row);
  }

  // 戻り値として InventoryItem を返す
  var result = {};
  for (var c = 0; c < COLUMNS.length; c++) {
    if (row[c] !== "") result[COLUMNS[c]] = row[c];
  }
  result["quantity"] = Number(result["quantity"]);
  return result;
}

function removeItem(id) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = headers.indexOf("id");
  // 末尾から検索して削除（行番号がずれないように）
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][idIdx] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function getTransactionSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(TRANSACTION_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TRANSACTION_SHEET_NAME);
    sheet.appendRow(TRANSACTION_COLUMNS);
    sheet.setFrozenRows(1);
    return sheet;
  }
  var firstCell = sheet.getRange(1, 1).getValue();
  if (firstCell !== "id") {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, TRANSACTION_COLUMNS.length).setValues([TRANSACTION_COLUMNS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function listTransactions() {
  var sheet = getTransactionSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var records = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var idIdx = headers.indexOf("id");
    if (!row[idIdx]) continue;
    var record = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val !== "" && val !== null && val !== undefined) {
        record[headers[j]] = val;
      }
    }
    if (record["quantity"] !== undefined) {
      record["quantity"] = Number(record["quantity"]);
    }
    records.push(record);
  }
  // 新しい順（recordedAt 降順）で返す
  records.sort(function(a, b) {
    return (b["recordedAt"] || "").localeCompare(a["recordedAt"] || "");
  });
  return records;
}

function addTransaction(recordData) {
  var sheet = getTransactionSheet();
  var id = recordData.id || Utilities.getUuid();
  var now = new Date().toISOString();
  var merged = {};
  for (var k = 0; k < TRANSACTION_COLUMNS.length; k++) {
    merged[TRANSACTION_COLUMNS[k]] = "";
  }
  for (var key in recordData) {
    merged[key] = recordData[key] !== undefined ? recordData[key] : "";
  }
  merged["id"] = id;
  merged["recordedAt"] = now;

  var row = TRANSACTION_COLUMNS.map(function(col) {
    var v = merged[col];
    return v !== undefined ? v : "";
  });

  sheet.appendRow(row);

  var result = {};
  for (var c = 0; c < TRANSACTION_COLUMNS.length; c++) {
    if (row[c] !== "") result[TRANSACTION_COLUMNS[c]] = row[c];
  }
  result["quantity"] = Number(result["quantity"]);
  return result;
}

function uploadImage(base64Data, filename, mimeType) {
  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType, filename);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  // 直接表示できる URL を返す
  return "https://drive.google.com/uc?export=view&id=" + file.getId();
}

// ─── HTTP ハンドラ ─────────────────────────────────────────────────────────

function doGet(e) {
  try {
    var resource = e && e.parameter && e.parameter.resource;
    var data;
    if (resource === "transactions") {
      data = listTransactions();
    } else {
      data = listItems();
    }
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var result;

    if (action === "upsert") {
      result = upsertItem(body.item);
    } else if (action === "remove") {
      removeItem(body.id);
      result = { success: true };
    } else if (action === "addTransaction") {
      result = addTransaction(body.record);
    } else if (action === "uploadImage") {
      var url = uploadImage(body.base64, body.filename, body.mimeType);
      result = { url: url };
    } else {
      result = { error: "Unknown action: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
