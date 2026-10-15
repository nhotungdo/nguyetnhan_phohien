// Test e2e realtime chat: Guest (SignalR) <-> Admin (SignalR)
import * as signalR from "@microsoft/signalr";

const API = "http://localhost:5050";
const log = (...a) => console.log(...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function assert(cond, name) {
  if (cond) log(`✅ ${name}`);
  else { failures++; log(`❌ ${name}`); }
}

const sleep = wait;

async function main() {
  // 1. Guest creates session via REST
  const res = await fetch(`${API}/api/chat/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestName: "E2E Khach", guestPhone: "0909xxxx" }),
  });
  const creds = await res.json();
  assert(creds.sessionId && creds.sessionToken, "guest session created");

  const guestMsgs = [];
  const adminMsgs = [];

  // 2. Guest connects SignalR & joins group (like useLiveChat)
  const guest = new signalR.HubConnectionBuilder()
    .withUrl(`${API}/hubs/chat`, { skipNegotiation: false })
    .build();
  guest.on("ReceiveAdminMessage", (m) => guestMsgs.push(m));
  guest.on("MessagesRead", () => log("  (guest: MessagesRead)"));
  const guestRes = [];
  guest.on("SessionDeleted", (d) => log("  (guest: SessionDeleted)", d.sessionKey));

  await guest.start();
  await guest.invoke("JoinAsGuest", creds.sessionId, creds.sessionToken, "E2E Khach", "0909xxxx");
  log("guest connected + joined");

  // 3. Admin connects & joins (like useAdminChat)
  const adminConn = new signalR.HubConnectionBuilder()
    .withUrl(`${API}/hubs/chat`, { accessTokenFactory: () => ADMIN_TOKEN })
    .build();
  adminConn.on("ReceiveGuestMessage", (data) => adminMsgs.push(data));
  await adminConn.start();
  await adminConn.invoke("JoinAsAdmin");
  log("admin connected + joined");

  // 4. Guest sends message via hub
  await guest.invoke("SendGuestMessage", creds.sessionId, creds.sessionToken, "Tin qua SignalR!");
  await sleep(800);
  assert(adminMsgs.length === 1, "admin received guest message realtime");
  assert(adminMsgs[0]?.session?.sessionId === creds.sessionId, "payload includes session info");

  // 5. Admin replies via hub (like useAdminChat sendMessage)
  const adminReplies = [];
  adminConn.on("AdminReplied", (d) => adminReplies.push(d));
  const guid = adminMsgs[0]?.session?.id;
  await adminConn.invoke("AdminReply", { ChatSessionId: guid, Content: "Admin tra loi hub" });
  await sleep(800);
  assert(guestMsgs.some((m) => m.content === "Admin tra loi hub"), "guest received admin reply realtime");
  assert(adminReplies.length >= 1, "admin tabs got AdminReplied echo");

  // 6. Typing indicators
  let typing = false;
  adminConn.on("GuestTyping", () => (typing = true));
  await guest.invoke("GuestTyping", creds.sessionId, creds.sessionToken, true);
  await sleep(500);
  assert(typing, "admin sees guest typing");

  let adminTypingSeen = false;
  guest.on("AdminTyping", () => (adminTypingSeen = true));
  await adminConn.invoke("AdminTyping", guid, true);
  await sleep(500);
  assert(adminTypingSeen, "guest sees admin typing");

  // 7. Guest mark-read REST -> GuestReadMessages broadcast to admin group
  let guestReadSeen = false;
  adminConn.on("GuestReadMessages", () => (guestReadSeen = true));
  await fetch(`${API}/api/chat/messages/${creds.sessionId}/read`, {
    method: "PUT",
    headers: { "X-Chat-Token": creds.sessionToken },
  });
  await sleep(500);
  assert(guestReadSeen, "admin sees guest read receipt");

  // 8. Session cleanup state via admin REST
  const sessRes = await fetch(`${API}/api/chat/sessions`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  const sessions = await sessRes.json();
  const mine = sessions.find((s) => s.sessionId === creds.sessionId);
  assert(mine && (mine.lastMessagePreview === "Tin qua SignalR!" || mine.lastMessagePreview === "Admin tra loi hub"), `session preview updated (got: ${mine?.lastMessagePreview})`);
  assert(mine && mine.guestPhone === "0909xxxx", "guest phone stored");

  await guest.stop();
  await adminConn.stop();
  log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

// admin token via env
const ADMIN_TOKEN = process.argv[2];
if (!ADMIN_TOKEN) {
  console.error("usage: node chat-e2e-test.mjs <adminJwt>");
  process.exit(2);
}
await main();
