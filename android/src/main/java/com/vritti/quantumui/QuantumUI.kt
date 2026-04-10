package com.vritti.quantumui

import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.com.vritti.quantumui.HybridQuantumUISpec

@DoNotStrip
class QuantumUI : HybridQuantumUISpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}