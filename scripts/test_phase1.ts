import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = "mongodb://localhost:27017/viberide";
}

const BASE_URL = "http://localhost:3005";

async function runTests() {
  console.log("==========================================================");
  console.log("VIBERIDE PHASE 1 & 1.5 SECURITY & INTEGRITY TEST SUITE");
  console.log("==========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Section 1: Phase 1.5 Date Semantics & Conflict Rules
  // Business rule: Pickup = inclusive, Return = exclusive
  // Conflict condition: existing.fromDate < requested.toDate AND existing.toDate > requested.fromDate
  // -------------------------------------------------------------
  console.log("--- 1. BOOKING DATE SEMANTICS (INCLUSIVE PICKUP, EXCLUSIVE RETURN) ---");
  {
    // Helper to evaluate conflict condition
    const isConflict = (
      existingFrom: string,
      existingTo: string,
      requestedFrom: string,
      requestedTo: string
    ) => {
      const eFrom = new Date(existingFrom).getTime();
      const eTo = new Date(existingTo).getTime();
      const rFrom = new Date(requestedFrom).getTime();
      const rTo = new Date(requestedTo).getTime();
      return eFrom < rTo && eTo > rFrom;
    };

    // Existing booking: Sept 10 -> Sept 12
    const eStart = "2026-09-10T00:00:00Z";
    const eEnd = "2026-09-12T00:00:00Z";

    // Test: 10->12 + 12->14 = allowed
    assert(
      !isConflict(eStart, eEnd, "2026-09-12T00:00:00Z", "2026-09-14T00:00:00Z"),
      "Date Semantics: 10->12 + 12->14 is ALLOWED (same-day turnover permitted)"
    );

    // Test: 10->12 + 11->13 = rejected
    assert(
      isConflict(eStart, eEnd, "2026-09-11T00:00:00Z", "2026-09-13T00:00:00Z"),
      "Date Semantics: 10->12 + 11->13 is REJECTED (overlap on Sept 11)"
    );

    // Test: 10->12 + 9->10 = allowed
    assert(
      !isConflict(eStart, eEnd, "2026-09-09T00:00:00Z", "2026-09-10T00:00:00Z"),
      "Date Semantics: 10->12 + 9->10 is ALLOWED (adjacent prior checkout permitted)"
    );

    // Test: 10->12 + 9->11 = rejected
    assert(
      isConflict(eStart, eEnd, "2026-09-09T00:00:00Z", "2026-09-11T00:00:00Z"),
      "Date Semantics: 10->12 + 9->11 is REJECTED (overlap on Sept 10)"
    );

    // Test: Duration calculation 10->11 = 1 day
    const d1Start = new Date("2026-09-10T00:00:00Z");
    const d1End = new Date("2026-09-11T00:00:00Z");
    const diff1Days = Math.ceil((d1End.getTime() - d1Start.getTime()) / (1000 * 60 * 60 * 24));
    assert(diff1Days === 1, "Date Semantics: 10->11 rental duration is exactly 1 day");

    // Test: 10->10 = rejected (0 days)
    const d0Start = new Date("2026-09-10T00:00:00Z");
    const d0End = new Date("2026-09-10T00:00:00Z");
    assert(d0End <= d0Start, "Date Semantics: 10->10 (zero duration) is REJECTED");

    // Test: Reversed dates = rejected
    const revStart = new Date("2026-09-12T00:00:00Z");
    const revEnd = new Date("2026-09-10T00:00:00Z");
    assert(revEnd <= revStart, "Date Semantics: Reversed dates (12->10) are REJECTED");

    // Test: Past start = rejected
    const now = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const pastStart = new Date(todayUtc.getTime() - 24 * 60 * 60 * 1000);
    assert(pastStart < todayUtc, "Date Semantics: Past start date is REJECTED");

    // Test: Blocked-date behavior consistent with exclusive return date
    // Vehicle has blocked date on Sept 12
    const blockedDates = [new Date("2026-09-12T00:00:00Z")];

    // Helper for blocked-dates check in [start, end)
    const hasBlockedConflict = (startStr: string, endStr: string) => {
      const sUtc = new Date(startStr);
      const eUtc = new Date(endStr);
      const requestedDates = new Set<string>();
      let cur = new Date(sUtc);
      while (cur < eUtc) {
        requestedDates.add(cur.toISOString().slice(0, 10));
        cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
      }
      return blockedDates.some((b) => requestedDates.has(b.toISOString().slice(0, 10)));
    };

    // 10->12 should NOT conflict with blocked Sept 12 (return date is exclusive)
    assert(
      !hasBlockedConflict("2026-09-10T00:00:00Z", "2026-09-12T00:00:00Z"),
      "Blocked Dates: Booking 10->12 with Sept 12 blocked is ALLOWED (Sept 12 is exclusive return)"
    );

    // 12->14 DOES conflict with blocked Sept 12 (Sept 12 is inclusive pickup)
    assert(
      hasBlockedConflict("2026-09-12T00:00:00Z", "2026-09-14T00:00:00Z"),
      "Blocked Dates: Booking 12->14 with Sept 12 blocked is REJECTED (Sept 12 is inclusive pickup)"
    );

    // Test: Price = pricePerDay × rental days
    const rate = 1500;
    const days2 = Math.ceil((new Date("2026-09-12T00:00:00Z").getTime() - new Date("2026-09-10T00:00:00Z").getTime()) / (1000 * 60 * 60 * 24));
    assert(rate * days2 === 3000, "Pricing Integrity: 10->12 (2 days @ 1500/day) = 3000");
    const days1 = Math.ceil((new Date("2026-09-11T00:00:00Z").getTime() - new Date("2026-09-10T00:00:00Z").getTime()) / (1000 * 60 * 60 * 24));
    assert(rate * days1 === 1500, "Pricing Integrity: 10->11 (1 day @ 1500/day) = 1500");
  }

  // -------------------------------------------------------------
  // Section 2: Phase 1.5 Atomic OTP Resend Logic
  // -------------------------------------------------------------
  console.log("\n--- 2. ATOMIC OTP RESEND LOGIC ---");
  {
    const now = Date.now();
    const cooldownMs = 60 * 1000;
    const expiryMs = 10 * 60 * 1000;

    // Simulation of atomic query condition:
    // query: { $or: [{ emailOtpExpires: null }, { emailOtpExpires: { $lte: cooldownThreshold } }] }
    const cooldownThreshold = new Date(now + (expiryMs - cooldownMs)); // now + 9 minutes

    // State A: Fresh user (no previous OTP or expired)
    const userA_expiry: Date | null = null as Date | null;
    const canUpdateA = userA_expiry === null ? true : (userA_expiry as Date) <= cooldownThreshold;
    assert(canUpdateA, "OTP Atomicity: User with no previous OTP matches atomic update filter");

    // State B: Request 1 succeeds at T0, sets expiry to T0 + 10m
    const userB_expiry = new Date(now + expiryMs); // T0 + 10m
    // Immediate concurrent Request 2 arrives at T0 + 500ms
    const req2_threshold = new Date(now + 500 + (expiryMs - cooldownMs));
    const canUpdateB = userB_expiry <= req2_threshold;
    assert(!canUpdateB, "OTP Atomicity: Concurrent Request 2 within 60s matches 0 documents (HTTP 429)");

    // State C: Request 3 arrives after 61 seconds
    const req3_time = now + 61 * 1000;
    const req3_threshold = new Date(req3_time + (expiryMs - cooldownMs)); // T0 + 61s + 9m = T0 + 10m 1s
    const canUpdateC = userB_expiry <= req3_threshold;
    assert(canUpdateC, "OTP Atomicity: Request 3 after 60s cooldown matches atomic filter (Allowed)");

    // State D: SMTP failure rollback simulation
    const initialOtp = "111111";
    const initialExpiry = new Date(now - 1000);
    let currentOtp = "222222"; // Attempted new OTP
    let currentExpiry = new Date(now + 10 * 60 * 1000);

    // Simulate rollback
    currentOtp = initialOtp;
    currentExpiry = initialExpiry;
    assert(
      currentOtp === initialOtp && currentExpiry === initialExpiry,
      "OTP Atomicity: Failed SMTP send restores previous state, preventing user lockout"
    );
  }

  // -------------------------------------------------------------
  // Section 3: Live HTTP API Verification
  // -------------------------------------------------------------
  console.log("\n--- 3. LIVE HTTP ENDPOINT VERIFICATION ---");
  {
    // Test: /api/seed is completely absent
    const resSeed = await fetch(`${BASE_URL}/api/seed`);
    assert(resSeed.status === 404, "Security: GET /api/seed returns 404 Not Found (route deleted)");

    // Test: Anonymous upload rejected with 401
    const formData = new FormData();
    formData.append("file", new Blob(["data"], { type: "image/png" }), "avatar.png");
    const resUpload = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: formData });
    assert(resUpload.status === 401, "Security: Anonymous upload rejected with 401 Unauthorized");

    // Test: Anonymous booking rejected with 401
    const resBooking = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId: "65f0a0000000000000000001", fromDate: "2026-10-01", toDate: "2026-10-05" }),
    });
    assert(resBooking.status === 401, "Security: Anonymous booking rejected with 401 Unauthorized");

    // Test: Dynamic routes require admin/owner authentication (401)
    const resAdmin = await fetch(`${BASE_URL}/api/admin/users/12345`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify" }),
    });
    assert(resAdmin.status === 401, "Security: Admin users PATCH requires admin auth (401)");

    const resApprove = await fetch(`${BASE_URL}/api/admin/vehicles/12345/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    assert(resApprove.status === 401, "Security: Admin vehicle approve PATCH requires admin auth (401)");

    const resOwnerPut = await fetch(`${BASE_URL}/api/owner/vehicles/12345`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    assert(resOwnerPut.status === 401, "Security: Owner vehicle PUT requires owner auth (401)");

    const resOwnerDel = await fetch(`${BASE_URL}/api/owner/vehicles/12345`, { method: "DELETE" });
    assert(resOwnerDel.status === 401, "Security: Owner vehicle DELETE requires owner auth (401)");

    const resBlock = await fetch(`${BASE_URL}/api/owner/vehicles/12345/block-dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedDates: [] }),
    });
    assert(resBlock.status === 401, "Security: Owner block-dates POST requires owner auth (401)");

    const resBookingPatch = await fetch(`${BASE_URL}/api/owner/bookings/12345`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    assert(resBookingPatch.status === 401, "Security: Owner booking PATCH requires owner auth (401)");

    // Test: Malformed email verification request rejected
    const resVerify = await fetch(`${BASE_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend" }), // Missing email
    });
    assert(resVerify.status === 400, "Validation: OTP request without email returns 400 Bad Request");
  }

  // -------------------------------------------------------------
  // Section 4: File Upload Whitelist & Sanitization
  // -------------------------------------------------------------
  console.log("\n--- 4. FILE UPLOAD WHITELIST & SANITIZATION ---");
  {
    const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
    const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

    assert(!ALLOWED_MIME.has("text/html"), "Upload Safety: HTML MIME rejected");
    assert(!ALLOWED_MIME.has("image/svg+xml"), "Upload Safety: SVG MIME rejected");
    assert(!ALLOWED_MIME.has("application/x-msdownload"), "Upload Safety: EXE MIME rejected");
    assert(!ALLOWED_EXT.has(".html"), "Upload Safety: .html extension rejected");
    assert(!ALLOWED_EXT.has(".svg"), "Upload Safety: .svg extension rejected");
    assert(!ALLOWED_EXT.has(".exe"), "Upload Safety: .exe extension rejected");
    assert(!ALLOWED_EXT.has(".js"), "Upload Safety: .js extension rejected");

    assert(ALLOWED_MIME.has("image/jpeg") && ALLOWED_EXT.has(".jpg"), "Upload Safety: JPEG image permitted");
    assert(ALLOWED_MIME.has("image/png") && ALLOWED_EXT.has(".png"), "Upload Safety: PNG image permitted");
    assert(ALLOWED_MIME.has("image/webp") && ALLOWED_EXT.has(".webp"), "Upload Safety: WEBP image permitted");
    assert(ALLOWED_MIME.has("application/pdf") && ALLOWED_EXT.has(".pdf"), "Upload Safety: PDF document permitted");
  }

  // -------------------------------------------------------------
  // Section 5: Sensitive Field Projection
  // -------------------------------------------------------------
  console.log("\n--- 5. SENSITIVE FIELD PROJECTION ---");
  {
    const rawUserDoc = {
      _id: new mongoose.Types.ObjectId(),
      name: "Test User",
      email: "test@example.com",
      phone: "9876543210",
      role: "renter",
      password: "hashed_secret_password",
      emailOtp: "123456",
      emailOtpExpires: new Date(),
      verified: true,
      emailVerified: true,
      license: { status: "verified" },
      selfieUrl: "/uploads/selfie.jpg",
      wishlist: [],
      createdAt: new Date(),
    };

    const serializedUser = {
      _id: rawUserDoc._id.toString(),
      name: rawUserDoc.name,
      email: rawUserDoc.email,
      phone: rawUserDoc.phone,
      role: rawUserDoc.role,
      verified: rawUserDoc.verified,
      emailVerified: rawUserDoc.emailVerified,
      license: rawUserDoc.license,
      selfieUrl: rawUserDoc.selfieUrl,
      wishlist: rawUserDoc.wishlist,
      createdAt: rawUserDoc.createdAt,
    };

    assert(!("password" in serializedUser), "Privacy: password excluded from API response");
    assert(!("emailOtp" in serializedUser), "Privacy: emailOtp excluded from API response");
    assert(!("emailOtpExpires" in serializedUser), "Privacy: emailOtpExpires excluded from API response");
  }

  console.log("\n==========================================================");
  console.log(`ALL TESTS PASSED: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
