/**
 * ブラウザの Web Speech API（iOS Safari / デスクトップ対応）。
 * ユーザー操作（例：青ボタンクリック）の直後に呼ぶこと。
 */
export function speakText(text: string): void {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  window.speechSynthesis.speak(utterance);
}
