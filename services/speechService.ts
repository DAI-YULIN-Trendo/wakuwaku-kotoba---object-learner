/**
 * ブラウザの Web Speech API（iOS Safari / デスクトップ対応）。
 *
 * iOS Safari の制限：
 *   - 最初の speak() はユーザー操作内でも音が出ないことがある（「ウォームアップ」が必要）。
 *   - warmUp() をパスワード解除などの早いタイミングで呼んでおく。
 *   - speakText() は必ずタップ/クリックのハンドラ内で同期的に呼ぶ。
 */

let warmedUp = false;

/**
 * iOS 用ウォームアップ。ユーザー操作（ボタンクリック等）の中で一度呼ぶと、
 * 以降の speak() が通るようになる。空文字を speak してすぐ cancel する。
 */
export function warmUp(): void {
  if (warmedUp) return;
  warmedUp = true;
  const synth = window.speechSynthesis;
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  u.lang = 'ja-JP';
  synth.speak(u);
  // 念のためすぐ cancel（無音で終了させる）
  setTimeout(() => synth.cancel(), 100);
}

export function speakText(text: string): void {
  if (!text?.trim()) return;
  const synth = window.speechSynthesis;

  // iOS: cancel してから少し待たないと次の speak が無視されることがある
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9;
  utterance.volume = 1;

  // iOS Safari: cancel 直後の speak が無視されるケースがあるので、微小遅延で再試行
  synth.speak(utterance);

  // フォールバック：200ms 後にまだ speaking でなければ再度 speak
  setTimeout(() => {
    if (!synth.speaking) {
      synth.speak(utterance);
    }
  }, 250);
}
