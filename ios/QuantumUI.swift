import UIKit

class QuantumUI: HybridQuantumUISpec {
    public func multiply(a: Double, b: Double) throws -> Double {
        return a * b
    }

    // Renders an SF Symbol to a PNG data URI (see the .nitro spec). Displayed by DynamicIcon via RN's
    // Fabric-native <Image>, so no legacy RCTViewManager interop view is created — the tab-cross-fade
    // unmount crash ("unmount a view mounted inside different view") is eliminated. `color` is an ARGB int
    // from JS `processColor()`. Returns "" on any failure so callers render an empty icon box.
    public func renderSFSymbol(
        name: String,
        size: Double,
        color: Double,
        weight: String,
        multicolor: Bool
    ) throws -> String {
        guard #available(iOS 13.0, *) else { return "" }

        let pointSize = CGFloat(size)
        let config = UIImage.SymbolConfiguration(pointSize: pointSize, weight: Self.symbolWeight(weight))
        guard let base = UIImage(systemName: name, withConfiguration: config) else { return "" }

        // ARGB int (processColor format): 0xAARRGGBB.
        let argb = UInt32(bitPattern: Int32(truncatingIfNeeded: Int(color)))
        let alpha = CGFloat((argb >> 24) & 0xff) / 255.0
        let red = CGFloat((argb >> 16) & 0xff) / 255.0
        let green = CGFloat((argb >> 8) & 0xff) / 255.0
        let blue = CGFloat(argb & 0xff) / 255.0
        let tint = UIColor(red: red, green: green, blue: blue, alpha: alpha == 0 ? 1 : alpha)

        let templated: UIImage = multicolor
            ? base.withRenderingMode(.alwaysOriginal)
            : base.withTintColor(tint, renderingMode: .alwaysTemplate)

        // Rasterize at screen scale so the PNG is crisp when <Image> displays it at `size` points.
        let drawSize = base.size == .zero ? CGSize(width: pointSize, height: pointSize) : base.size
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = UIScreen.main.scale
        format.opaque = false
        let rendered = UIGraphicsImageRenderer(size: drawSize, format: format).image { _ in
            templated.draw(in: CGRect(origin: .zero, size: drawSize))
        }

        guard let data = rendered.pngData() else { return "" }
        return "data:image/png;base64," + data.base64EncodedString()
    }

    @available(iOS 13.0, *)
    private static func symbolWeight(_ s: String) -> UIImage.SymbolWeight {
        switch s {
        case "ultralight": return .ultraLight
        case "thin": return .thin
        case "light": return .light
        case "medium": return .medium
        case "semibold": return .semibold
        case "bold": return .bold
        case "heavy": return .heavy
        case "black": return .black
        default: return .regular
        }
    }
}
