package com.margelo.nitro.com.vritti.quantumui

import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class QuantumUI : HybridQuantumUISpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  // SF Symbols are iOS-only; DynamicIcon.android.tsx renders Material symbols instead,
  // so this is never called at runtime. Spec contract: '' on non-iOS platforms.
  override fun renderSFSymbol(
    name: String,
    size: Double,
    color: Double,
    weight: String,
    multicolor: Boolean,
  ): String = ""
}
