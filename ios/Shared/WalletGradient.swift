import Foundation
import SwiftUI

struct WalletGradient {
    static let SegwitHD: [Color] = [Color(hex: "#007AFF"), Color(hex: "#0040FF")]
    static let Segwit: [Color] = [Color(hex: "#6CD9FC"), Color(hex: "#44BEE5")]
    static let LightningCustodial: [Color] = [Color(hex: "#F1AA07"), Color(hex: "#FD7E37")]
    static let LightningLDK: [Color] = [Color(hex: "#8584FF"), Color(hex: "#5351FB")]
    static let SegwitNative: [Color] = [Color(hex: "#6CD9FC"), Color(hex: "#44BEE5")]
    static let WatchOnly: [Color] = [Color(hex: "#474646"), Color(hex: "#282828")]
    static let MultiSig: [Color] = [Color(hex: "#1ce6eb"), Color(hex: "#296fc5"), Color(hex: "#3500A2")]
    static let DefaultGradients: [Color] = [Color(hex: "#B770F6"), Color(hex: "#9013FE")]

    static func gradients(for type: WalletType) -> [Color] {
        switch type {
        case .SegwitHD:
            return WalletGradient.SegwitHD
        case .Segwit:
            return WalletGradient.Segwit
        case .LightningCustodial:
            return WalletGradient.LightningCustodial
        case .LightningLDK:
            return WalletGradient.LightningLDK
        case .SegwitNative:
            return WalletGradient.SegwitNative
        case .WatchOnly:
            return WalletGradient.WatchOnly
        case .MultiSig:
            return WalletGradient.MultiSig
        }
    }
}
