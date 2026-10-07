const NOT_JSON =
  'The script did not return JSON. Deploy it as a web app with "Who has access" set to "Anyone", then use the /exec link.';

function base() {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) throw new Error("APPS_SCRIPT_URL is not set in .env.local");
  return url;
}

async function parse(res: Response) {
  if (!res.ok) throw new Error(`Apps Script returned ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(NOT_JSON);
  }
}

export async function gasGet(qs = "") {
  return parse(await fetch(base() + qs, { cache: "no-store", redirect: "follow" }));
}

export async function gasPost(body: unknown) {
  return parse(
    await fetch(base(), {
      method: "POST",
      cache: "no-store",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    })
  );
}

export function scriptFailed(res: any): string | null {
  if (res && (res.success === false || res.error)) return String(res.error || res.message || "The script rejected the request");
  return null;
}
