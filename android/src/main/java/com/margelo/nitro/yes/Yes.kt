package com.margelo.nitro.yes
  
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class Yes : HybridYesSpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}
