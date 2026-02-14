/**
 * Agentify Open API v2 非流式チャットで画像から物体名（ひらがな）を取得。
 * 拼图形式：AuthKey はユーザー入力（パスワード）をデコードしたもの。コードには書かない。
 * token = authKey + '.' + authSecret。agentId も同じ値（ユーザーが入れた拼图）を使用。
 *
 * 注意: Agentify 側の Agent で「画像入力」＋視覚モデルを設定すること。
 */

const DEFAULT_HOST = 'https://agentify.jp';
const AUTH_SECRET = import.meta.env.VITE_AGENTIFY_AUTH_SECRET ?? 'CXlzOuQuAzt6nUf38vNZ3hTrogfLM2VZ';

const host = import.meta.env.VITE_AGENTIFY_HOST ?? DEFAULT_HOST;

let authKey: string | null = null;

/** 拼图：ユーザーが入力したパスワード（Base64 または hex）をデコードした AuthKey をセット */
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
      agentId: authKey,
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

  // Agent が画像を見れない等で英文を返した場合はエラー扱い（ひらがな単語以外）
  const looksLikeError =
    /can't see|cannot see|I'm sorry|I don't|describe the image/i.test(text) ||
    (text.length > 20 && /^[\x00-\x7F]+$/.test(text));
  if (looksLikeError) {
    throw new Error('AGENT_NO_IMAGE');
  }

  return text;
}
