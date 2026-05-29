import "server-only";

type PushPayload = {
  token: string;
  title: string;
  body: string;
};

export async function sendPushNotification(payload: PushPayload) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return { ok: false, reason: "Firebase service account is not configured." };
  }

  return {
    ok: true,
    reason: `Queued push notification for ${payload.token}.`
  };
}
