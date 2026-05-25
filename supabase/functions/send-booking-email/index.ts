import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@resend.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  type: "new_booking" | "booking_confirmed" | "booking_cancelled";
  student_id: string;
  teacher_id: string;
  lesson_date: string;
  lesson_time: string;
  teacher_name?: string;
  student_name?: string;
  cancelled_by?: "student" | "teacher";
  auto_confirmed?: boolean;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("bg-BG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function buildEmailContent(
  body: BookingEmailRequest,
  studentEmail: string | undefined,
  teacherEmail: string | undefined,
  studentName: string,
  teacherName: string
): { to: string; subject: string; html: string }[] {
  const dateFormatted = formatDate(body.lesson_date);
  const timeFormatted = body.lesson_time.slice(0, 5);
  const emails: { to: string; subject: string; html: string }[] = [];

  switch (body.type) {
    case "new_booking": {
      if (teacherEmail) {
        const statusNote = body.auto_confirmed
          ? "Часът е автоматично потвърден."
          : "Моля, влезте в профила си, за да потвърдите или откажете заявката.";

        emails.push({
          to: teacherEmail,
          subject: body.auto_confirmed
            ? "Нов записан час"
            : "Нова заявка за урок",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1a1a2e; margin-bottom: 16px;">
                ${body.auto_confirmed ? "Нов записан час" : "Нова заявка за урок"}
              </h2>
              <p style="color: #333; font-size: 15px;">
                <strong>${studentName}</strong> е запазил час при Вас.
              </p>
              <div style="background: #f4f6fb; border-radius: 10px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Дата:</strong> ${dateFormatted}</p>
                <p style="margin: 4px 0;"><strong>Час:</strong> ${timeFormatted} ч.</p>
              </div>
              <p style="color: #555; font-size: 14px;">${statusNote}</p>
            </div>
          `,
        });
      }

      if (body.auto_confirmed && studentEmail) {
        emails.push({
          to: studentEmail,
          subject: "Часът ви е потвърден",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1a1a2e; margin-bottom: 16px;">Часът ви е потвърден!</h2>
              <p style="color: #333; font-size: 15px;">
                Вашият час при <strong>${teacherName}</strong> е автоматично потвърден.
              </p>
              <div style="background: #f4f6fb; border-radius: 10px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Дата:</strong> ${dateFormatted}</p>
                <p style="margin: 4px 0;"><strong>Час:</strong> ${timeFormatted} ч.</p>
              </div>
              <p style="color: #555; font-size: 14px;">До скоро!</p>
            </div>
          `,
        });
      }
      break;
    }

    case "booking_confirmed": {
      if (studentEmail) {
        emails.push({
          to: studentEmail,
          subject: "Часът ви е потвърден",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1a1a2e; margin-bottom: 16px;">Часът ви е потвърден!</h2>
              <p style="color: #333; font-size: 15px;">
                <strong>${teacherName}</strong> потвърди Вашия час.
              </p>
              <div style="background: #f4f6fb; border-radius: 10px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Дата:</strong> ${dateFormatted}</p>
                <p style="margin: 4px 0;"><strong>Час:</strong> ${timeFormatted} ч.</p>
              </div>
              <p style="color: #555; font-size: 14px;">До скоро!</p>
            </div>
          `,
        });
      }
      break;
    }

    case "booking_cancelled": {
      if (body.cancelled_by === "student" && teacherEmail) {
        emails.push({
          to: teacherEmail,
          subject: "Отменен час",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #c0392b; margin-bottom: 16px;">Отменен час</h2>
              <p style="color: #333; font-size: 15px;">
                <strong>${studentName}</strong> е отменил запазения си час.
              </p>
              <div style="background: #fdf2f2; border-radius: 10px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Дата:</strong> ${dateFormatted}</p>
                <p style="margin: 4px 0;"><strong>Час:</strong> ${timeFormatted} ч.</p>
              </div>
            </div>
          `,
        });
      } else if (body.cancelled_by === "teacher" && studentEmail) {
        emails.push({
          to: studentEmail,
          subject: "Отменен час",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #c0392b; margin-bottom: 16px;">Отменен час</h2>
              <p style="color: #333; font-size: 15px;">
                <strong>${teacherName}</strong> е отменил Вашия час.
              </p>
              <div style="background: #fdf2f2; border-radius: 10px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Дата:</strong> ${dateFormatted}</p>
                <p style="margin: 4px 0;"><strong>Час:</strong> ${timeFormatted} ч.</p>
              </div>
              <p style="color: #555; font-size: 14px;">Можете да запишете друг час.</p>
            </div>
          `,
        });
      }
      break;
    }
  }

  return emails;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: BookingEmailRequest = await req.json();
    const { student_id, teacher_id } = body;

    if (!student_id || !teacher_id) {
      return new Response(
        JSON.stringify({ error: "student_id and teacher_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [studentRes, teacherRes] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(student_id),
      supabaseAdmin.auth.admin.getUserById(teacher_id),
    ]);

    const studentUser = studentRes.data?.user;
    const teacherUser = teacherRes.data?.user;

    const studentEmail = studentUser?.email;
    const teacherEmail = teacherUser?.email;

    const studentName =
      body.student_name ||
      [studentUser?.user_metadata?.first_name, studentUser?.user_metadata?.last_name]
        .filter(Boolean)
        .join(" ") ||
      "Ученик";

    const teacherName =
      body.teacher_name ||
      teacherUser?.user_metadata?.full_name ||
      "Учител";

    const emails = buildEmailContent(body, studentEmail, teacherEmail, studentName, teacherName);

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipient email found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = await Promise.allSettled(
      emails.map((email) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [email.to],
            subject: email.subject,
            html: email.html,
          }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(JSON.stringify(data));
          return data;
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (failed > 0) {
      console.error(
        "Some emails failed:",
        results
          .filter((r) => r.status === "rejected")
          .map((r) => (r as PromiseRejectedResult).reason)
      );
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
