/**
 * Agentify Open API v2 非流式チャットで画像から物体名（ひらがな）を取得。
 * 内部プロンプトは userChatInput で渡す。chatId は毎回空。
 * トークンは「パスワード（AuthKey）」+ AuthSecret で組み立て。ページ先頭で入力したパスワードを AuthKey として挿入。
 */

const DEFAULT_HOST = 'https://agentify.jp';
const DEFAULT_AGENT_ID = 'c827d7785d2d468b9d913f85a23e7f4d';
const AUTH_SECRET = import.meta.env.VITE_AGENTIFY_AUTH_SECRET ?? 'CXlzOuQuAzt6nUf38vNZ3hTrogfLM2VZ';

const host = import.meta.env.VITE_AGENTIFY_HOST ?? DEFAULT_HOST;
const agentId = import.meta.env.VITE_AGENTIFY_AGENT_ID ?? DEFAULT_AGENT_ID;

let authKey: string | null = null;

/** パスワード（AuthKey）を設定。API 呼び出し時に token = authKey + '.' + authSecret として使用 */
export function setAgentifyAuthKey(key: string): void {
  authKey = key;
}

function getToken(): string {
  if (!authKey) throw new Error('Not authenticated');
  return `${authKey}.${AUTH_SECRET}`;
}

// 識図用の内部プロンプト（userChatInput として送信）
const IMAGE_PROMPT =
  'You are a teacher for Japanese toddlers. Look at the image and identify the main object. Return ONLY the name of the object in Japanese Hiragana. Do NOT use Kanji. Do NOT use Katakana unless absolutely necessary (try to convert to Hiragana if possible for kids). Do NOT write sentences. Just the single word. Example: if you see a car, return "くるま". If you see an apple, return "りんご".';

export async function identifyObject(base64Image: string, _mimeType: string): Promise<string> {
  const res = await fetch(`${host}/openapi/v2/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      agentId,
      chatId: null,
      userChatInput: IMAGE_PROMPT,
      images: [{ url: base64Image }],
      state: {},
      debug: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Agentify API Error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const choices = data.choices ?? [];
  const textParts = choices
    .filter((c: { type?: string; content?: string }) => c.type === 'text' && c.content)
    .map((c: { content: string }) => c.content);
  const text = textParts.join('').trim();
  if (!text) throw new Error('No text returned from agent');
  return text;
}
