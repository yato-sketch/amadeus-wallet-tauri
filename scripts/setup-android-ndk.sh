set -e

ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
SDKMANAGER=""
for candidate in \
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" \
  "$ANDROID_HOME/tools/bin/sdkmanager"; do
  if [[ -x "$candidate" ]]; then
    SDKMANAGER="$candidate"
    break
  fi
done
if [[ -z "$SDKMANAGER" && -d "$ANDROID_HOME/cmdline-tools" ]]; then
  found=$(find "$ANDROID_HOME/cmdline-tools" -maxdepth 3 -type f -name "sdkmanager" 2>/dev/null | head -1)
  if [[ -n "$found" && -x "$found" ]]; then
    SDKMANAGER="$found"
  fi
fi
if [[ -z "$SDKMANAGER" || ! -x "$SDKMANAGER" ]]; then
  echo "Error: sdkmanager not found under ANDROID_HOME=$ANDROID_HOME"
  echo "Install from Android Studio: Settings → Languages & Frameworks → Android SDK → SDK Tools → check 'Android SDK Command-line Tools (latest)' → Apply"
  echo "Or set ANDROID_HOME if your SDK is elsewhere."
  exit 1
fi

echo "Using ANDROID_HOME=$ANDROID_HOME"
echo "Installing NDK (accept licenses with 'y' if prompted)..."
if ! yes | "$SDKMANAGER" --sdk_root="$ANDROID_HOME" --install "ndk;26.1.10909125"; then
  echo "That version failed. Try: $SDKMANAGER --sdk_root=$ANDROID_HOME --list | grep ndk"
  echo "Then: yes | $SDKMANAGER --sdk_root=$ANDROID_HOME --install \"ndk;<version>\""
  exit 1
fi

NDK_DIR=$(find "$ANDROID_HOME/ndk" -maxdepth 1 -type d -name "[0-9]*" 2>/dev/null | sort -V | tail -1)
if [[ -z "$NDK_DIR" || ! -d "$NDK_DIR" ]]; then
  echo "NDK install path not found. Check $ANDROID_HOME/ndk/"
  exit 1
fi

echo ""
echo "NDK installed at: $NDK_DIR"
echo ""
echo "Add to your ~/.bashrc or ~/.zshrc:"
echo "  export ANDROID_HOME=\"$ANDROID_HOME\""
echo "  export ANDROID_NDK_HOME=\"$NDK_DIR\""
echo ""
echo "Then run: source ~/.bashrc   (or source ~/.zshrc)"
echo "After that: pnpm tauri android dev"
