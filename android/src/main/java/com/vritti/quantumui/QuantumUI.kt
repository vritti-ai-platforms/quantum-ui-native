package com.vritti.quantumui

import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class QuantumUI : HybridQuantumUISpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}
