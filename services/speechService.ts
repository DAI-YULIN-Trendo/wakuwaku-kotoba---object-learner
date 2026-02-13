/**
 * ブラウザの Web Speech API（iOS Safari / デスクトップ対応）。
 * 必ずユーザー操作（タップ/クリック）のハンドラ内で同期的に呼ぶこと（iOS 制限）。
 */
export function speakText(text: string): void {
  if (!text?.trim()) return;
  const synth = window.speechSynthesis;
  // 前の再生を止める（iOS で重なると出ないことがある）
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9;
  // iOS: ユーザー操作の直後で speak するため、同期的に呼ぶ
  synth.speak(utterance);
}
